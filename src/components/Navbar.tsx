import { 
  LayoutDashboard, 
  MapPin, 
  Route as RouteIcon, 
  Truck, 
  BarChart3, 
  UserCheck, 
  RotateCcw, 
  Cloud, 
  Lock, 
  User 
} from 'lucide-react';
import type { UserProfile } from '../types';
import { resetDemoData } from '../services/storage';
import { getSavedSupabaseConfig } from '../services/supabaseClient';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserProfile;
  onOpenSupabaseModal: () => void;
  onOpenAuthModal: () => void;
  onDataRefresh: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenSupabaseModal,
  onOpenAuthModal,
  onDataRefresh,
}) => {
  const { url } = getSavedSupabaseConfig();
  const isSupabaseConfigured = Boolean(url && url.length > 5);
  const isAdmin = currentUser.role === 'admin';

  const handleResetData = () => {
    if (window.confirm('Reset all collection points, routes, and stops back to the default municipal demo dataset?')) {
      resetDemoData();
      onDataRefresh();
    }
  };

  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-logo-badge">
          <Truck size={22} />
        </div>
        <div>
          <div className="brand-title">
            SmartRoute <span className="brand-badge">PRD v1.0</span>
          </div>
          <div className="brand-subtitle">Cloud Waste Collection Route Planner</div>
        </div>
      </div>

      {/* Role-Enforced Navigation Tabs (FR-01) */}
      <nav className="nav-tabs">
        <button
          className={`nav-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
          id="nav-dashboard"
        >
          <LayoutDashboard size={16} />
          <span>Dashboard</span>
        </button>

        {/* Collection Points (Admin Only) */}
        <button
          className={`nav-tab-btn ${activeTab === 'points' ? 'active' : ''}`}
          onClick={() => {
            if (isAdmin) {
              setActiveTab('points');
            } else {
              alert('Access Restricted: Only Municipal Administrators can manage collection points.');
            }
          }}
          id="nav-points"
          style={{ opacity: isAdmin ? 1 : 0.65 }}
          title={isAdmin ? 'Manage Points' : 'Restricted to Administrators'}
        >
          {isAdmin ? <MapPin size={16} /> : <Lock size={14} color="#f59e0b" />}
          <span>Collection Points</span>
        </button>

        {/* Route Planner (Admin Only) */}
        <button
          className={`nav-tab-btn ${activeTab === 'planner' ? 'active' : ''}`}
          onClick={() => {
            if (isAdmin) {
              setActiveTab('planner');
            } else {
              alert('Access Restricted: Only Municipal Administrators can plan and assign routes.');
            }
          }}
          id="nav-planner"
          style={{ opacity: isAdmin ? 1 : 0.65 }}
          title={isAdmin ? 'Route Planner' : 'Restricted to Administrators'}
        >
          {isAdmin ? <RouteIcon size={16} /> : <Lock size={14} color="#f59e0b" />}
          <span>Route Planner</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'routes' ? 'active' : ''}`}
          onClick={() => setActiveTab('routes')}
          id="nav-routes"
        >
          <Truck size={16} />
          <span>Saved Routes</span>
        </button>

        {/* Worker Field Terminal */}
        <button
          className={`nav-tab-btn ${activeTab === 'worker' ? 'active' : ''}`}
          onClick={() => setActiveTab('worker')}
          id="nav-worker"
        >
          <UserCheck size={16} />
          <span>Worker Portal</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
          id="nav-reports"
        >
          <BarChart3 size={16} />
          <span>Reports</span>
        </button>
      </nav>

      <div className="header-actions">
        {/* Reset Demo Data */}
        <button
          className="btn btn-secondary btn-sm"
          title="Reset Demo Dataset"
          onClick={handleResetData}
        >
          <RotateCcw size={14} />
          <span>Reset Demo</span>
        </button>

        {/* Cloud / Supabase Status Button */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={onOpenSupabaseModal}
          title="Cloud Database Settings"
          style={{
            borderColor: isSupabaseConfigured ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <Cloud size={14} color={isSupabaseConfigured ? '#10b981' : '#94a3b8'} />
          <span style={{ fontSize: '11px' }}>
            {isSupabaseConfigured ? 'Supabase Live' : 'Cloud Sync'}
          </span>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: isSupabaseConfigured ? '#10b981' : '#06b6d4',
            }}
          />
        </button>

        {/* Supabase Auth & RBAC Profile Button */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={onOpenAuthModal}
          title="Supabase Auth & RBAC Profile"
          style={{ background: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.15)' }}
        >
          <User size={14} color={isAdmin ? '#34d399' : '#60a5fa'} />
          <span style={{ fontWeight: 600, fontSize: '0.75rem' }}>{currentUser.full_name || 'Sign In'}</span>
          <span className={`badge ${isAdmin ? 'badge-low' : 'badge-inprogress'}`} style={{ fontSize: '0.62rem', padding: '0.05rem 0.35rem' }}>
            {currentUser.role.toUpperCase()}
          </span>
        </button>
      </div>
    </header>
  );
};
