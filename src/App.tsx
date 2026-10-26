import { useState, useEffect } from 'react';
import { 
  fetchCollectionPoints, 
  fetchRoutes, 
  getCurrentUser, 
  setCurrentUser as persistCurrentUser,
  computeSystemStats, 
  saveCollectionPoint, 
  deleteCollectionPoint, 
  saveNewRoute, 
  updateStopStatus 
} from './services/storage';
import { checkActiveSupabaseSession } from './services/auth';
import type { CollectionPoint, Route, StopStatus, UserProfile } from './types';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { CollectionPointsView } from './components/CollectionPointsView';
import { RoutePlannerView } from './components/RoutePlannerView';
import { SavedRoutesView } from './components/SavedRoutesView';
import { WorkerPortalView } from './components/WorkerPortalView';
import { ReportsView } from './components/ReportsView';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { AuthModal } from './components/AuthModal';
import { ToastContainer } from './components/Toast';
import type { ToastMessage } from './components/Toast';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentUser, setCurrentUserState] = useState<UserProfile>(getCurrentUser());
  const [points, setPoints] = useState<CollectionPoint[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Load Data directly from Supabase Database
  const refreshData = async () => {
    try {
      const loadedPoints = await fetchCollectionPoints();
      const loadedRoutes = await fetchRoutes();
      setPoints(loadedPoints);
      setRoutes(loadedRoutes);
      if (!selectedRouteId && loadedRoutes.length > 0) {
        setSelectedRouteId(loadedRoutes[0].id);
      }
    } catch (e) {
      console.warn('Error refreshing database data:', e);
    }
  };

  useEffect(() => {
    refreshData();

    // Check if an authenticated Supabase user session exists
    checkActiveSupabaseSession().then((sessionUser) => {
      if (sessionUser) {
        setCurrentUserState(sessionUser);
        persistCurrentUser(sessionUser);
      }
    });
  }, []);

  const handleSetCurrentUser = (user: UserProfile) => {
    persistCurrentUser(user);
    setCurrentUserState(user);
    showToast(`Active profile: ${user.full_name} (${user.role.toUpperCase()})`, 'info');
  };

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

  return (
    <div className="app-container">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onDataRefresh={refreshData}
      />

      {/* Main Workspace Body */}
      <main className="main-content">
        {activeTab === 'dashboard' && (
          <DashboardView
            stats={stats}
            points={points}
            routes={routes}
            currentUser={currentUser}
            onNavigate={setActiveTab}
            onSelectRoute={(id) => setSelectedRouteId(id)}
          />
        )}

        {activeTab === 'points' && (
          <CollectionPointsView
            points={points}
            onAddPoint={handleAddPoint}
            onUpdatePoint={handleUpdatePoint}
            onDeletePoint={handleDeletePoint}
            showToast={showToast}
          />
        )}

        {activeTab === 'planner' && (
          <RoutePlannerView
            collectionPoints={points}
            currentUser={currentUser}
            onSaveRoute={handleSaveRoute}
            onNavigateToRoutes={() => setActiveTab('routes')}
            showToast={showToast}
          />
        )}

        {activeTab === 'routes' && (
          <SavedRoutesView
            routes={routes}
            selectedRouteId={selectedRouteId}
            onSelectRouteId={setSelectedRouteId}
            onUpdateStopStatus={handleUpdateStopStatus}
            showToast={showToast}
          />
        )}

        {activeTab === 'worker' && (
          <WorkerPortalView
            currentUser={currentUser}
            routes={routes}
            onUpdateStopStatus={handleUpdateStopStatus}
            showToast={showToast}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            stats={stats}
            points={points}
            routes={routes}
            showToast={showToast}
          />
        )}
      </main>

      {/* Supabase & Cloud Settings Modal */}
      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onSaveSuccess={() => {
          showToast('Database configuration updated', 'success');
          refreshData();
        }}
      />

      {/* Supabase Auth & Automatic RBAC Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChange={handleSetCurrentUser}
        showToast={showToast}
      />

      {/* Floating Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}

export default App;
