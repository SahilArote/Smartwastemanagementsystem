import React from 'react';
import { 
  LayoutDashboard, 
  MapPin, 
  Layers, 
  CalendarClock, 
  Route as RouteIcon, 
  Truck, 
  UserCheck, 
  BarChart3, 
  History, 
  Users, 
  Lock, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import type { UserProfile } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserProfile;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  stats: {
    totalPoints: number;
    activeRoutes: number;
    pendingStops: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  stats,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const isWorker = currentUser.role === 'worker';

  const handleNavClick = (tab: string, requiredRole?: 'admin' | 'supervisor') => {
    if (requiredRole === 'admin' && !isAdmin) {
      return;
    }
    if (requiredRole === 'supervisor' && isWorker) {
      return;
    }
    setActiveTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className={`sidebar-overlay ${isMobileOpen ? 'active' : ''}`}
        onClick={onCloseMobile}
      />

      <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo-group">
            <div className="sidebar-logo-icon">
              <Truck size={20} />
            </div>
            {!isCollapsed && (
              <div className="sidebar-logo-text">
                <span className="sidebar-logo-title">
                  SmartRoute <span className="sidebar-logo-badge">CRM</span>
                </span>
                <span className="sidebar-logo-subtitle">Municipal Operations</span>
              </div>
            )}
          </div>
          <button 
            type="button" 
            className="btn-sidebar-toggle"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation Groups */}
        <div className="sidebar-nav-container">
          {/* Main Dashboard - Available to Admin & Supervisor, or Worker Dashboard */}
          <div>
            {!isCollapsed && <div className="sidebar-group-title">Overview</div>}
            <ul className="sidebar-menu-list">
              <li>
                <button
                  type="button"
                  className={`sidebar-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                  onClick={() => handleNavClick('dashboard')}
                  title="Operational Dashboard"
                >
                  <span className="sidebar-nav-icon"><LayoutDashboard size={18} /></span>
                  {!isCollapsed && <span>CRM Dashboard</span>}
                </button>
              </li>
            </ul>
          </div>

          {/* Operations Group - Available to Admin & Supervisor */}
          {!isWorker && (
            <div>
              {!isCollapsed && <div className="sidebar-group-title">Operations</div>}
              <ul className="sidebar-menu-list">
                <li>
                  <button
                    type="button"
                    className={`sidebar-nav-item ${activeTab === 'points' ? 'active' : ''}`}
                    onClick={() => handleNavClick('points')}
                    title="Collection Points"
                  >
                    <span className="sidebar-nav-icon"><MapPin size={18} /></span>
                    {!isCollapsed && (
                      <>
                        <span>Collection Points</span>
                        <span className="sidebar-badge-count">{stats.totalPoints}</span>
                      </>
                    )}
                  </button>
                </li>

                <li>
                  <button
                    type="button"
                    className={`sidebar-nav-item ${activeTab === 'zones' ? 'active' : ''}`}
                    onClick={() => handleNavClick('zones')}
                    title="Zones & Facilities"
                  >
                    <span className="sidebar-nav-icon"><Layers size={18} /></span>
                    {!isCollapsed && <span>Zones & Facilities</span>}
                  </button>
                </li>

                <li>
                  <button
                    type="button"
                    className={`sidebar-nav-item ${activeTab === 'schedules' ? 'active' : ''}`}
                    onClick={() => handleNavClick('schedules')}
                    title="Collection Schedules"
                  >
                    <span className="sidebar-nav-icon"><CalendarClock size={18} /></span>
                    {!isCollapsed && <span>Schedules & Shifts</span>}
                  </button>
                </li>

                <li>
                  <button
                    type="button"
                    className={`sidebar-nav-item ${activeTab === 'planner' ? 'active' : ''}`}
                    onClick={() => handleNavClick('planner')}
                    title="Route Planner"
                  >
                    <span className="sidebar-nav-icon"><RouteIcon size={18} /></span>
                    {!isCollapsed && <span>Route Planner</span>}
                  </button>
                </li>

                <li>
                  <button
                    type="button"
                    className={`sidebar-nav-item ${activeTab === 'routes' ? 'active' : ''}`}
                    onClick={() => handleNavClick('routes')}
                    title="Saved Routes"
                  >
                    <span className="sidebar-nav-icon"><Truck size={18} /></span>
                    {!isCollapsed && (
                      <>
                        <span>Saved Routes</span>
                        {stats.activeRoutes > 0 && (
                          <span className="badge badge-amber" style={{ marginLeft: 'auto', fontSize: '0.65rem' }}>
                            {stats.activeRoutes} Active
                          </span>
                        )}
                      </>
                    )}
                  </button>
                </li>
              </ul>
            </div>
          )}

          {/* Field Operations Console */}
          <div>
            {!isCollapsed && <div className="sidebar-group-title">Field Operations</div>}
            <ul className="sidebar-menu-list">
              <li>
                <button
                  type="button"
                  className={`sidebar-nav-item ${activeTab === 'worker' ? 'active' : ''}`}
                  onClick={() => handleNavClick('worker')}
                  title="Worker Field Terminal"
                >
                  <span className="sidebar-nav-icon"><UserCheck size={18} /></span>
                  {!isCollapsed && (
                    <>
                      <span>Driver Field Portal</span>
                      {stats.pendingStops > 0 && isWorker && (
                        <span className="badge badge-rose" style={{ marginLeft: 'auto', fontSize: '0.65rem' }}>
                          {stats.pendingStops} Stops
                        </span>
                      )}
                    </>
                  )}
                </button>
              </li>
            </ul>
          </div>

          {/* Analytics & Governance */}
          <div>
            {!isCollapsed && <div className="sidebar-group-title">Analytics & Audit</div>}
            <ul className="sidebar-menu-list">
              {!isWorker && (
                <li>
                  <button
                    type="button"
                    className={`sidebar-nav-item ${activeTab === 'reports' ? 'active' : ''}`}
                    onClick={() => handleNavClick('reports')}
                    title="Operational Reports"
                  >
                    <span className="sidebar-nav-icon"><BarChart3 size={18} /></span>
                    {!isCollapsed && <span>Operational Reports</span>}
                  </button>
                </li>
              )}

              <li>
                <button
                  type="button"
                  className={`sidebar-nav-item ${activeTab === 'audit' ? 'active' : ''}`}
                  onClick={() => handleNavClick('audit')}
                  title="Activity Audit Log"
                >
                  <span className="sidebar-nav-icon"><History size={18} /></span>
                  {!isCollapsed && <span>Activity Audit Log</span>}
                </button>
              </li>

              {/* Staff & Roles (Admin Only) */}
              <li>
                <button
                  type="button"
                  className={`sidebar-nav-item ${activeTab === 'users' ? 'active' : ''}`}
                  onClick={() => handleNavClick('users', 'admin')}
                  style={{ opacity: isAdmin ? 1 : 0.55 }}
                  title={isAdmin ? 'Staff & Roles' : 'Restricted to Administrators'}
                >
                  <span className="sidebar-nav-icon">
                    {isAdmin ? <Users size={18} /> : <Lock size={16} />}
                  </span>
                  {!isCollapsed && (
                    <>
                      <span>Staff & Roles</span>
                      {!isAdmin && (
                        <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'var(--accent-amber)' }}>
                          ADMIN
                        </span>
                      )}
                    </>
                  )}
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Sidebar Footer Profile */}
        <div className="sidebar-footer">
          <div 
            className="sidebar-user-card"
            onClick={() => setActiveTab('profile')}
            title="View User Profile"
          >
            <div className="user-avatar">
              {currentUser.full_name ? currentUser.full_name.substring(0, 2).toUpperCase() : 'US'}
            </div>
            {!isCollapsed && (
              <div className="user-info">
                <span className="user-name">{currentUser.full_name}</span>
                <span className="user-role-tag">
                  {currentUser.role === 'admin' ? 'Administrator' : currentUser.role === 'supervisor' ? 'Supervisor' : 'Field Driver'}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
