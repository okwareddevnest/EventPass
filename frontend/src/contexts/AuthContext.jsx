import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@civic/auth/react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { user: civicUser, isLoading: civicLoading } = useUser();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Combine loading states
  useEffect(() => {
    if (!civicLoading) {
      setLoading(false);
    }
  }, [civicLoading]);

  useEffect(() => {
    if (token && !civicUser) {
      // Verify token and get user profile only if not using Civic auth
      verifyToken();
    } else {
      setLoading(false);
    }
  }, [token, civicUser]);

  const verifyToken = async () => {
    try {
      const data = await authAPI.getCurrentUser();
      setUser(data.user);
    } catch (error) {
      console.error('Token verification error:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (civicToken, userData) => {
    try {
      const data = await authAPI.verify({
        token: civicToken,
        civicId: userData.civicId,
        name: userData.name,
        email: userData.email,
        walletAddress: userData.walletAddress,
      });

      const jwtToken = data.token;
      localStorage.setItem('token', jwtToken);
      setToken(jwtToken);
      setUser(data.user);

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Network error occurred' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    try {
      const data = await authAPI.updateProfile(profileData);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: error.message || 'Network error occurred' };
    }
  };

  // Use Civic user if available, fallback to custom auth user
  const currentUser = civicUser || user;
  const isAuthenticated = !!currentUser;

  const value = {
    user: currentUser,
    token,
    loading,
    login,
    logout,
    updateProfile,
    isAuthenticated,
    isOrganizer: currentUser?.role === 'organizer',
    isOrganization: currentUser?.role === 'organization',
    isApprovedOrganization: currentUser?.role === 'organization' && currentUser?.organizationDetails?.isApproved,
    isCivicUser: !!civicUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
