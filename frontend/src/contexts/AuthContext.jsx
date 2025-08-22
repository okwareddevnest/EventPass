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

  // Handle initial authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      
      // If we have a token, verify it
      if (token) {
        await verifyToken();
      }
      
      // If we have a Civic user but no token, handle the authentication
      if (civicUser && !token) {
        console.log('Civic user detected, processing authentication...');
        await handleCivicUserAuth(civicUser);
      }
      
      if (!civicLoading) {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [civicUser, token, civicLoading]);

  // Handle Civic user authentication
  const handleCivicUserAuth = async (civicUserData) => {
    try {
      console.log('Processing Civic user authentication:', civicUserData);
      
      // Extract user data from Civic user
      const userData = {
        civicId: civicUserData.id || civicUserData.sub || `temp-${Date.now()}`,
        name: civicUserData.name || civicUserData.displayName || 'Civic User',
        email: civicUserData.email || civicUserData.emailAddress || null,
        walletAddress: civicUserData.walletAddress || civicUserData.publicKey || null
      };

      if (!userData.email) {
        console.error('No email found in Civic user data');
        return;
      }

      // Create a mock token for the verify endpoint
      const mockToken = 'civic-auth-token';
      
      const result = await login(mockToken, userData);
      
      if (result.success) {
        console.log('✅ Civic user authentication successful:', result.user);
      } else {
        console.error('❌ Civic user authentication failed:', result.error);
      }
    } catch (error) {
      console.error('Error processing Civic user authentication:', error);
    }
  };

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

  // Prefer JWT user data over Civic user data for role-based access
  // Civic user is used for authentication, JWT user contains role information
  const currentUser = user || civicUser;
  const isAuthenticated = !!currentUser;

  const value = {
    user: currentUser,
    token,
    loading,
    login,
    logout,
    updateProfile,
    isAuthenticated,
    isAdmin: currentUser?.role === 'admin',
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
