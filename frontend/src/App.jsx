import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';
import { CivicAuthProvider, UserButton } from '@civic/auth/react';
import Navbar from './components/Navbar';
import ParticlesBackground from './components/ParticlesBackground';
import ProtectedRoute from './components/ProtectedRoute';
import Notification from './components/Notification.jsx';

// Pages
import Home from './pages/Home';
import Auth from './pages/Auth';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import PaymentCallback from './pages/PaymentCallback';
import CheckIn from './pages/CheckIn';
import AuthCallback from './pages/AuthCallback';

// Notification wrapper component
const NotificationWrapper = () => {
  const { notifications, removeNotification } = useNotification();

  return (
    <Notification
      notifications={notifications}
      removeNotification={removeNotification}
    />
  );
};

function App() {
  // Check if Civic Auth is properly configured
  const civicClientId = import.meta.env.VITE_CIVIC_CLIENT_ID;
  const isCivicConfigured = civicClientId && civicClientId !== 'your_civic_client_id_from_dashboard';

  // Log configuration status
  if (!isCivicConfigured) {
    console.warn('Civic Auth not configured. Please set VITE_CIVIC_CLIENT_ID in your environment variables.');
    console.info('Visit https://auth.civic.com to get your Client ID');
  }

  // Render app content
  const appContent = (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <div className="min-h-screen bg-accent text-neutral">
            <ParticlesBackground />
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:id" element={<EventDetail />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/payment/callback" element={
                  <ProtectedRoute>
                    <PaymentCallback />
                  </ProtectedRoute>
                } />
                <Route path="/checkin" element={
                  <ProtectedRoute>
                    <CheckIn />
                  </ProtectedRoute>
                } />
              </Routes>
            </main>
            <NotificationWrapper />
          </div>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );

  // Wrap with Civic provider only if configured
  if (isCivicConfigured) {
    return (
      <CivicAuthProvider clientId={civicClientId}>
        {appContent}
      </CivicAuthProvider>
    );
  }

  return appContent;
}

export default App;
