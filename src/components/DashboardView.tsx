import React from 'react';
import { 
  MapPin, 
  Route as RouteIcon, 
  CheckCircle2, 
  Compass, 
  Truck, 
  ArrowUpRight, 
  Plus, 
  FileDown, 
  Layers
} from 'lucide-react';
import type { CollectionPoint, Route, SystemStats, UserProfile } from '../types';
import { fetchActivityLogs, exportRoutesToCSV } from '../services/storage';

interface DashboardViewProps {
  stats: SystemStats;
  points: CollectionPoint[];
  routes: Route[];
  currentUser: UserProfile;
  onNavigate: (tab: string) => void;
  onSelectRoute: (routeId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  points,
  routes,
  currentUser,
  onNavigate,
  onSelectRoute,
}) => {
  const logs = fetchActivityLogs().slice(0, 6);
  const isWorker = currentUser.role === 'worker';

  // High fill priority points alert count
  const criticalPoints = points.filter((p) => (p.estimated_fill_percent || 0) >= 80);

  return (
    <div className="page-container">
      {/* Header Banner */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Operational Command Dashboard</h1>
          <p className="page-subtitle">
            Municipal fleet operations, route progress, and collection efficiency metrics
          </p>
        </div>

        <div className="page-actions-group">
          {!isWorker && (
            <>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => exportRoutesToCSV(routes)}
                title="Download active route records in CSV format"
              >
                <FileDown size={14} />
                <span>Export Manifest</span>
              </button>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => onNavigate('planner')}
              >
                <Plus size={14} />
                <span>Plan New Route</span>
              </button>
            </>
          )}
          {isWorker && (
            <button
              type="button"
              className="btn btn-emerald btn-sm"
              onClick={() => onNavigate('worker')}
            >
              <Truck size={14} />
              <span>Go to My Active Stops</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="stat-cards-grid">
        {/* Total Points */}
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Collection Points</span>
            <div className="metric-icon-box indigo">
              <MapPin size={20} />
            </div>
          </div>
          <div className="metric-value">{stats.totalPoints}</div>
          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Registered bins</span>
            {criticalPoints.length > 0 && (
              <span className="badge badge-rose" style={{ fontSize: '0.65rem' }}>
                {criticalPoints.length} High Fill
              </span>
            )}
          </div>
        </div>

        {/* Active Routes */}
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Active Dispatched Routes</span>
            <div className="metric-icon-box amber">
              <RouteIcon size={20} />
            </div>
          </div>
          <div className="metric-value">{stats.activeRoutes}</div>
          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Total: {stats.totalRoutes} planned</span>
            <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>In Progress</span>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Stop Completion Rate</span>
            <div className="metric-icon-box emerald">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="metric-value">{stats.completionRate}%</div>
          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {stats.completedStops} of {stats.totalStops} completed
            </span>
            <span className="metric-trend positive">
              <ArrowUpRight size={12} />
              <span>On Schedule</span>
            </span>
          </div>
        </div>

        {/* Planned Distance */}
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Planned Road Distance</span>
            <div className="metric-icon-box blue">
              <Compass size={20} />
            </div>
          </div>
          <div className="metric-value">{stats.totalPlannedKm} <span style={{ fontSize: '1rem', fontWeight: 500 }}>km</span></div>
          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>OSRM Road Network</span>
            <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>Public Routing</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Fleet Workload & Live Activity Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Fleet Workload Table */}
        <div className="tailux-card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Active Fleet Operations</h2>
              <p className="card-description">Dispatched vehicles and driver stop progress</p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate('routes')}
            >
              View All Routes
            </button>
          </div>

          <div className="table-responsive">
            <table className="tailux-table">
              <thead>
                <tr>
                  <th>Route / Assigned Staff</th>
                  <th>Stops Progress</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {routes.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No routes scheduled for today. Click "Plan New Route" to dispatch.
                    </td>
                  </tr>
                ) : (
                  routes.slice(0, 5).map((route) => {
                    const completed = route.stops.filter((s) => s.status === 'Completed').length;
                    const total = route.stops.length;
                    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

                    return (
                      <tr key={route.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{route.route_name}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            Driver: <strong>{route.assigned_worker_name || 'Unassigned'}</strong>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                              flex: 1,
                              height: 6,
                              borderRadius: 'var(--radius-full)',
                              background: 'var(--border-color)',
                              overflow: 'hidden',
                              minWidth: 60,
                            }}>
                              <div style={{
                                width: `${percent}%`,
                                height: '100%',
                                background: percent === 100 ? 'var(--accent-emerald)' : 'var(--primary)',
                                transition: 'width 0.3s ease',
                              }} />
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                              {completed}/{total}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${
                            route.status === 'Completed' ? 'badge-completed' :
                            route.status === 'In Progress' ? 'badge-inprogress' :
                            'badge-scheduled'
                          }`}>
                            {route.status}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              onSelectRoute(route.id);
                              onNavigate('routes');
                            }}
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity Audit Feed */}
        <div className="tailux-card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Live Operational Audit Feed</h2>
              <p className="card-description">Verified immutable event history</p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate('audit')}
            >
              Full Audit Log
            </button>
          </div>

          <div className="card-body" style={{ padding: '1rem 1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {logs.map((log) => (
                <div 
                  key={log.id} 
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.85rem',
                    paddingBottom: '0.85rem',
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 'var(--radius-md)',
                    background: log.entity_type === 'stop' ? 'var(--accent-emerald-light)' :
                                log.entity_type === 'route' ? 'var(--primary-light)' :
                                'var(--bg-subtle)',
                    color: log.entity_type === 'stop' ? 'var(--accent-emerald-text)' :
                           log.entity_type === 'route' ? 'var(--primary)' :
                           'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {log.entity_type === 'stop' ? <CheckCircle2 size={16} /> :
                     log.entity_type === 'route' ? <RouteIcon size={16} /> :
                     <Layers size={16} />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-main)' }}>
                        {log.action}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-body)', marginBottom: '4px' }}>
                      {log.details}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      <span>By <strong>{log.user_name}</strong></span>
                      <span>•</span>
                      <span className={`badge ${log.user_role === 'admin' ? 'badge-rose' : log.user_role === 'supervisor' ? 'badge-purple' : 'badge-blue'}`} style={{ fontSize: '0.6rem', padding: '0.05rem 0.35rem' }}>
                        {log.user_role.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Municipal Zone Capacity Summary */}
      <div className="tailux-card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Zone-Level Collection Capacity</h2>
            <p className="card-description">Bin fill distribution across municipal jurisdictions</p>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigate('zones')}
          >
            Manage Zones
          </button>
        </div>

        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {['Downtown Central', 'Central Commercial', 'East Sector Tech Corridor', 'North & West Residential'].map((zoneName) => {
              const zonePoints = points.filter((p) => p.area === zoneName);
              const avgFill = zonePoints.length > 0
                ? Math.round(zonePoints.reduce((acc, p) => acc + (p.estimated_fill_percent || 0), 0) / zonePoints.length)
                : 0;
              const hasAlert = avgFill >= 75;

              return (
                <div 
                  key={zoneName}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--text-main)' }}>{zoneName}</span>
                    <span className={`badge ${hasAlert ? 'badge-rose' : 'badge-emerald'}`} style={{ fontSize: '0.65rem' }}>
                      {avgFill}% Avg Fill
                    </span>
                  </div>

                  <div style={{
                    height: 6,
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--border-color)',
                    overflow: 'hidden',
                    marginBottom: '0.65rem',
                  }}>
                    <div style={{
                      width: `${avgFill}%`,
                      height: '100%',
                      background: hasAlert ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                    }} />
                  </div>

                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {zonePoints.length} active collection locations
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
