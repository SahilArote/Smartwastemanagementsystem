import React, { useState, useEffect } from 'react';
import { 
  Route as RouteIcon, 
  Save, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  AlertTriangle, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import type { CollectionPoint, Route, RouteStop, RoutingResult, UserProfile } from '../types';
import { calculateNearestNeighbourOrder, fetchRoadRoute } from '../services/routing';
import { fetchWorkersFromDB, getDepots } from '../services/storage';
import { MapView } from './MapView';

interface RoutePlannerViewProps {
  collectionPoints: CollectionPoint[];
  currentUser: UserProfile;
  onSaveRoute: (route: Route) => void;
  onNavigateToRoutes: () => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const RoutePlannerView: React.FC<RoutePlannerViewProps> = ({
  collectionPoints,
  currentUser,
  onSaveRoute,
  onNavigateToRoutes,
  showToast,
}) => {
  const depots = getDepots();
  const [selectedDepotId, setSelectedDepotId] = useState<string>(depots[0].id);
  const selectedDepot = depots.find((d) => d.id === selectedDepotId) || depots[0];

  const [availableWorkers, setAvailableWorkers] = useState<UserProfile[]>([]);
  const [assignedWorkerId, setAssignedWorkerId] = useState<string>('worker-01');

  useEffect(() => {
    fetchWorkersFromDB().then((workers) => {
      setAvailableWorkers(workers);
      if (workers.length > 0) {
        setAssignedWorkerId(workers[0].id);
      }
    });
  }, []);

  // Selection of stops for planning
  const [selectedPointIds, setSelectedPointIds] = useState<string[]>(
    collectionPoints.slice(0, 5).map((p) => p.id)
  );

  // Ordered sequence of stops
  const [orderedStops, setOrderedStops] = useState<CollectionPoint[]>([]);
  const [routeResult, setRouteResult] = useState<RoutingResult | null>(null);

  // Planning Configuration
  const [prioritizeHigh, setPrioritizeHigh] = useState<boolean>(true);
  const [returnToDepot, setReturnToDepot] = useState<boolean>(false);
  const [routeName, setRouteName] = useState<string>(
    `Route ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} Sweep`
  );
  const [routeDate, setRouteDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // State flags
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [hasGenerated, setHasGenerated] = useState<boolean>(false);

  // Toggle selection of a point
  const handleTogglePoint = (pointId: string) => {
    setSelectedPointIds((prev) =>
      prev.includes(pointId) ? prev.filter((id) => id !== pointId) : [...prev, pointId]
    );
    setHasGenerated(false);
  };

  const handleSelectAll = () => {
    setSelectedPointIds(collectionPoints.map((p) => p.id));
    setHasGenerated(false);
  };

  const handleDeselectAll = () => {
    setSelectedPointIds([]);
    setOrderedStops([]);
    setRouteResult(null);
    setHasGenerated(false);
  };

  // Generate Ordered Route using Nearest-Neighbour + OSRM
  const handleGenerateRoute = async () => {
    if (selectedPointIds.length < 2) {
      showToast('Please select at least 2 collection points to generate a route', 'error');
      return;
    }

    setIsCalculating(true);

    try {
      const selectedPointsList = collectionPoints.filter((p) =>
        selectedPointIds.includes(p.id)
      );

      // 1. Run Nearest-Neighbour Heuristic Algorithm (PRD Section 8)
      const proposedOrder = calculateNearestNeighbourOrder(
        selectedDepot,
        selectedPointsList,
        prioritizeHigh
      );

      setOrderedStops(proposedOrder);

      // 2. Request road network geometry and road distance from OSRM
      const routing = await fetchRoadRoute(selectedDepot, proposedOrder, returnToDepot);
      setRouteResult(routing);
      setHasGenerated(true);

      if (routing.isFallback) {
        showToast(
          routing.error || 'Routing calculated with approximate road estimation fallback.',
          'info'
        );
      } else {
        showToast(
          `Optimal road route generated: ${routing.distanceKm} km (${routing.durationMinutes} min)`,
          'success'
        );
      }
    } catch (err: any) {
      showToast('Error calculating route: ' + err.message, 'error');
    } finally {
      setIsCalculating(false);
    }
  };

  // Recalculate OSRM geometry after manual stop reordering
  const handleRefreshGeometry = async (newOrder: CollectionPoint[]) => {
    setOrderedStops(newOrder);
    setIsCalculating(true);
    try {
      const routing = await fetchRoadRoute(selectedDepot, newOrder, returnToDepot);
      setRouteResult(routing);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCalculating(false);
    }
  };

  // Move stop up or down in sequence
  const handleMoveStop = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= orderedStops.length) return;

    const updated = [...orderedStops];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    handleRefreshGeometry(updated);
  };

  // Remove stop from current generated route
  const handleRemoveStopFromRoute = (pointId: string) => {
    const updated = orderedStops.filter((s) => s.id !== pointId);
    setSelectedPointIds((prev) => prev.filter((id) => id !== pointId));
    if (updated.length >= 2) {
      handleRefreshGeometry(updated);
    } else {
      setOrderedStops([]);
      setRouteResult(null);
      setHasGenerated(false);
    }
  };

  // Save Route to Database (FR-08)
  const handleSaveRoute = () => {
    if (orderedStops.length < 2) {
      showToast('Cannot save route with less than 2 stops', 'error');
      return;
    }

    if (!routeName.trim()) {
      showToast('Please specify a route name', 'error');
      return;
    }

    const assignedWorker = availableWorkers.find((p) => p.id === assignedWorkerId);
    const routeId = `route-${Date.now().toString().slice(-6)}`;

    // Build RouteStops with full snapshot preservation (PRD Section 11)
    const routeStops: RouteStop[] = orderedStops.map((stop, idx) => ({
      id: `stop-${routeId}-${idx + 1}`,
      route_id: routeId,
      collection_point_id: stop.id,
      stop_order: idx + 1,
      status: 'Pending',
      completed_at: null,
      updated_at: new Date().toISOString(),
      point_name: stop.name,
      point_area: stop.area,
      point_address: stop.address_text,
      latitude: stop.latitude,
      longitude: stop.longitude,
      waste_type: stop.waste_type,
      priority: stop.priority,
    }));

    const newRoute: Route = {
      id: routeId,
      route_name: routeName.trim(),
      route_date: routeDate,
      depot_name: selectedDepot.name,
      depot_latitude: selectedDepot.latitude,
      depot_longitude: selectedDepot.longitude,
      assigned_worker_id: assignedWorkerId,
      assigned_worker_name: assignedWorker?.full_name || 'Worker',
      total_distance_km: routeResult?.distanceKm || null,
      estimated_duration_min: routeResult?.durationMinutes || 45,
      route_geometry: routeResult?.coordinates,
      status: 'Scheduled',
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
      stops: routeStops,
    };

    onSaveRoute(newRoute);
    showToast(`Route "${routeName}" saved & assigned to ${assignedWorker?.full_name}!`, 'success');
    onNavigateToRoutes();
  };

  // Build lookup mapping point id -> stop order
  const stopOrderLookup: Record<string, number> = {};
  orderedStops.forEach((stop, index) => {
    stopOrderLookup[stop.id] = index + 1;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Route Planner Header & Setup */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RouteIcon size={22} color="#10b981" />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
                Algorithmic Route Planner
              </h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Nearest-Neighbour ordering heuristic with OSRM road network geometry (PRD Section 8)
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={handleGenerateRoute}
              disabled={isCalculating || selectedPointIds.length < 2}
              id="btn-generate-route"
            >
              {isCalculating ? (
                <>
                  <RotateCcw size={16} className="animate-spin" />
                  <span>Computing Road Route...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Generate Route ({selectedPointIds.length} stops)</span>
                </>
              )}
            </button>

            {hasGenerated && (
              <button
                className="btn btn-secondary"
                onClick={handleSaveRoute}
                id="btn-save-route-plan"
                style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.4)' }}
              >
                <Save size={16} />
                <span>Save & Assign Route</span>
              </button>
            )}
          </div>
        </div>

        {/* Input Parameters Form (FR-05, FR-08) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
          {/* Starting Depot Selection (FR-05) */}
          <div>
            <label className="form-label">Starting Depot / Yard (FR-05)</label>
            <select
              className="form-select"
              value={selectedDepotId}
              onChange={(e) => {
                setSelectedDepotId(e.target.value);
                setHasGenerated(false);
              }}
              id="select-depot"
            >
              {depots.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Route Name */}
          <div>
            <label className="form-label">Route Label / Name</label>
            <input
              type="text"
              className="form-input"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              placeholder="e.g. Morning Commercial Run"
            />
          </div>

          {/* Planned Date */}
          <div>
            <label className="form-label">Scheduled Date</label>
            <input
              type="date"
              className="form-input"
              value={routeDate}
              onChange={(e) => setRouteDate(e.target.value)}
            />
          </div>

          {/* Worker Assignment */}
          <div>
            <label className="form-label">Assign Field Worker</label>
            <select
              className="form-select"
              value={assignedWorkerId}
              onChange={(e) => setAssignedWorkerId(e.target.value)}
              id="select-worker"
            >
              {availableWorkers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.full_name} ({w.zone || 'Zone'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Algorithm Settings & Heuristic Options */}
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={prioritizeHigh}
              onChange={(e) => setPrioritizeHigh(e.target.checked)}
              style={{ accentColor: '#10b981' }}
            />
            <span>Prioritize High-Urgency Bins (Weighting Heuristic)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={returnToDepot}
              onChange={(e) => {
                setReturnToDepot(e.target.checked);
                if (orderedStops.length > 0) handleRefreshGeometry(orderedStops);
              }}
              style={{ accentColor: '#06b6d4' }}
            />
            <span>Round Trip (Return to Starting Depot)</span>
          </label>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={handleSelectAll}>
              Select All Bins ({collectionPoints.length})
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleDeselectAll}>
              Clear Selection
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Map Visualization + Ordered Stops (PRD Section 12) */}
      <div className="split-view-container">
        {/* Left: Interactive Map with Route Polyline */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>Interactive Route Geometry</h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                {routeResult
                  ? `${routeResult.isFallback ? 'Approximate Route' : 'OSRM Road Route'}: ${routeResult.distanceKm} km • ~${routeResult.durationMinutes} min drive`
                  : 'Select stops and click "Generate Route" to preview path'}
              </p>
            </div>

            {routeResult?.isFallback && (
              <span className="badge badge-medium" title={routeResult.error}>
                <AlertTriangle size={12} />
                <span>Estimate Fallback</span>
              </span>
            )}
          </div>

          <MapView
            depot={selectedDepot}
            collectionPoints={collectionPoints.filter((p) => selectedPointIds.includes(p.id))}
            selectedPointIds={selectedPointIds}
            stopOrderMap={stopOrderLookup}
            routeGeometry={routeResult?.coordinates}
            height="560px"
          />

          {routeResult && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', fontSize: '0.78rem' }}>
              <div style={{ color: '#cbd5e1' }}>
                🛣️ Total Road Distance: <strong style={{ color: '#10b981' }}>{routeResult.distanceKm} km</strong>
              </div>
              <div style={{ color: '#cbd5e1' }}>
                ⏱️ Estimated Transit + Service Time: <strong style={{ color: '#38bdf8' }}>{routeResult.durationMinutes} mins</strong>
              </div>
              <div style={{ color: '#94a3b8' }}>
                📌 Stops Count: <strong style={{ color: '#ffffff' }}>{orderedStops.length}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Right: Stop Selection & Sequence Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Ordered Stops List (When Generated) */}
          {orderedStops.length > 0 && (
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
                    Proposed Stop Sequence (FR-06)
                  </h4>
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    Reorder stops using arrows to customize driver order
                  </p>
                </div>
                <span className="badge badge-low">{orderedStops.length} Ordered Stops</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
                {orderedStops.map((stop, index) => (
                  <div
                    key={stop.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.6rem 0.75rem',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #06b6d4, #0284c7)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 700,
                        }}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ffffff' }}>
                          {stop.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                          {stop.area} • <span style={{ color: '#38bdf8' }}>{stop.waste_type}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        disabled={index === 0}
                        onClick={() => handleMoveStop(index, 'up')}
                        title="Move Earlier"
                        style={{ padding: '0.25rem 0.45rem' }}
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        disabled={index === orderedStops.length - 1}
                        onClick={() => handleMoveStop(index, 'down')}
                        title="Move Later"
                        style={{ padding: '0.25rem 0.45rem' }}
                      >
                        <ArrowDown size={12} />
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRemoveStopFromRoute(stop.id)}
                        title="Remove Stop"
                        style={{ padding: '0.25rem 0.45rem' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Collection Points Multi-Select Checklist (FR-05) */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
                Select Stops to Include ({selectedPointIds.length} Selected)
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '380px', overflowY: 'auto' }}>
              {collectionPoints.map((point) => {
                const isSelected = selectedPointIds.includes(point.id);
                return (
                  <div
                    key={point.id}
                    onClick={() => handleTogglePoint(point.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.55rem 0.75rem',
                      background: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${isSelected ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by div
                        style={{ accentColor: '#10b981' }}
                      />
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ffffff' }}>
                          {point.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                          📍 {point.area}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className={`badge badge-${point.priority.toLowerCase()}`} style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                        {point.priority}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        {point.waste_type.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
