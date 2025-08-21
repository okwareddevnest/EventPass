import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';
import { CivicAuthProvider } from '@civic/auth/react';
import { CivicAuthProvider as CivicAuthWeb3Provider } from '@civic/auth-web3/react';
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
  const civicConfig = {
    clientId: import.meta.env.VITE_CIVIC_CLIENT_ID || 'your-civic-client-id',
    redirectUri: window.location.origin + '/auth/callback',
  };

  const civicWeb3Config = {
    ...civicConfig,
    chain: 'ethereum', // or 'solana' based on your preference
  };

  return (
    <CivicAuthProvider config={civicConfig}>
      <CivicAuthWeb3Provider config={civicWeb3Config}>
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
      </CivicAuthWeb3Provider>
    </CivicAuthProvider>
  );
}

export default App;
