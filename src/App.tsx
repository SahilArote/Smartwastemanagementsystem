import { useState, useEffect, useCallback } from 'react';
import { 
  fetchCollectionPoints, 
  fetchRoutes, 
  getCurrentUser, 
  computeSystemStats, 
  saveCollectionPoint, 
  deleteCollectionPoint, 
  saveNewRoute, 
  updateStopStatus 
} from './services/storage';
import { checkActiveSession, signOutUser } from './services/auth';
import { getSavedSupabaseConfig } from './services/supabaseClient';
import type { CollectionPoint, Route, StopStatus, UserProfile } from './types';

// Layout Components
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { SignInView } from './components/SignInView';

// Views
import { DashboardView } from './components/DashboardView';
import { CollectionPointsView } from './components/CollectionPointsView';
import { ZonesAndSchedulesView } from './components/ZonesAndSchedulesView';
import { RoutePlannerView } from './components/RoutePlannerView';
import { SavedRoutesView } from './components/SavedRoutesView';
import { WorkerPortalView } from './components/WorkerPortalView';
import { ReportsView } from './components/ReportsView';
import { ActivityAuditView } from './components/ActivityAuditView';
import { UsersManagementView } from './components/UsersManagementView';
import { ProfileView } from './components/ProfileView';

// Modals & Notifications
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { ToastContainer } from './components/Toast';
import type { ToastMessage } from './components/Toast';

export function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getCurrentUser());
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // App Layout State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('smartwaste_theme') === 'dark' || true; // default dark/slate
  });

  // Data State
  const [points, setPoints] = useState<CollectionPoint[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  // Modals & Toasts
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sync theme to HTML attribute
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
      localStorage.setItem('smartwaste_theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('smartwaste_theme', 'light');
    }
  }, [isDarkMode]);

  // Load and refresh persisted data
  const refreshData = useCallback(async () => {
    try {
      const loadedPoints = await fetchCollectionPoints();
      const loadedRoutes = await fetchRoutes();
      setPoints(loadedPoints);
      setRoutes(loadedRoutes);
      setSelectedRouteId((prev) => (prev ? prev : (loadedRoutes[0]?.id || null)));
    } catch (e) {
      console.warn('Error refreshing database data:', e);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.all([fetchCollectionPoints(), fetchRoutes()]).then(([loadedPoints, loadedRoutes]) => {
      if (isMounted) {
        setPoints(loadedPoints);
        setRoutes(loadedRoutes);
        setSelectedRouteId((prev) => (prev ? prev : (loadedRoutes[0]?.id || null)));
      }
    });

    checkActiveSession().then((sessionUser) => {
      if (isMounted && sessionUser) {
        setCurrentUser(sessionUser);
        if (sessionUser.role === 'worker') {
          setActiveTab('worker');
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    if (user.role === 'worker') {
      setActiveTab('worker');
    } else {
      setActiveTab('dashboard');
    }
    refreshData();
  };

  const handleSignOut = async () => {
    await signOutUser();
    setCurrentUser(null);
    setActiveTab('dashboard');
    showToast('Signed out of operational session', 'info');
  };

  // Database-backed Point Handlers
  const handleAddPoint = async (point: CollectionPoint) => {
    const updated = await saveCollectionPoint(point);
    setPoints([...updated]);
  };

  const handleUpdatePoint = async (point: CollectionPoint) => {
    const updated = await saveCollectionPoint(point);
    setPoints([...updated]);
  };

  const handleDeletePoint = async (id: string) => {
    const updated = await deleteCollectionPoint(id);
    setPoints([...updated]);
  };

  // Database-backed Route Handlers
  const handleSaveRoute = async (newRoute: Route) => {
    const updated = await saveNewRoute(newRoute);
    setRoutes([...updated]);
    setSelectedRouteId(newRoute.id);
  };

  const handleUpdateStopStatus = async (
    routeId: string,
    stopId: string,
    status: StopStatus,
    notes?: string
  ) => {
    const updated = await updateStopStatus(routeId, stopId, status, notes);
    setRoutes([...updated]);
  };

  const stats = computeSystemStats(points, routes);
  const { url } = getSavedSupabaseConfig();
  const isSupabaseConfigured = Boolean(url && url.length > 5);

  // If unauthenticated: render dedicated Tailux SignIn page
  if (!currentUser) {
    return (
      <>
        <SignInView 
          onLoginSuccess={handleLoginSuccess}
          showToast={showToast}
        />
        <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
      </>
    );
  }

  // Role Access Guard:
  // If a worker tries to open restricted admin views, divert to worker portal
  const effectiveTab = (currentUser.role === 'worker' && ['points', 'zones', 'schedules', 'planner', 'users'].includes(activeTab))
    ? 'worker'
    : activeTab;

  return (
    <div className="app-layout">
      {/* Collapsible Tailux Sidebar */}
      <Sidebar
        activeTab={effectiveTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        stats={{
          totalPoints: stats.totalPoints,
          activeRoutes: stats.activeRoutes,
          pendingStops: stats.pendingStops,
        }}
      />

      {/* Main App Container */}
      <div className={`app-main ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Tailux Sticky Header */}
        <Header
          activeTab={effectiveTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          onSignOut={handleSignOut}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
          isSupabaseConfigured={isSupabaseConfigured}
        />

        {/* Dynamic View Display */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {effectiveTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              points={points}
              routes={routes}
              currentUser={currentUser}
              onNavigate={setActiveTab}
              onSelectRoute={(id) => setSelectedRouteId(id)}
            />
          )}

          {effectiveTab === 'points' && (
            <CollectionPointsView
              points={points}
              onAddPoint={handleAddPoint}
              onUpdatePoint={handleUpdatePoint}
              onDeletePoint={handleDeletePoint}
              showToast={showToast}
            />
          )}

          {effectiveTab === 'zones' && (
            <ZonesAndSchedulesView
              showToast={showToast}
            />
          )}

          {effectiveTab === 'schedules' && (
            <ZonesAndSchedulesView
              showToast={showToast}
            />
          )}

          {effectiveTab === 'planner' && (
            <RoutePlannerView
              collectionPoints={points}
              currentUser={currentUser}
              onSaveRoute={handleSaveRoute}
              onNavigateToRoutes={() => setActiveTab('routes')}
              showToast={showToast}
            />
          )}

          {effectiveTab === 'routes' && (
            <SavedRoutesView
              routes={routes}
              selectedRouteId={selectedRouteId}
              onSelectRouteId={setSelectedRouteId}
              onUpdateStopStatus={handleUpdateStopStatus}
              showToast={showToast}
              onRefreshData={refreshData}
            />
          )}

          {effectiveTab === 'worker' && (
            <WorkerPortalView
              currentUser={currentUser}
              routes={routes}
              onUpdateStopStatus={handleUpdateStopStatus}
              showToast={showToast}
            />
          )}

          {effectiveTab === 'reports' && (
            <ReportsView
              routes={routes}
              showToast={showToast}
            />
          )}

          {effectiveTab === 'audit' && (
            <ActivityAuditView
              showToast={showToast}
            />
          )}

          {effectiveTab === 'users' && (
            <UsersManagementView
              currentUser={currentUser}
              showToast={showToast}
            />
          )}

          {effectiveTab === 'profile' && (
            <ProfileView
              currentUser={currentUser}
            />
          )}
        </main>
      </div>

      {/* Supabase & Cloud Settings Modal */}
      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onSaveSuccess={() => {
          showToast('Database configuration updated', 'success');
          refreshData();
        }}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}

export default App;
