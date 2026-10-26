import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { CollectionPoint, Depot } from '../types';

interface MapViewProps {
  depot?: Depot | { latitude: number; longitude: number; name?: string } | null;
  collectionPoints?: CollectionPoint[];
  selectedPointIds?: string[];
  stopOrderMap?: Record<string, number>; // pointId -> stop order number
  routeGeometry?: [number, number][] | null;
  onSelectPoint?: (point: CollectionPoint) => void;
  onMapClick?: (lat: number, lng: number) => void;
  pickMode?: boolean;
  temporaryMarker?: { lat: number; lng: number } | null;
  height?: string;
  zoom?: number;
  center?: [number, number];
}

export const MapView: React.FC<MapViewProps> = ({
  depot,
  collectionPoints = [],
  selectedPointIds = [],
  stopOrderMap = {},
  routeGeometry = null,
  onSelectPoint,
  onMapClick,
  pickMode = false,
  temporaryMarker = null,
  height = '520px',
  zoom = 13,
  center = [18.5204, 73.8567],
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const tempMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Reset container if Leaflet left an ID
    if ((mapContainerRef.current as any)._leaflet_id) {
      (mapContainerRef.current as any)._leaflet_id = null;
    }

    if (!mapInstanceRef.current) {
      const initialCenter: [number, number] = depot
        ? [depot.latitude, depot.longitude]
        : center;

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: zoom,
        zoomControl: true,
      });

      // Tiles (Defaults to standard 100% Free OpenStreetMap with no watermark or API key needed)
      const tileUrl =
        import.meta.env.VITE_MAP_TILE_URL ||
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      const tileAttribution =
        import.meta.env.VITE_MAP_ATTRIBUTION ||
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

      L.tileLayer(tileUrl, {
        attribution: tileAttribution,
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;

      // Handle map clicks
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (onMapClick) {
          onMapClick(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
        }
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (mapContainerRef.current) {
        (mapContainerRef.current as any)._leaflet_id = null;
      }
    };
  }, []);

  // Update cursor based on pickMode
  useEffect(() => {
    if (mapContainerRef.current) {
      mapContainerRef.current.style.cursor = pickMode ? 'crosshair' : 'grab';
    }
  }, [pickMode]);

  // Update Temporary Coordinate Picker Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tempMarkerRef.current) {
      tempMarkerRef.current.remove();
      tempMarkerRef.current = null;
    }

    if (temporaryMarker) {
      const pinHtml = `
        <div style="
          background: #ec4899;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
          border: 2px solid white;
          box-shadow: 0 0 14px rgba(236, 72, 153, 0.8);
        ">📍</div>
      `;
      const customIcon = L.divIcon({
        html: pinHtml,
        className: 'temp-marker-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      tempMarkerRef.current = L.marker([temporaryMarker.lat, temporaryMarker.lng], {
        icon: customIcon,
      }).addTo(map);

      map.panTo([temporaryMarker.lat, temporaryMarker.lng]);
    }
  }, [temporaryMarker]);

  // Update Markers and Route
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    const bounds = L.latLngBounds([]);

    // 1. Render Depot Marker
    if (depot) {
      const depotLat = depot.latitude;
      const depotLng = depot.longitude;
      bounds.extend([depotLat, depotLng]);

      const depotIconHtml = `
        <div class="custom-pin depot" title="Depot">
          🏢
        </div>
      `;

      const depotIcon = L.divIcon({
        html: depotIconHtml,
        className: 'leaflet-depot-marker',
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      });

      const depotMarker = L.marker([depotLat, depotLng], { icon: depotIcon });
      depotMarker.bindPopup(`
        <div style="min-width: 180px;">
          <div style="font-size: 11px; text-transform: uppercase; color: #60a5fa; font-weight: 700; margin-bottom: 2px;">
            Starting Facility / Depot
          </div>
          <div style="font-weight: 700; font-size: 14px; color: #1e293b; margin-bottom: 4px;">
            ${depot.name || 'Central Municipal Depot'}
          </div>
          <div style="font-size: 12px; color: #64748b;">
            Coordinates: ${depotLat.toFixed(4)}, ${depotLng.toFixed(4)}
          </div>
        </div>
      `);
      depotMarker.addTo(markersLayer);
    }

    // 2. Render Collection Points
    collectionPoints.forEach((point) => {
      bounds.extend([point.latitude, point.longitude]);
      const stopOrder = stopOrderMap[point.id];

      let iconClass = 'custom-pin ';
      let iconInner = '';

      if (stopOrder !== undefined) {
        iconClass += 'stop-order';
        iconInner = `<span>#${stopOrder}</span>`;
      } else {
        const priorityClass = point.priority.toLowerCase();
        iconClass += `${priorityClass}`;
        iconInner = point.priority === 'High' ? '!' : '●';
      }

      const pointIcon = L.divIcon({
        html: `<div class="${iconClass}">${iconInner}</div>`,
        className: 'leaflet-point-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([point.latitude, point.longitude], { icon: pointIcon });

      const popupHtml = `
        <div style="min-width: 210px; font-family: 'Plus Jakarta Sans', sans-serif;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 999px; background: ${point.priority === 'High' ? '#fee2e2; color: #b91c1c' : point.priority === 'Medium' ? '#fef3c7; color: #b45309' : '#dcfce7; color: #15803d'
        };">
              ${point.priority} Priority
            </span>
            <span style="font-size: 11px; font-weight: 600; color: #0284c7;">
              ${point.waste_type}
            </span>
          </div>
          <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #0f172a;">
            ${point.name}
          </h4>
          <p style="margin: 0 0 6px 0; font-size: 12px; color: #475569;">
            📍 ${point.address_text || point.area}
          </p>
          <div style="display: flex; gap: 8px; font-size: 11px; color: #64748b; margin-bottom: 8px;">
            <span>Area: <strong>${point.area}</strong></span>
            ${point.estimated_fill_percent ? `<span>Fill: <strong>${point.estimated_fill_percent}%</strong></span>` : ''}
          </div>
          ${stopOrder !== undefined
          ? `<div style="background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 6px; font-weight: 600; font-size: 11px; text-align: center;">Route Sequence: Stop #${stopOrder}</div>`
          : ''
        }
        </div>
      `;

      marker.bindPopup(popupHtml);

      if (onSelectPoint) {
        marker.on('click', () => onSelectPoint(point));
      }

      marker.addTo(markersLayer);
    });

    // 3. Render Route Polyline
    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }

    if (routeGeometry && routeGeometry.length > 1) {
      // Background glow line
      L.polyline(routeGeometry, {
        color: '#06b6d4',
        weight: 8,
        opacity: 0.35,
        smoothFactor: 1,
      }).addTo(markersLayer);

      // Main crisp road path
      const mainLine = L.polyline(routeGeometry, {
        color: '#10b981',
        weight: 4.5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(markersLayer);

      routePolylineRef.current = mainLine;
      bounds.extend(mainLine.getBounds());
    }

    // Fit bounds smoothly if we have valid elements
    if (bounds.isValid() && (collectionPoints.length > 0 || (routeGeometry && routeGeometry.length > 0))) {
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 15 });
    }
  }, [depot, collectionPoints, selectedPointIds, stopOrderMap, routeGeometry, onSelectPoint]);

  return (
    <div className="map-view-wrapper" style={{ height }}>
      {pickMode && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.92)',
            border: '1px solid #06b6d4',
            color: '#ffffff',
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 600,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#06b6d4' }}></span>
          Click anywhere on the map to set coordinates
        </div>
      )}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};
