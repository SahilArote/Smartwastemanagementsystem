import React, { useState, useEffect } from 'react';
import { 
  Save, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
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

const createDefaultRouteName = () => `Route ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} Collection Run`;
const getTodayDateString = () => new Date().toISOString().split('T')[0];
const createRouteId = () => `route-${Date.now().toString().slice(-6)}`;
const getIsoTimestamp = () => new Date().toISOString();

export const RoutePlannerView: React.FC<RoutePlannerViewProps> = ({
  collectionPoints,
  currentUser,
  onSaveRoute,
  onNavigateToRoutes,
  showToast,
}) => {
  const depots = getDepots();
  const [selectedDepotId, setSelectedDepotId] = useState<string>(depots[0]?.id || 'depot-central');
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
  const [routeName, setRouteName] = useState<string>(createDefaultRouteName);
  const [routeDate, setRouteDate] = useState<string>(getTodayDateString);

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

  const handleSelectCritical = () => {
    const critical = collectionPoints.filter((p) => (p.estimated_fill_percent || 0) >= 70).map((p) => p.id);
    setSelectedPointIds(critical.length > 0 ? critical : collectionPoints.slice(0, 4).map((p) => p.id));
    setHasGenerated(false);
  };

  const handleDeselectAll = () => {
    setSelectedPointIds([]);
    setOrderedStops([]);
    setRouteResult(null);
    setHasGenerated(false);
  };

  // Generate Suggested Route using Nearest-Neighbour Heuristic + OSRM
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

      // 1. Nearest-Neighbour Heuristic Algorithm
      const proposedOrder = calculateNearestNeighbourOrder(
        selectedDepot,
        selectedPointsList,
        prioritizeHigh
      );

      setOrderedStops(proposedOrder);

      // 2. Fetch road network geometry and road distance from OSRM
      const routing = await fetchRoadRoute(selectedDepot, proposedOrder, returnToDepot);
      setRouteResult(routing);
      setHasGenerated(true);

      if (routing.isFallback) {
        showToast(
          routing.error || 'Calculated with straight-line road estimation fallback.',
          'info'
        );
      } else {
        showToast(
          `Suggested road route generated: ${routing.distanceKm} km (~${routing.durationMinutes} min drive)`,
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

  // Save Route to Database
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
    const routeId = createRouteId();
    const currentIso = getIsoTimestamp();

    // Build RouteStops with snapshot preservation
    const routeStops: RouteStop[] = orderedStops.map((stop, idx) => ({
      id: `stop-${routeId}-${idx + 1}`,
      route_id: routeId,
      collection_point_id: stop.id,
      stop_order: idx + 1,
      status: 'Pending',
      completed_at: null,
      updated_at: currentIso,
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
      zone: orderedStops[0]?.area || 'Downtown Central',
      depot_name: selectedDepot.name,
      depot_latitude: selectedDepot.latitude,
      depot_longitude: selectedDepot.longitude,
      assigned_worker_id: assignedWorkerId,
      assigned_worker_name: assignedWorker?.full_name || 'Assigned Driver',
      total_distance_km: routeResult?.distanceKm || null,
      estimated_duration_min: routeResult?.durationMinutes || 45,
      route_geometry: routeResult?.coordinates,
      status: 'Scheduled',
      created_by: currentUser.full_name,
      created_at: currentIso,
      stops: routeStops,
    };

    onSaveRoute(newRoute);
    showToast(`Route "${routeName}" successfully dispatched to ${newRoute.assigned_worker_name}!`, 'success');
    onNavigateToRoutes();
  };

  // Build lookup mapping point id -> stop order
  const stopOrderLookup: Record<string, number> = {};
  orderedStops.forEach((stop, index) => {
    stopOrderLookup[stop.id] = index + 1;
  });

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Algorithmic Route Planner</h1>
          <p className="page-subtitle">
            Generate suggested multi-stop pickup routes using OSRM road geometry and heuristic sequencing
          </p>
        </div>

        <div className="page-actions-group">
          {hasGenerated && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSaveRoute}
            >
              <Save size={14} />
              <span>Save & Dispatch Route</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Left Configuration & Right Map/Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 420px) 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Column: Form Controls & Point Selection Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Step 1: Route Setup Card */}
          <div className="tailux-card">
            <div className="card-header">
              <h2 className="card-title">1. Route Parameters</h2>
            </div>

            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Route Title</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Scheduled Date</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={routeDate}
                    onChange={(e) => setRouteDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Launch Facility / Depot</label>
                  <select
                    className="form-select"
                    value={selectedDepotId}
                    onChange={(e) => {
                      setSelectedDepotId(e.target.value);
                      setHasGenerated(false);
                    }}
                  >
                    {depots.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Assign Field Driver</label>
                  <select
                    className="form-select"
                    value={assignedWorkerId}
                    onChange={(e) => setAssignedWorkerId(e.target.value)}
                  >
                    {availableWorkers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.full_name} ({w.zone || 'Driver'})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={prioritizeHigh}
                      onChange={(e) => {
                        setPrioritizeHigh(e.target.checked);
                        setHasGenerated(false);
                      }}
                    />
                    <span>Prioritize High Fill (&gt;75%) & High Priority bins</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={returnToDepot}
                      onChange={(e) => {
                        setReturnToDepot(e.target.checked);
                        setHasGenerated(false);
                      }}
                    />
                    <span>Return to Depot after final stop (Closed Loop)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Points Selection Checklist Card */}
          <div className="tailux-card">
            <div className="card-header">
              <div>
                <h2 className="card-title">2. Select Collection Stops</h2>
                <p className="card-description">{selectedPointIds.length} stops selected</p>
              </div>

              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleSelectCritical}
                  title="Select high fill points"
                >
                  High Fill
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleSelectAll}
                >
                  All
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleDeselectAll}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="card-body" style={{ maxHeight: '340px', overflowY: 'auto', padding: '0.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {collectionPoints.map((point) => {
                  const isSelected = selectedPointIds.includes(point.id);
                  const stopOrder = stopOrderLookup[point.id];

                  return (
                    <div
                      key={point.id}
                      onClick={() => handleTogglePoint(point.id)}
                      style={{
                        padding: '0.65rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid',
                        borderColor: isSelected ? 'var(--primary-border)' : 'var(--border-color)',
                        background: isSelected ? 'var(--primary-light)' : 'var(--bg-card)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // handled by parent div
                          style={{ pointerEvents: 'none' }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {point.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {point.area} • {point.waste_type}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                        <span className={`badge ${
                          point.priority === 'High' ? 'badge-rose' :
                          point.priority === 'Medium' ? 'badge-amber' :
                          'badge-emerald'
                        }`} style={{ fontSize: '0.62rem' }}>
                          {point.estimated_fill_percent || 50}%
                        </span>
                        {stopOrder && (
                          <span className="badge badge-purple" style={{ fontSize: '0.65rem', fontWeight: 700 }}>
                            Stop #{stopOrder}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card-footer">
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={isCalculating || selectedPointIds.length < 2}
                onClick={handleGenerateRoute}
              >
                {isCalculating ? (
                  'Calculating Road Network...'
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Generate Suggested Road Route</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Map & Turn-by-Turn Stop Sequence */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Interactive Leaflet Map */}
          <div className="tailux-card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Interactive Road Routing Preview</h2>
                <p className="card-description">
                  {routeResult ? (
                    <span>
                      Suggested Road Route: <strong>{routeResult.distanceKm} km</strong> • Approx. <strong>{routeResult.durationMinutes} min</strong> driving
                    </span>
                  ) : (
                    <span>OpenStreetMap Vector Tiles & OSRM Routing Engine</span>
                  )}
                </p>
              </div>

              {routeResult?.isFallback && (
                <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>
                  Approximate Fallback
                </span>
              )}
            </div>

            <div style={{ padding: '0.75rem' }}>
              <MapView
                depot={selectedDepot}
                collectionPoints={collectionPoints}
                selectedPointIds={selectedPointIds}
                stopOrderMap={stopOrderLookup}
                routeGeometry={routeResult?.coordinates}
                height="460px"
              />
            </div>
          </div>

          {/* Ordered Stop Sequence Manifest */}
          {hasGenerated && orderedStops.length > 0 && (
            <div className="tailux-card">
              <div className="card-header">
                <div>
                  <h2 className="card-title">Suggested Stop Sequence</h2>
                  <p className="card-description">Review and adjust driver stop order</p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveRoute}
                >
                  <Save size={14} />
                  <span>Save Route</span>
                </button>
              </div>

              <div className="table-responsive">
                <table className="tailux-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>Order</th>
                      <th>Location Name</th>
                      <th>Area</th>
                      <th>Waste Stream</th>
                      <th>Fill %</th>
                      <th style={{ textAlign: 'right' }}>Sequence Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Launch Depot Row */}
                    <tr style={{ background: 'var(--bg-subtle)' }}>
                      <td>
                        <span className="badge badge-emerald">START</span>
                      </td>
                      <td colSpan={4}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          {selectedDepot.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {selectedDepot.address}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                        Depot Departure
                      </td>
                    </tr>

                    {/* Ordered Stops */}
                    {orderedStops.map((stop, index) => (
                      <tr key={stop.id}>
                        <td>
                          <span className="badge badge-purple" style={{ fontWeight: 700 }}>
                            #{index + 1}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{stop.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{stop.address_text}</div>
                        </td>
                        <td>{stop.area}</td>
                        <td>
                          <span className="badge badge-blue" style={{ fontSize: '0.68rem' }}>
                            {stop.waste_type}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${
                            stop.priority === 'High' ? 'badge-rose' :
                            stop.priority === 'Medium' ? 'badge-amber' :
                            'badge-emerald'
                          }`}>
                            {stop.estimated_fill_percent || 50}%
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              disabled={index === 0}
                              onClick={() => handleMoveStop(index, 'up')}
                              title="Move Stop Earlier"
                            >
                              <ArrowUp size={13} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              disabled={index === orderedStops.length - 1}
                              onClick={() => handleMoveStop(index, 'down')}
                              title="Move Stop Later"
                            >
                              <ArrowDown size={13} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger-outline btn-sm"
                              onClick={() => handleRemoveStopFromRoute(stop.id)}
                              title="Remove from Route"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
