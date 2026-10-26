import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Bell, 
  Sun, 
  Moon, 
  Cloud, 
  Search, 
  LogOut, 
  User, 
  ChevronRight
} from 'lucide-react';
import type { UserProfile, AppNotification } from '../types';
import { fetchNotifications, markNotificationRead, clearAllNotifications } from '../services/storage';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserProfile;
  onOpenMobileSidebar: () => void;
  onOpenSupabaseModal: () => void;
  onSignOut: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  isSupabaseConfigured: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenMobileSidebar,
  onOpenSupabaseModal,
  onSignOut,
  isDarkMode,
  onToggleTheme,
  isSupabaseConfigured,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(fetchNotifications());
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    const updated = markNotificationRead(id);
    setNotifications(updated);
  };

  const handleClearAll = () => {
    const updated = clearAllNotifications();
    setNotifications(updated);
  };

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'points': return 'Collection Points';
      case 'zones': return 'Zones & Depots';
      case 'schedules': return 'Schedules & Shifts';
      case 'planner': return 'Route Planner';
      case 'routes': return 'Saved Routes';
      case 'worker': return 'Driver Field Console';
      case 'reports': return 'Operational Reports';
      case 'audit': return 'Activity Audit Log';
      case 'users': return 'Staff & Roles Management';
      case 'profile': return 'User Profile';
      default: return 'Overview';
    }
  };

  const getBreadcrumbCategory = () => {
    switch (activeTab) {
      case 'points':
      case 'zones':
      case 'schedules':
      case 'planner':
      case 'routes':
        return 'Operations';
      case 'worker':
        return 'Field Console';
      case 'reports':
      case 'audit':
      case 'users':
        return 'Governance';
      default:
        return 'Overview';
    }
  };

  return (
    <header className="app-header-top">
      {/* Left Section: Mobile Toggle & Breadcrumbs */}
      <div className="header-left">
        <button
          type="button"
          className="btn-sidebar-toggle"
          onClick={onOpenMobileSidebar}
          title="Open Menu"
        >
          <Menu size={18} />
        </button>

        <div className="header-breadcrumbs">
          <span style={{ color: 'var(--text-muted)' }}>{getBreadcrumbCategory()}</span>
          <ChevronRight size={13} style={{ color: 'var(--text-dim)' }} />
          <span className="current">{getBreadcrumbTitle()}</span>
        </div>
      </div>

      {/* Right Section: Search, Cloud Status, Notifications, Theme, User */}
      <div className="header-right">
        {/* Quick Search Button */}
        <button
          type="button"
          className="btn-header-icon"
          onClick={() => setIsSearchOpen(true)}
          title="Quick Search"
        >
          <Search size={18} />
        </button>

        {/* Cloud Sync Database Status Pill */}
        <button
          type="button"
          className="cloud-status-pill"
          onClick={onOpenSupabaseModal}
          title="Manage Cloud Database Configuration"
        >
          <Cloud size={14} color={isSupabaseConfigured ? 'var(--accent-emerald)' : 'var(--text-dim)'} />
          <span>{isSupabaseConfigured ? 'Supabase Live' : 'Local Persisted DB'}</span>
          <span className={`cloud-status-dot ${isSupabaseConfigured ? 'online' : 'local'}`} />
        </button>

        {/* Notification Bell Dropdown */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            type="button"
            className="btn-header-icon"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            title="Operational Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="header-notif-ping" />}
          </button>

          {isNotifOpen && (
            <div className="popover-menu" style={{ width: 320 }}>
              <div className="popover-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-main)' }}>Notifications</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{unreadCount} unread operational alerts</div>
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    No new alerts
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        handleMarkAsRead(n.id);
                        if (n.link_tab) setActiveTab(n.link_tab);
                        setIsNotifOpen(false);
                      }}
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        background: n.read ? 'transparent' : 'var(--primary-light)',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-main)' }}>{n.title}</span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>{n.timestamp}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-body)', lineHeight: 1.35 }}>{n.message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Switcher (Light / Dark Mode) */}
        <button
          type="button"
          className="btn-header-icon"
          onClick={onToggleTheme}
          title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {isDarkMode ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} />}
        </button>

        {/* User Profile Dropdown */}
        <div style={{ position: 'relative' }} ref={profileRef}>
          <button
            type="button"
            className="header-profile-btn"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            title="User Profile & Settings"
          >
            <div className="user-avatar" style={{ width: 28, height: 28, fontSize: '0.75rem' }}>
              {currentUser.full_name ? currentUser.full_name.substring(0, 2).toUpperCase() : 'US'}
            </div>
            <span className="header-profile-name" style={{ display: 'none', marginLeft: '2px' }}>
              {currentUser.full_name.split(' ')[0]}
            </span>
            <span className={`badge ${currentUser.role === 'admin' ? 'badge-rose' : currentUser.role === 'supervisor' ? 'badge-purple' : 'badge-blue'}`} style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem' }}>
              {currentUser.role.toUpperCase()}
            </span>
          </button>

          {isProfileOpen && (
            <div className="popover-menu" style={{ width: 260 }}>
              <div className="popover-header">
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  {currentUser.full_name}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  {currentUser.email}
                </div>
                <div style={{ marginTop: '0.4rem' }}>
                  <span className={`badge ${currentUser.role === 'admin' ? 'badge-rose' : currentUser.role === 'supervisor' ? 'badge-purple' : 'badge-blue'}`} style={{ fontSize: '0.66rem' }}>
                    {currentUser.role === 'admin' ? 'Administrator' : currentUser.role === 'supervisor' ? 'Operations Supervisor' : 'Collection Driver'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="popover-item"
                onClick={() => {
                  setActiveTab('profile');
                  setIsProfileOpen(false);
                }}
              >
                <User size={16} />
                <span>My Profile & Division</span>
              </button>

              <button
                type="button"
                className="popover-item"
                onClick={() => {
                  onOpenSupabaseModal();
                  setIsProfileOpen(false);
                }}
              >
                <Cloud size={16} />
                <span>Cloud Sync Configuration</span>
              </button>

              <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.35rem 0' }} />

              <button
                type="button"
                className="popover-item danger"
                onClick={() => {
                  setIsProfileOpen(false);
                  onSignOut();
                }}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Search Modal */}
      {isSearchOpen && (
        <div className="modal-backdrop" onClick={() => setIsSearchOpen(false)}>
          <div 
            className="modal-card" 
            style={{ maxWidth: 520 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Search size={18} color="var(--text-dim)" />
              <input
                type="text"
                autoFocus
                placeholder="Search collection points, routes, zones, staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  color: 'var(--text-main)',
                  fontSize: '0.95rem',
                  width: '100%',
                }}
              />
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={() => setIsSearchOpen(false)}
              >
                ESC
              </button>
            </div>

            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)' }}>
                Quick Navigation Shortcuts
              </div>
              <button
                type="button"
                className="popover-item"
                onClick={() => { setActiveTab('dashboard'); setIsSearchOpen(false); }}
              >
                <span>Dashboard Overview</span>
              </button>
              <button
                type="button"
                className="popover-item"
                onClick={() => { setActiveTab('points'); setIsSearchOpen(false); }}
              >
                <span>Manage Collection Points</span>
              </button>
              <button
                type="button"
                className="popover-item"
                onClick={() => { setActiveTab('planner'); setIsSearchOpen(false); }}
              >
                <span>Create New Route</span>
              </button>
              <button
                type="button"
                className="popover-item"
                onClick={() => { setActiveTab('worker'); setIsSearchOpen(false); }}
              >
                <span>Driver Field Console</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
