import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';
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
  return (
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
  );
}

export default App;
