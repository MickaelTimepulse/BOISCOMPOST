import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/LoginForm';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { DriverDashboard } from './components/DriverDashboard';
import { ClientTracking } from './components/ClientTracking';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'auth' | 'tracking'>('auth');

  useEffect(() => {
    const path = window.location.pathname;
    const trackingMatch = path.match(/\/tracking\/?/);

    if (trackingMatch) {
      setCurrentView('tracking');
    } else {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'tracking') {
        setCurrentView('tracking');
      }
    }
  }, []);

  if (currentView === 'tracking') {
    return <ClientTracking />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-700" />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div>
        <LoginForm />
        <div className="text-center py-4">
          <button
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set('view', 'tracking');
              window.history.pushState({}, '', url);
              setCurrentView('tracking');
            }}
            className="text-gray-600 hover:text-green-700 font-medium transition-colors text-sm"
          >
            Suivre mes collectes
          </button>
        </div>
      </div>
    );
  }

  if (profile.role === 'super_admin') {
    return <SuperAdminDashboard />;
  }

  if (profile.role === 'driver') {
    return <DriverDashboard />;
  }

  return null;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
