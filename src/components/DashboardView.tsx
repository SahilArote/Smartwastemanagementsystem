import React from 'react';
import { 
  MapPin, 
  Route as RouteIcon, 
  Clock, 
  CheckCircle2, 
  Plus, 
  ArrowRight,
  Calendar,
  UserCheck
} from 'lucide-react';
import type { CollectionPoint, Route, SystemStats, UserProfile } from '../types';
import { MapView } from './MapView';
import { getDepots } from '../services/storage';

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
  const depots = getDepots();
  const primaryDepot = depots[0];

  // Most recent route
  const recentRoutes = routes.slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Welcome Banner */}
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '16px',
          padding: '1.5rem',
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
              Welcome back, {currentUser.full_name}
            </span>
            <span className={`badge ${currentUser.role === 'admin' ? 'badge-low' : 'badge-inprogress'}`}>
              {currentUser.role.toUpperCase()}
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
            Municipal Smart Waste Central Dispatch • Real-time collection status & route execution
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => onNavigate('points')} id="btn-quick-add-point">
            <Plus size={16} />
            <span>Add Collection Point</span>
          </button>
          <button className="btn btn-primary" onClick={() => onNavigate('planner')} id="btn-quick-plan-route">
            <RouteIcon size={16} />
            <span>Plan New Route</span>
          </button>
        </div>
      </div>

      {/* Metrics Row (FR-02) */}
      <div className="dashboard-metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-wrap green">
            <MapPin size={24} />
          </div>
          <div className="metric-info">
            <h4>Total Collection Points</h4>
            <div className="metric-value">{stats.totalPoints}</div>
            <div className="metric-subtext">Active municipal bins</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap cyan">
            <RouteIcon size={24} />
          </div>
          <div className="metric-info">
            <h4>Saved Routes</h4>
            <div className="metric-value">{stats.totalRoutes}</div>
            <div className="metric-subtext">{stats.activeRoutes} Currently In Progress</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap amber">
            <Clock size={24} />
          </div>
          <div className="metric-info">
            <h4>Pending Stops</h4>
            <div className="metric-value">{stats.pendingStops}</div>
            <div className="metric-subtext">{stats.inProgressStops} being collected</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap purple">
            <CheckCircle2 size={24} />
          </div>
          <div className="metric-info">
            <h4>Completed Stops</h4>
            <div className="metric-value">{stats.completedStops}</div>
            <div className="metric-subtext">{stats.completionRate}% completion rate</div>
          </div>
        </div>
      </div>

      {/* Split Section: Live Map & Recent Routes */}
      <div className="split-view-container">
        {/* Left: Interactive Map Overview (FR-04) */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>Municipal Collection Grid</h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Live visualization of collection points & main depot</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('planner')}>
              <span>Full Route Planner</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <MapView
            depot={primaryDepot}
            collectionPoints={points}
            height="420px"
          />

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.75rem', color: '#94a3b8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }}></span>
              <span>High Priority</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }}></span>
              <span>Medium Priority</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }}></span>
              <span>Low Priority</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6' }}></span>
              <span>Depot Facility</span>
            </div>
          </div>
        </div>

        {/* Right: Recent Routes & Operations Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Active Routes Card */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>Planned & Active Routes</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('routes')}>
                <span>View All ({routes.length})</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {recentRoutes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8' }}>
                <RouteIcon size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
                <p>No routes generated yet.</p>
                <button className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }} onClick={() => onNavigate('planner')}>
                  Create First Route
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recentRoutes.map((route) => {
                  const completed = route.stops.filter((s) => s.status === 'Completed').length;
                  const total = route.stops.length;
                  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;

                  return (
                    <div
                      key={route.id}
                      onClick={() => {
                        onSelectRoute(route.id);
                        onNavigate('routes');
                      }}
                      style={{
                        padding: '0.9rem',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#ffffff' }}>
                            {route.route_name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '2px' }}>
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

                      {/* Progress Bar */}
                      <div style={{ marginTop: '0.6rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>
                          <span>Stops: {completed} / {total} Completed</span>
                          <span style={{ fontWeight: 600, color: progressPct === 100 ? '#10b981' : '#06b6d4' }}>
                            {progressPct}% ({route.total_distance_km ? `${route.total_distance_km} km` : 'Est.'})
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${progressPct}%`,
                              height: '100%',
                              background: progressPct === 100 ? '#10b981' : 'linear-gradient(90deg, #06b6d4, #10b981)',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Operations Summary */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.75rem', letterSpacing: '0.04em' }}>
              Collection Priority Breakdown
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', padding: '0.75rem 0.5rem' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f87171' }}>
                  {points.filter((p) => p.priority === 'High').length}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>High Priority</div>
              </div>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '8px', padding: '0.75rem 0.5rem' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fbbf24' }}>
                  {points.filter((p) => p.priority === 'Medium').length}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Medium Priority</div>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', padding: '0.75rem 0.5rem' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#34d399' }}>
                  {points.filter((p) => p.priority === 'Low').length}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Low Priority</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
