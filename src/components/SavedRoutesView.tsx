import React, { useState } from 'react';
import { 
  Truck, 
  Printer, 
  Trash2, 
  CheckCircle2, 
  FileDown
} from 'lucide-react';
import type { Route, StopStatus } from '../types';
import { MapView } from './MapView';
import { deleteRoute, updateRouteStatus, exportRoutesToCSV } from '../services/storage';

interface SavedRoutesViewProps {
  routes: Route[];
  selectedRouteId: string | null;
  onSelectRouteId: (id: string) => void;
  onUpdateStopStatus: (routeId: string, stopId: string, status: StopStatus, notes?: string) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onRefreshData?: () => void;
}

export const SavedRoutesView: React.FC<SavedRoutesViewProps> = ({
  routes,
  selectedRouteId,
  onSelectRouteId,
  onUpdateStopStatus,
  showToast,
  onRefreshData,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRoutes = routes.filter((r) => {
    const matchesStatus = filterStatus === 'All' || r.status === filterStatus;
    const matchesSearch = 
      r.route_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.assigned_worker_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.zone || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const activeRoute = routes.find((r) => r.id === selectedRouteId) || filteredRoutes[0] || routes[0] || null;

  const handlePrintSheet = () => {
    window.print();
  };

  const handleDeleteRoute = async (routeId: string) => {
    if (window.confirm('Are you sure you want to delete this route and its assigned stops from the database?')) {
      await deleteRoute(routeId);
      showToast('Route removed from system', 'info');
      if (onRefreshData) onRefreshData();
    }
  };

  const handleUpdateStatus = async (routeId: string, newStatus: Route['status']) => {
    await updateRouteStatus(routeId, newStatus);
    showToast(`Route status updated to ${newStatus.toUpperCase()}`, 'success');
    if (onRefreshData) onRefreshData();
  };

  if (routes.length === 0) {
    return (
      <div className="page-container">
        <div className="tailux-card" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
          <Truck size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.3, color: 'var(--primary)' }} />
          <h2 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
            No Saved Routes Found
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Use the Route Planner to create, sequence, and dispatch municipal collection routes.
          </p>
        </div>
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
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Saved Routes & Manifests</h1>
          <p className="page-subtitle">
            Historical and scheduled municipal dispatch manifests, driver assignments, and stop progress
          </p>
        </div>

        <div className="page-actions-group">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => exportRoutesToCSV(routes)}
          >
            <FileDown size={14} />
            <span>Export Manifests</span>
          </button>

          {activeRoute && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handlePrintSheet}
            >
              <Printer size={14} />
              <span>Print Run-Sheet</span>
            </button>
          )}
        </div>
      </div>

      {/* Two Column Layout: Left Route Selector, Right Route Detail */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 360px) 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Column: Route List & Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '2px' }}>
            {['All', 'Scheduled', 'In Progress', 'Completed'].map((st) => (
              <button
                key={st}
                type="button"
                className={`btn btn-sm ${filterStatus === st ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterStatus(st)}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="search-input-box" style={{ width: '100%', minWidth: 'unset' }}>
            <input
              type="text"
              placeholder="Search route or driver name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.85rem' }}
            />
          </div>

          {/* Route Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '720px', overflowY: 'auto' }}>
            {filteredRoutes.map((route) => {
              const isSelected = activeRoute?.id === route.id;
              const completedCount = route.stops.filter((s) => s.status === 'Completed').length;
              const totalCount = route.stops.length;
              const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

              return (
                <div
                  key={route.id}
                  onClick={() => onSelectRouteId(route.id)}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--primary)' : 'var(--border-color)',
                    background: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                    boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-soft)',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.3 }}>
                      {route.route_name}
                    </div>
                    <span className={`badge ${
                      route.status === 'Completed' ? 'badge-completed' :
                      route.status === 'In Progress' ? 'badge-inprogress' :
                      'badge-scheduled'
                    }`} style={{ fontSize: '0.62rem' }}>
                      {route.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    Driver: <strong>{route.assigned_worker_name || 'Unassigned'}</strong> • {route.route_date}
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.72rem',
                    color: 'var(--text-dim)',
                    marginBottom: '0.4rem',
                  }}>
                    <span>{route.total_distance_km ? `${route.total_distance_km} km` : 'Heuristic Distance'}</span>
                    <span>{completedCount} of {totalCount} Stops ({percent}%)</span>
                  </div>

                  <div style={{
                    height: 5,
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--border-color)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${percent}%`,
                      height: '100%',
                      background: percent === 100 ? 'var(--accent-emerald)' : 'var(--primary)',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Route Details, Interactive Map & Stops Checklist */}
        {activeRoute && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Active Route Overview Card */}
            <div className="tailux-card">
              <div className="card-header">
                <div>
                  <h2 className="card-title">{activeRoute.route_name}</h2>
                  <p className="card-description">
                    Date: <strong>{activeRoute.route_date}</strong> • Driver: <strong>{activeRoute.assigned_worker_name || 'Unassigned'}</strong> • Launch: <strong>{activeRoute.depot_name}</strong>
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {activeRoute.status !== 'Completed' && (
                    <button
                      type="button"
                      className="btn btn-emerald btn-sm"
                      onClick={() => handleUpdateStatus(activeRoute.id, 'Completed')}
                    >
                      <CheckCircle2 size={13} />
                      <span>Mark All Completed</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn btn-danger-outline btn-sm"
                    onClick={() => handleDeleteRoute(activeRoute.id)}
                    title="Delete Route"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Map Preview */}
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
                  height="340px"
                />
              </div>

              {/* Route Summary Stats Bar */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                borderTop: '1px solid var(--border-color)',
                background: 'var(--bg-subtle)',
              }}>
                <div style={{ padding: '0.85rem 1rem', borderRight: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700 }}>Total Stops</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>{activeRoute.stops.length}</div>
                </div>
                <div style={{ padding: '0.85rem 1rem', borderRight: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700 }}>Completed</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                    {activeRoute.stops.filter((s) => s.status === 'Completed').length}
                  </div>
                </div>
                <div style={{ padding: '0.85rem 1rem', borderRight: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700 }}>Road Distance</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {activeRoute.total_distance_km ? `${activeRoute.total_distance_km} km` : 'Approx'}
                  </div>
                </div>
                <div style={{ padding: '0.85rem 1rem' }}>
                  <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700 }}>Est. Duration</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    ~{activeRoute.estimated_duration_min || 45} min
                  </div>
                </div>
              </div>
            </div>

            {/* Stops Progression Table */}
            <div className="tailux-card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Turn-by-Turn Receptacle Stops</h3>
                  <p className="card-description">Ordered stop registry with driver timestamp verification</p>
                </div>
              </div>

              <div className="table-responsive">
                <table className="tailux-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>Stop</th>
                      <th>Location Name & Address</th>
                      <th>Waste Stream</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Completion Record</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRoute.stops.map((stop) => (
                      <tr key={stop.id}>
                        <td>
                          <span className="badge badge-purple" style={{ fontWeight: 700 }}>
                            #{stop.stop_order}
                          </span>
                        </td>

                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{stop.point_name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{stop.point_address}</div>
                        </td>

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
                            {stop.priority}
                          </span>
                        </td>

                        <td>
                          <span className={`badge ${
                            stop.status === 'Completed' ? 'badge-completed' :
                            stop.status === 'In Progress' ? 'badge-inprogress' :
                            'badge-pending'
                          }`}>
                            {stop.status}
                          </span>
                        </td>

                        <td>
                          {stop.completed_at ? (
                            <div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                                {new Date(stop.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              {stop.notes && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{stop.notes}</div>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Pending Arrival</span>
                          )}
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                            {stop.status !== 'Completed' && (
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => onUpdateStopStatus(activeRoute.id, stop.id, 'Completed', 'Admin verified')}
                                title="Mark Completed"
                              >
                                <CheckCircle2 size={13} color="var(--accent-emerald)" />
                                <span>Complete</span>
                              </button>
                            )}

                            {stop.status === 'Completed' && (
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => onUpdateStopStatus(activeRoute.id, stop.id, 'Pending')}
                                title="Reset to Pending"
                              >
                                <span>Reopen</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
