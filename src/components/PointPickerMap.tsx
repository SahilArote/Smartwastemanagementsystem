import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { Navigation, Compass, Loader2, Sparkles, Check, MapPin } from 'lucide-react';
import type { CollectionPoint } from '../types';

interface PointPickerMapProps {
  latitude: number;
  longitude: number;
  onChangeCoordinates: (lat: number, lng: number) => void;
  existingPoints?: CollectionPoint[];
  currentPointId?: string;
  height?: string;
  onAddressResolved?: (address: string) => void;
}

export const PointPickerMap: React.FC<PointPickerMapProps> = ({
  latitude,
  longitude,
  onChangeCoordinates,
  existingPoints = [],
  currentPointId,
  height = '340px',
  onAddressResolved,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const activeMarkerRef = useRef<L.Marker | null>(null);
  const existingMarkersGroupRef = useRef<L.LayerGroup | null>(null);

  const [isLocating, setIsLocating] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [resolveSuccess, setResolveSuccess] = useState(false);

  // Keep latest callback ref to avoid re-binding Leaflet event listeners
  const onChangeCoordinatesRef = useRef(onChangeCoordinates);
  useEffect(() => {
    onChangeCoordinatesRef.current = onChangeCoordinates;
  }, [onChangeCoordinates]);

  // Create the draggable active pin icon
  const createActivePinIcon = () => {
    return L.divIcon({
      className: 'picker-active-marker',
      html: `
        <div class="picker-pin-wrapper">
          <div class="picker-pin-pulse"></div>
          <div class="picker-pin-marker">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#4f46e5" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
              <circle cx="12" cy="10" r="3" fill="#ffffff"></circle>
            </svg>
          </div>
        </div>
      `,
      iconSize: [36, 46],
      iconAnchor: [18, 42],
      popupAnchor: [0, -40],
    });
  };

  // Initialize Map
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    if ((container as any)._leaflet_id) {
      (container as any)._leaflet_id = null;
    }

    const initialLat = Number.isFinite(latitude) && latitude !== 0 ? latitude : 18.5204;
    const initialLng = Number.isFinite(longitude) && longitude !== 0 ? longitude : 73.8567;

    const map = L.map(container, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: true,
      attributionControl: false,
    });

    const tileUrl =
      import.meta.env.VITE_MAP_TILE_URL ||
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    L.tileLayer(tileUrl, {
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Existing points layer
    const existingGroup = L.layerGroup().addTo(map);
    existingMarkersGroupRef.current = existingGroup;

    // Draggable active marker
    const marker = L.marker([initialLat, initialLng], {
      icon: createActivePinIcon(),
      draggable: true,
      autoPan: true,
    }).addTo(map);

    marker.bindTooltip('📍 Drag me or click map to set location', {
      direction: 'top',
      offset: [0, -38],
      className: 'picker-tooltip',
      permanent: false,
    });

    // Handle marker dragging
    marker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      const newLat = Number(pos.lat.toFixed(6));
      const newLng = Number(pos.lng.toFixed(6));
      onChangeCoordinatesRef.current(newLat, newLng);
    });

    // Handle map clicks
    map.on('click', (e: L.LeafletMouseEvent) => {
      const newLat = Number(e.latlng.lat.toFixed(6));
      const newLng = Number(e.latlng.lng.toFixed(6));
      marker.setLatLng([newLat, newLng]);
      onChangeCoordinatesRef.current(newLat, newLng);
    });

    activeMarkerRef.current = marker;
    mapInstanceRef.current = map;

    // Ensure Leaflet tiles render completely on mount & when dialog finishes transition
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 300);
    const t3 = setTimeout(() => map.invalidateSize(), 600);

    // ResizeObserver for container changes
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        map.invalidateSize();
      });
      ro.observe(container);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (ro) ro.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (container) {
        (container as any)._leaflet_id = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker position and pan when coordinates change externally
  useEffect(() => {
    const marker = activeMarkerRef.current;
    const map = mapInstanceRef.current;
    if (!marker || !map) return;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    const currentPos = marker.getLatLng();
    const distance = Math.hypot(currentPos.lat - latitude, currentPos.lng - longitude);

    if (distance > 0.00005) {
      marker.setLatLng([latitude, longitude]);
      map.panTo([latitude, longitude], { animate: true, duration: 0.5 });
    }
  }, [latitude, longitude]);

  // Render existing nearby points on map as subtle reference markers
  useEffect(() => {
    const existingGroup = existingMarkersGroupRef.current;
    if (!existingGroup) return;

    existingGroup.clearLayers();

    existingPoints
      .filter((p) => p.id !== currentPointId && Number.isFinite(p.latitude) && Number.isFinite(p.longitude))
      .forEach((point) => {
        const miniIcon = L.divIcon({
          className: 'picker-reference-marker',
          html: `
            <div style="
              width: 14px;
              height: 14px;
              border-radius: 50%;
              background: rgba(148, 163, 184, 0.85);
              border: 2px solid #ffffff;
              box-shadow: 0 1px 4px rgba(0,0,0,0.35);
            "></div>
          `,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        const m = L.marker([point.latitude, point.longitude], {
          icon: miniIcon,
          interactive: true,
        });

        m.bindTooltip(`<strong>${point.name}</strong><br/>${point.waste_type} (${point.area})`, {
          direction: 'top',
          offset: [0, -8],
          className: 'picker-reference-tooltip',
        });

        m.addTo(existingGroup);
      });
  }, [existingPoints, currentPointId]);

  // Handle GPS Locate Me
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        if (activeMarkerRef.current) {
          activeMarkerRef.current.setLatLng([lat, lng]);
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 1 });
        }
        onChangeCoordinatesRef.current(lat, lng);
      },
      (error) => {
        setIsLocating(false);
        console.warn('Geolocation failed:', error);
        alert('Could not retrieve current GPS position. You can click on the map to pinpoint manually.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  // Quick preset center jump
  const handleJumpToPreset = useCallback((presetLat: number, presetLng: number) => {
    if (activeMarkerRef.current) {
      activeMarkerRef.current.setLatLng([presetLat, presetLng]);
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([presetLat, presetLng], 15, { duration: 0.8 });
    }
    onChangeCoordinatesRef.current(presetLat, presetLng);
  }, []);

  // Reverse Geocode using free OpenStreetMap Nominatim
  const handleReverseGeocode = useCallback(async () => {
    if (!onAddressResolved) return;
    setIsResolvingAddress(true);
    setResolveSuccess(false);

    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
          },
        }
      );
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.display_name) {
          const addr = data.address;
          // Build a readable concise street address
          const road = addr?.road || addr?.pedestrian || addr?.suburb || '';
          const neighbourhood = addr?.neighbourhood || addr?.suburb || addr?.city_district || '';
          const city = addr?.city || addr?.town || addr?.county || '';
          
          let formatted = [road, neighbourhood, city].filter(Boolean).join(', ');
          if (!formatted || formatted.length < 5) {
            formatted = data.display_name.split(',').slice(0, 3).join(', ');
          }

          onAddressResolved(formatted);
          setResolveSuccess(true);
          setTimeout(() => setResolveSuccess(false), 3000);
        }
      }
    } catch (err) {
      console.warn('Reverse geocode error:', err);
    } finally {
      setIsResolvingAddress(false);
    }
  }, [latitude, longitude, onAddressResolved]);

  return (
    <div className="point-picker-wrapper">
      {/* Top Banner with Instructions and Actions */}
      <div className="picker-header-controls">
        <div className="picker-guide-badge">
          <MapPin size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <span>Click map or drag pin to position</span>
        </div>

        <div className="picker-action-buttons">
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={handleLocateMe}
            disabled={isLocating}
            title="Use My Current GPS Location"
          >
            {isLocating ? <Loader2 size={12} className="spin-animate" /> : <Navigation size={12} />}
            <span>{isLocating ? 'Locating...' : 'My GPS'}</span>
          </button>

          {onAddressResolved && (
            <button
              type="button"
              className="btn btn-secondary btn-xs"
              onClick={handleReverseGeocode}
              disabled={isResolvingAddress}
              title="Auto-detect address from current marker pin"
            >
              {isResolvingAddress ? (
                <Loader2 size={12} className="spin-animate" />
              ) : resolveSuccess ? (
                <Check size={12} style={{ color: 'var(--accent-emerald)' }} />
              ) : (
                <Sparkles size={12} style={{ color: 'var(--accent-amber)' }} />
              )}
              <span>{resolveSuccess ? 'Address Set!' : 'Pin Address'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div
        className="picker-map-viewport"
        style={{ height, position: 'relative' }}
      >
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%', cursor: 'crosshair' }} />

        {/* Floating Quick Presets Pill */}
        <div className="picker-floating-presets">
          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontWeight: 600 }}>Quick Jump:</span>
          <button
            type="button"
            className="preset-chip"
            onClick={() => handleJumpToPreset(18.5204, 73.8567)}
          >
            Downtown
          </button>
          <button
            type="button"
            className="preset-chip"
            onClick={() => handleJumpToPreset(18.5248, 73.8436)}
          >
            Central
          </button>
          <button
            type="button"
            className="preset-chip"
            onClick={() => handleJumpToPreset(18.5368, 73.8935)}
          >
            East Sector
          </button>
          <button
            type="button"
            className="preset-chip"
            onClick={() => handleJumpToPreset(18.5412, 73.8291)}
          >
            Northwest
          </button>
        </div>
      </div>

      {/* Coordinate Display Bar */}
      <div className="picker-coord-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Compass size={13} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Lat:</span>
          <strong style={{ fontSize: '0.76rem', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
            {Number(latitude || 0).toFixed(6)}
          </strong>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>Lng:</span>
          <strong style={{ fontSize: '0.76rem', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
            {Number(longitude || 0).toFixed(6)}
          </strong>
        </div>

        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
          {existingPoints.length} reference points loaded
        </div>
      </div>
    </div>
  );
};
