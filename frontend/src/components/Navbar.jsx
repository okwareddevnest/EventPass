import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useUser, UserButton } from '@civic/auth/react';
import { Menu, X, User, LogOut, Calendar, Home, BarChart3, QrCode } from 'lucide-react';

const Navbar = () => {
  const { user: civicUser, signOut } = useUser();
  const { user, isAuthenticated, logout, isOrganizer } = useAuth();
  const { info } = useNotification();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Use Civic Auth user if available, fallback to custom auth
  const currentUser = civicUser || user;
  const isLoggedIn = civicUser || isAuthenticated;

  const handleLogout = async () => {
    try {
      if (civicUser) {
        // Use Civic Auth signOut
        await signOut();
      } else {
        // Use custom auth logout
        logout();
      }
      info('Successfully logged out');
      navigate('/');
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 glassmorphism border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2 hover:scale-105 transition-transform duration-200"
            onClick={closeMobileMenu}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">EP</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              EventPass
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="flex items-center space-x-1 text-neutral hover:text-primary transition-colors duration-200"
            >
              <Home size={18} />
              <span>Home</span>
            </Link>

            <Link
              to="/events"
              className="flex items-center space-x-1 text-neutral hover:text-primary transition-colors duration-200"
            >
              <Calendar size={18} />
              <span>Events</span>
            </Link>

            {/* Civic Auth User Button */}
            <UserButton />

            {/* Additional navigation for authenticated users */}
            {isLoggedIn && isOrganizer && (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-1 text-neutral hover:text-primary transition-colors duration-200"
                >
                  <BarChart3 size={18} />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/checkin"
                  className="flex items-center space-x-1 text-neutral hover:text-primary transition-colors duration-200"
                >
                  <QrCode size={18} />
                  <span>Check-In</span>
                </Link>
              </>
            )}

            {isLoggedIn && (
              <Link
                to="/profile"
                className="flex items-center space-x-1 text-neutral hover:text-primary transition-colors duration-200"
              >
                <User size={18} />
                <span>Profile</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden text-neutral hover:text-primary transition-colors duration-200"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            <div className="flex flex-col space-y-4">
              <Link
                to="/"
                className="flex items-center space-x-2 text-neutral hover:text-primary transition-colors duration-200 py-2"
                onClick={closeMobileMenu}
              >
                <Home size={18} />
                <span>Home</span>
              </Link>

              <Link
                to="/events"
                className="flex items-center space-x-2 text-neutral hover:text-primary transition-colors duration-200 py-2"
                onClick={closeMobileMenu}
              >
                <Calendar size={18} />
                <span>Events</span>
              </Link>

              {/* Civic Auth User Button for mobile */}
              <div className="py-2">
                <UserButton />
              </div>

              {/* Additional navigation for authenticated users */}
              {isLoggedIn && isOrganizer && (
                <>
                  <Link
                    to="/dashboard"
                    className="flex items-center space-x-2 text-neutral hover:text-primary transition-colors duration-200 py-2"
                    onClick={closeMobileMenu}
                  >
                    <BarChart3 size={18} />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/checkin"
                    className="flex items-center space-x-2 text-neutral hover:text-primary transition-colors duration-200 py-2"
                    onClick={closeMobileMenu}
                  >
                    <QrCode size={18} />
                    <span>Check-In</span>
                  </Link>
                </>
              )}

              {isLoggedIn && (
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 text-neutral hover:text-primary transition-colors duration-200 py-2"
                  onClick={closeMobileMenu}
                >
                  <User size={18} />
                  <span>Profile</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
