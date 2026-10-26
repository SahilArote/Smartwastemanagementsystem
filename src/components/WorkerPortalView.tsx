import React, { useState } from 'react';
import { 
  Truck, 
  Navigation, 
  Check, 
  ExternalLink,
  Play
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Route, StopStatus, UserProfile } from '../types';
import { MapView } from './MapView';

interface WorkerPortalViewProps {
  currentUser: UserProfile;
  routes: Route[];
  onUpdateStopStatus: (routeId: string, stopId: string, status: StopStatus, notes?: string) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const WorkerPortalView: React.FC<WorkerPortalViewProps> = ({
  currentUser,
  routes,
  onUpdateStopStatus,
  showToast,
}) => {
  const isWorkerRole = currentUser.role === 'worker';

  // Strict Assignment Filter:
  // If user is a worker, only show routes assigned to them!
  // If supervisor/admin inspecting the field portal, allow them to view all or switch routes.
  const assignedRoutes = isWorkerRole
    ? routes.filter((r) => r.assigned_worker_id === currentUser.id || (r.assigned_worker_name || '').toLowerCase() === currentUser.full_name.toLowerCase())
    : routes;

  const [selectedRouteId, setSelectedRouteId] = useState<string>(
    assignedRoutes[0]?.id || routes[0]?.id || ''
  );

  const [activeStopNotes, setActiveStopNotes] = useState<Record<string, string>>({});

  const activeRoute = assignedRoutes.find((r) => r.id === selectedRouteId) || assignedRoutes[0] || null;

  const handleStatusChange = async (stopId: string, newStatus: StopStatus) => {
    if (!activeRoute) return;
    const note = activeStopNotes[stopId];
    await onUpdateStopStatus(activeRoute.id, stopId, newStatus, note);

    if (newStatus === 'Completed') {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch {
        // confetti fallback
      }
      showToast('Receptacle collection verified and logged!', 'success');
    } else {
      showToast(`Stop status updated to ${newStatus}`, 'info');
    }
  };

  if (!activeRoute) {
    return (
      <div className="page-container">
        <div className="tailux-card" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
          <Truck size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.3, color: 'var(--primary)' }} />
          <h2 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
            No Assigned Route Dispatches
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            {isWorkerRole
              ? `Driver profile "${currentUser.full_name}" currently has no scheduled dispatches for today.`
              : 'No municipal routes are scheduled in the system.'}
          </p>
        </div>
      </div>
    );
  }

  const completedCount = activeRoute.stops.filter((s) => s.status === 'Completed').length;
  const totalCount = activeRoute.stops.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Build stop order lookup for map
  const stopOrderLookup: Record<string, number> = {};
  activeRoute.stops.forEach((s) => {
    stopOrderLookup[s.collection_point_id] = s.stop_order;
  });

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Driver Field Console</h1>
          <p className="page-subtitle">
            Turn-by-turn mobile task management terminal for active collection drivers
          </p>
        </div>

        {assignedRoutes.length > 1 && (
          <div className="page-actions-group">
            <select
              className="form-select"
              style={{ width: 'auto', fontWeight: 600 }}
              value={selectedRouteId}
              onChange={(e) => setSelectedRouteId(e.target.value)}
            >
              {assignedRoutes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.route_name} ({r.route_date})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(360px, 440px)', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Column: Interactive Map & Turn-by-Turn Stop Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Active Route Header Banner */}
          <div className="tailux-card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--primary-light) 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div>
                <span className="badge badge-emerald" style={{ marginBottom: '0.4rem' }}>
                  ACTIVE ASSIGNMENT
                </span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {activeRoute.route_name}
                </h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Launch: <strong>{activeRoute.depot_name}</strong> • Scheduled: <strong>{activeRoute.route_date}</strong>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>
                  {progressPct}%
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                  COMPLETED
                </div>
              </div>
            </div>

            <div style={{
              height: 7,
              borderRadius: 'var(--radius-full)',
              background: 'var(--border-color)',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${progressPct}%`,
                height: '100%',
                background: progressPct === 100 ? 'var(--accent-emerald)' : 'var(--primary)',
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>

          {/* Turn-by-Turn Receptacle Checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activeRoute.stops.map((stop) => {
              const isCompleted = stop.status === 'Completed';
              const isInProgress = stop.status === 'In Progress';

              return (
                <div
                  key={stop.id}
                  className="tailux-card"
                  style={{
                    borderLeft: `4px solid ${
                      isCompleted ? 'var(--accent-emerald)' : isInProgress ? 'var(--accent-amber)' : 'var(--border-color)'
                    }`,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.65rem' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: 'var(--radius-md)',
                          background: isCompleted ? 'var(--accent-emerald)' : isInProgress ? 'var(--accent-amber)' : 'var(--primary-light)',
                          color: isCompleted ? '#ffffff' : isInProgress ? '#ffffff' : 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.84rem',
                          flexShrink: 0,
                        }}>
                          {stop.stop_order}
                        </div>

                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.96rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <span>{stop.point_name}</span>
                            <span className={`badge ${
                              stop.priority === 'High' ? 'badge-rose' :
                              stop.priority === 'Medium' ? 'badge-amber' :
                              'badge-emerald'
                            }`} style={{ fontSize: '0.62rem' }}>
                              {stop.priority}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {stop.point_address} ({stop.point_area})
                          </div>
                        </div>
                      </div>

                      <span className={`badge ${
                        isCompleted ? 'badge-completed' :
                        isInProgress ? 'badge-inprogress' :
                        'badge-pending'
                      }`}>
                        {stop.status}
                      </span>
                    </div>

                    {/* Completion info or notes */}
                    {isCompleted && stop.completed_at && (
                      <div style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--accent-emerald-light)',
                        color: 'var(--accent-emerald-text)',
                        fontSize: '0.75rem',
                        marginBottom: '0.75rem',
                      }}>
                        ✓ Collected at {new Date(stop.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {stop.notes && ` — Note: "${stop.notes}"`}
                      </div>
                    )}

                    {/* Operational Note Input for Driver */}
                    {!isCompleted && (
                      <div style={{ marginBottom: '0.85rem' }}>
                        <input
                          type="text"
                          placeholder="Optional field notes: e.g. Contamination present, gate unlocked..."
                          className="form-input"
                          style={{ fontSize: '0.78rem', padding: '0.45rem 0.75rem' }}
                          value={activeStopNotes[stop.id] || ''}
                          onChange={(e) => setActiveStopNotes({ ...activeStopNotes, [stop.id]: e.target.value })}
                        />
                      </div>
                    )}

                    {/* Action Buttons Row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border-color)' }}>
                      {/* Real Google Maps Navigation Intent */}
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
                      >
                        <Navigation size={13} color="var(--primary)" />
                        <span>Navigate in Maps</span>
                        <ExternalLink size={11} style={{ opacity: 0.6 }} />
                      </a>

                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {!isCompleted && !isInProgress && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleStatusChange(stop.id, 'In Progress')}
                          >
                            <Play size={12} color="var(--accent-amber)" />
                            <span>Start Stop</span>
                          </button>
                        )}

                        {!isCompleted && (
                          <button
                            type="button"
                            className="btn btn-emerald btn-sm"
                            onClick={() => handleStatusChange(stop.id, 'Completed')}
                          >
                            <Check size={13} />
                            <span>Verify & Complete</span>
                          </button>
                        )}

                        {isCompleted && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleStatusChange(stop.id, 'Pending')}
                          >
                            <span>Revert to Pending</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Route Map & Telemetry Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="tailux-card">
            <div className="card-header">
              <h3 className="card-title">Stop Geographic Map</h3>
            </div>
            <div style={{ padding: '0.75rem' }}>
              <MapView
                depot={{
                  latitude: activeRoute.depot_latitude,
                  longitude: activeRoute.depot_longitude,
                  name: activeRoute.depot_name,
                }}
                collectionPoints={activeRoute.stops.map((s) => ({
                  id: s.collection_point_id,
                  name: s.point_name,
                  area: s.point_area,
                  address_text: s.point_address,
                  latitude: s.latitude,
                  longitude: s.longitude,
                  waste_type: s.waste_type,
                  priority: s.priority,
                  is_active: true,
                  created_at: '',
                }))}
                stopOrderMap={stopOrderLookup}
                routeGeometry={activeRoute.route_geometry}
                height="420px"
              />
            </div>
          </div>

          {/* Driver Dispatch Telemetry */}
          <div className="tailux-card">
            <div className="card-header">
              <h3 className="card-title">Driver Telemetry & Manifest</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Assigned Driver:</span>
                  <strong style={{ color: 'var(--text-main)' }}>{activeRoute.assigned_worker_name || currentUser.full_name}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Scheduled Date:</span>
                  <strong style={{ color: 'var(--text-main)' }}>{activeRoute.route_date}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Est. Road Distance:</span>
                  <strong style={{ color: 'var(--text-main)' }}>{activeRoute.total_distance_km ? `${activeRoute.total_distance_km} km` : 'Standard Run'}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Departure Facility:</span>
                  <strong style={{ color: 'var(--text-main)' }}>{activeRoute.depot_name}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Current Status:</span>
                  <span className={`badge ${
                    activeRoute.status === 'Completed' ? 'badge-completed' :
                    activeRoute.status === 'In Progress' ? 'badge-inprogress' :
                    'badge-scheduled'
                  }`}>
                    {activeRoute.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
