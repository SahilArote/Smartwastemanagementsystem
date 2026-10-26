import React from 'react';
import { 
  Truck, 
  Calendar, 
  UserCheck, 
  Printer
} from 'lucide-react';
import type { Route, StopStatus } from '../types';
import { MapView } from './MapView';

interface SavedRoutesViewProps {
  routes: Route[];
  selectedRouteId: string | null;
  onSelectRouteId: (id: string) => void;
  onUpdateStopStatus: (routeId: string, stopId: string, status: StopStatus) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const SavedRoutesView: React.FC<SavedRoutesViewProps> = ({
  routes,
  selectedRouteId,
  onSelectRouteId,
  onUpdateStopStatus,
  showToast,
}) => {
  const activeRoute = routes.find((r) => r.id === selectedRouteId) || routes[0] || null;

  const handlePrintSheet = () => {
    window.print();
  };

  if (routes.length === 0) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <Truck size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.3, color: '#10b981' }} />
        <h3 style={{ fontSize: '1.2rem', color: '#ffffff', marginBottom: '0.5rem' }}>No Saved Routes Found</h3>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
          Use the Route Planner to create and save municipal collection routes.
        </p>
      </div>
    );
  }

  // Build stop order lookup for active route map
  const stopOrderLookup: Record<string, number> = {};
  if (activeRoute) {
    activeRoute.stops.forEach((s) => {
      stopOrderLookup[s.collection_point_id] = s.stop_order;
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>Saved Collection Routes</h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Historical and scheduled municipal dispatch manifests (PRD Section 9)
          </p>
        </div>

        {activeRoute && (
          <button className="btn btn-secondary btn-sm" onClick={handlePrintSheet}>
            <Printer size={15} />
            <span>Print Manifest Sheet</span>
          </button>
        )}
      </div>

      <div className="split-view-container">
        {/* Left: Routes Navigation Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
            All Routes ({routes.length})
          </div>

          {routes.map((route) => {
            const isSelected = activeRoute?.id === route.id;
            const completedCount = route.stops.filter((s) => s.status === 'Completed').length;
            const totalCount = route.stops.length;
            const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

            return (
              <div
                key={route.id}
                onClick={() => onSelectRouteId(route.id)}
                style={{
                  padding: '1rem',
                  background: isSelected ? 'rgba(16, 185, 129, 0.09)' : 'var(--bg-card)',
                  border: `1px solid ${isSelected ? '#10b981' : 'var(--border-subtle)'}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                  <div>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff' }}>
                      {route.route_name}
                    </h4>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '2px' }}>
                      <Calendar size={12} />
                      <span>{route.route_date}</span>
                      <span>•</span>
                      <UserCheck size={12} />
                      <span>{route.assigned_worker_name || 'Unassigned'}</span>
                    </div>
                  </div>

                  <span
                    className={`badge ${
                      route.status === 'Completed'
                        ? 'badge-completed'
                        : route.status === 'In Progress'
                        ? 'badge-inprogress'
                        : 'badge-pending'
                    }`}
                  >
                    {route.status}
                  </span>
                </div>

                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '4px' }}>
                    <span>Progress: {completedCount}/{totalCount} Stops</span>
                    <span style={{ fontWeight: 600, color: progress === 100 ? '#10b981' : '#38bdf8' }}>
                      {progress}% ({route.total_distance_km ? `${route.total_distance_km} km` : 'Est.'})
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '5px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${progress}%`,
                        height: '100%',
                        background: progress === 100 ? '#10b981' : 'linear-gradient(90deg, #06b6d4, #10b981)',
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Active Route Details & Stop Status Management */}
        {activeRoute && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Manifest Overview Card */}
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                      {activeRoute.route_name}
                    </h3>
                    <span className={`badge ${activeRoute.status === 'Completed' ? 'badge-completed' : 'badge-inprogress'}`}>
                      {activeRoute.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                    🏢 Starting Depot: {activeRoute.depot_name}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem 0.85rem', borderRadius: '8px' }}>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Distance: </span>
                    <strong style={{ color: '#10b981' }}>{activeRoute.total_distance_km || '—'} km</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Assigned To: </span>
                    <strong style={{ color: '#ffffff' }}>{activeRoute.assigned_worker_name}</strong>
                  </div>
                </div>
              </div>

              {/* Map Preview for this Route */}
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
                height="340px"
              />
            </div>

            {/* Stops Checklist & Status Toggle (FR-10) */}
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
                  Ordered Collection Stops ({activeRoute.stops.length})
                </h4>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Click status to test real-time worker sync (FR-10)
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {activeRoute.stops.map((stop) => (
                  <div
                    key={stop.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: stop.status === 'Completed' ? '#10b981' : '#0284c7',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 700,
                        }}
                      >
                        {stop.stop_order}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff' }}>
                          {stop.point_name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          {stop.point_address} • <span style={{ color: '#38bdf8' }}>{stop.waste_type}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <select
                        className="form-select"
                        value={stop.status}
                        onChange={(e) => {
                          const newStatus = e.target.value as StopStatus;
                          onUpdateStopStatus(activeRoute.id, stop.id, newStatus);
                          showToast(`Stop #${stop.stop_order} status updated to ${newStatus}`, 'info');
                        }}
                        style={{
                          padding: '0.3rem 0.6rem',
                          fontSize: '0.75rem',
                          width: 'auto',
                          background:
                            stop.status === 'Completed'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : stop.status === 'In Progress'
                              ? 'rgba(59, 130, 246, 0.15)'
                              : 'rgba(255,255,255,0.05)',
                          color:
                            stop.status === 'Completed'
                              ? '#34d399'
                              : stop.status === 'In Progress'
                              ? '#60a5fa'
                              : '#94a3b8',
                          borderColor:
                            stop.status === 'Completed'
                              ? 'rgba(16, 185, 129, 0.3)'
                              : stop.status === 'In Progress'
                              ? 'rgba(59, 130, 246, 0.3)'
                              : 'var(--border-subtle)',
                        }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
