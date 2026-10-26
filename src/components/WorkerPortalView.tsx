import React, { useState } from 'react';
import { 
  Truck, 
  CheckCircle2, 
  Clock, 
  Navigation, 
  Calendar, 
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Route, StopStatus, UserProfile } from '../types';
import { MapView } from './MapView';

interface WorkerPortalViewProps {
  currentUser: UserProfile;
  routes: Route[];
  onUpdateStopStatus: (routeId: string, stopId: string, status: StopStatus, notes?: string) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const WorkerPortalView: React.FC<WorkerPortalViewProps> = ({
  currentUser,
  routes,
  onUpdateStopStatus,
  showToast,
}) => {
  // Filter routes assigned to this worker, or show all if none specifically assigned
  const assignedRoutes = routes.filter((r) => r.assigned_worker_id === currentUser.id);
  const displayedRoutes = assignedRoutes.length > 0 ? assignedRoutes : routes;

  const [selectedRouteId, setSelectedRouteId] = useState<string>(
    displayedRoutes[0]?.id || ''
  );

  const [stopNotes, setStopNotes] = useState<Record<string, string>>({});

  const activeRoute = displayedRoutes.find((r) => r.id === selectedRouteId) || displayedRoutes[0] || null;

  const handleStatusChange = (stopId: string, newStatus: StopStatus) => {
    if (!activeRoute) return;
    const note = stopNotes[stopId];
    onUpdateStopStatus(activeRoute.id, stopId, newStatus, note);

    if (newStatus === 'Completed') {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.8 },
      });
      showToast('Stop marked as Collected! Great job.', 'success');
    } else {
      showToast(`Stop status updated to ${newStatus}`, 'info');
    }
  };

  if (!activeRoute) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <Truck size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.3, color: '#3b82f6' }} />
        <h3 style={{ fontSize: '1.2rem', color: '#ffffff', marginBottom: '0.5rem' }}>No Active Worker Routes</h3>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
          Ask the administrator to assign a scheduled collection route to your profile.
        </p>
      </div>
    );
  }

  const completedCount = activeRoute.stops.filter((s) => s.status === 'Completed').length;
  const inProgressCount = activeRoute.stops.filter((s) => s.status === 'In Progress').length;
  const pendingCount = activeRoute.stops.filter((s) => s.status === 'Pending').length;
  const totalCount = activeRoute.stops.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Build stop order lookup for map
  const stopOrderLookup: Record<string, number> = {};
  activeRoute.stops.forEach((s) => {
    stopOrderLookup[s.collection_point_id] = s.stop_order;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Worker Header Card */}
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '16px',
          padding: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
              Collection Field Terminal (FR-09, FR-10)
            </span>
            <span className="badge badge-inprogress">WORKER VIEW</span>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
            Logged in as <strong style={{ color: '#ffffff' }}>{currentUser.full_name}</strong> • Follow sequence and record collection progress
          </p>
        </div>

        {/* Route Selector Dropdown if multiple assigned */}
        {displayedRoutes.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Route:</span>
            <select
              className="form-select"
              value={selectedRouteId}
              onChange={(e) => setSelectedRouteId(e.target.value)}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
            >
              {displayedRoutes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.route_name} ({r.route_date})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Progress & Live Overview Bar */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>
              {activeRoute.route_name}
            </h3>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2px' }}>
              <Calendar size={13} />
              <span>{activeRoute.route_date}</span>
              <span>•</span>
              <Truck size={13} />
              <span>Depot: {activeRoute.depot_name}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', padding: '0.4rem 0.75rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#34d399' }}>{completedCount}</div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Done</div>
            </div>
            <div style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', padding: '0.4rem 0.75rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#60a5fa' }}>{inProgressCount}</div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Active</div>
            </div>
            <div style={{ background: 'rgba(148, 163, 184, 0.15)', border: '1px solid rgba(148, 163, 184, 0.3)', borderRadius: '8px', padding: '0.4rem 0.75rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#cbd5e1' }}>{pendingCount}</div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Pending</div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '6px' }}>
            <span>Shift Completion</span>
            <span style={{ fontWeight: 700, color: progressPct === 100 ? '#10b981' : '#06b6d4' }}>
              {progressPct}% ({completedCount} / {totalCount} Stops)
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${progressPct}%`,
                height: '100%',
                background: progressPct === 100 ? '#10b981' : 'linear-gradient(90deg, #06b6d4, #10b981)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* Split layout: Step Checklist + Route Map */}
      <div className="split-view-container">
        {/* Ordered Stops Step-by-Step Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
            Ordered Stops Checklist ({activeRoute.stops.length})
          </div>

          {activeRoute.stops.map((stop) => {
            const isCompleted = stop.status === 'Completed';
            const isInProgress = stop.status === 'In Progress';

            return (
              <div
                key={stop.id}
                style={{
                  background: isCompleted
                    ? 'rgba(16, 185, 129, 0.05)'
                    : isInProgress
                    ? 'rgba(59, 130, 246, 0.08)'
                    : 'var(--bg-card)',
                  border: `1px solid ${
                    isCompleted
                      ? 'rgba(16, 185, 129, 0.3)'
                      : isInProgress
                      ? '#3b82f6'
                      : 'var(--border-subtle)'
                  }`,
                  borderRadius: '12px',
                  padding: '1.1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Stop Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        background: isCompleted ? '#10b981' : isInProgress ? '#3b82f6' : '#1e293b',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: 700,
                        border: isCompleted ? '2px solid #34d399' : '2px solid rgba(255,255,255,0.2)',
                        flexShrink: 0,
                      }}
                    >
                      {isCompleted ? <Check size={18} /> : `#${stop.stop_order}`}
                    </div>
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: isCompleted ? '#94a3b8' : '#ffffff', textDecoration: isCompleted ? 'line-through' : 'none' }}>
                        {stop.point_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        📍 {stop.point_address}
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                        <span className={`badge badge-${stop.priority.toLowerCase()}`} style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem' }}>
                          {stop.priority}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '0.1rem 0.45rem', borderRadius: '4px' }}>
                          {stop.waste_type}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`badge ${
                      isCompleted ? 'badge-completed' : isInProgress ? 'badge-inprogress' : 'badge-pending'
                    }`}
                  >
                    {stop.status}
                  </span>
                </div>

                {/* Optional Note input */}
                <div>
                  <input
                    type="text"
                    placeholder="Add driver notes (e.g. Bin emptied, gate code OK)..."
                    value={stopNotes[stop.id] ?? (stop.notes || '')}
                    onChange={(e) => setStopNotes({ ...stopNotes, [stop.id]: e.target.value })}
                    className="form-input"
                    style={{ fontSize: '0.78rem', padding: '0.4rem 0.65rem' }}
                  />
                </div>

                {/* Worker Action Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '0.25rem' }}>
                  {/* Google Maps Turn by Turn Link */}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ textDecoration: 'none' }}
                  >
                    <Navigation size={13} color="#06b6d4" />
                    <span>Navigate (GPS)</span>
                  </a>

                  {/* Mark In Progress */}
                  {!isCompleted && !isInProgress && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleStatusChange(stop.id, 'In Progress')}
                      style={{ color: '#60a5fa' }}
                    >
                      <Clock size={13} />
                      <span>Start Stop</span>
                    </button>
                  )}

                  {/* Mark Completed Button */}
                  {!isCompleted ? (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleStatusChange(stop.id, 'Completed')}
                    >
                      <CheckCircle2 size={13} />
                      <span>Complete Collection</span>
                    </button>
                  ) : (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleStatusChange(stop.id, 'Pending')}
                      style={{ fontSize: '0.72rem', color: '#94a3b8' }}
                    >
                      <span>Undo / Mark Pending</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Route Navigation Map */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>Assigned Route Map</h4>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Real-time road path & stop numbers</p>
            </div>
          </div>

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
              created_at: s.updated_at,
            }))}
            stopOrderMap={stopOrderLookup}
            routeGeometry={activeRoute.route_geometry}
            height="500px"
          />
        </div>
      </div>
    </div>
  );
};
