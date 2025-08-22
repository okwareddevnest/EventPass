import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { Shield, Wallet, ArrowLeft } from 'lucide-react';
import { useUser } from '@civic/auth/react';

const Auth = () => {
  const { login, isAuthenticated } = useAuth();
  const { error, info } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState('web2'); // 'web2' or 'web3'

  // Check if Civic Auth is configured
  const civicClientId = import.meta.env.VITE_CIVIC_CLIENT_ID;
  const isCivicConfigured = civicClientId && civicClientId !== 'your_civic_client_id_from_dashboard';

  // Use Civic Auth hook
  const { user, signIn, signOut, isLoading, authStatus } = useUser();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

    const handleLogin = async () => {
    setLoading(true);

    if (!isCivicConfigured) {
      error('Civic Auth is not configured. Please set up your Civic Client ID.');
      setLoading(false);
      return;
    }

    if (!signIn) {
      error('Civic Auth is not available. Please check your configuration.');
      setLoading(false);
      return;
    }

    try {
      console.log('Starting Civic Auth with method:', authMethod);
      console.log('Current domain:', window.location.origin);

      // Use Civic Auth sign-in with specific configuration for production
      const authConfig = {
        redirectUri: `${window.location.origin}/auth/callback`,
        scope: ['openid', 'profile', 'email'],
        responseMode: 'fragment', // Try different response mode
      };

      console.log('Auth config:', authConfig);

      await signIn(authConfig);

      // The user will be redirected to Civic Auth
      // After successful authentication, they'll be redirected back to /auth/callback
      // where we'll handle the token exchange and user creation
    } catch (err) {
      console.error('Login error:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });

      // Provide more specific error messages
      if (err.message?.includes('popup')) {
        error('Popup blocked. Please allow popups for this site and try again.');
      } else if (err.message?.includes('network')) {
        error('Network error. Please check your internet connection and try again.');
      } else if (err.message?.includes('origin') || err.message?.includes('postMessage')) {
        error('Authentication configuration issue. Please try again or contact support.');
      } else if (err.message?.includes('cancelled') || err.message?.includes('abort')) {
        error('Authentication was cancelled. Please try again.');
      } else if (err.message?.includes('timeout')) {
        error('Authentication timed out. Please try again.');
      } else {
        error(`Authentication failed: ${err.message || 'Unknown error'}`);
      }

      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="flex items-center space-x-2 text-neutral/70 hover:text-neutral transition-colors duration-200 mb-8"
        >
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </button>

        {/* Auth Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield size={32} className="text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-neutral mb-2">Welcome to EventPass</h1>
            <p className="text-neutral/70">
              Choose your authentication method to continue
            </p>
          </div>

          {/* Configuration Status */}
          {!isCivicConfigured && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
              <h3 className="text-yellow-200 font-semibold mb-2">Configuration Required</h3>
              <p className="text-yellow-200/80 text-sm mb-3">
                Civic Auth needs to be configured to enable authentication.
              </p>
              <div className="text-xs text-yellow-200/70">
                <p className="mb-1"><strong>Setup Steps:</strong></p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Get your Civic Client ID from <a href="https://auth.civic.com" target="_blank" rel="noopener noreferrer" className="text-yellow-300 underline">auth.civic.com</a></li>
                  <li>Update VITE_CIVIC_CLIENT_ID in your .env file</li>
                  <li>Restart the development server</li>
                </ol>
              </div>
            </div>
          )}

          {/* Auth Method Toggle */}
          <div className="flex bg-white/5 rounded-lg p-1 mb-6">
            <button
              onClick={() => setAuthMethod('web2')}
              disabled={!isCivicConfigured}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                authMethod === 'web2'
                  ? 'bg-primary text-white shadow-lg'
                  : 'text-neutral/70 hover:text-neutral'
              } ${!isCivicConfigured ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Shield size={16} className="inline mr-2" />
              Civic Web2
              {!isCivicConfigured && ' (Configure)'}
            </button>
            <button
              onClick={() => setAuthMethod('web3')}
              disabled={!isCivicConfigured}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                authMethod === 'web3'
                  ? 'bg-secondary text-white shadow-lg'
                  : 'text-neutral/70 hover:text-neutral'
              } ${!isCivicConfigured ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Wallet size={16} className="inline mr-2" />
              Civic Web3
              {!isCivicConfigured && ' (Configure)'}
            </button>
          </div>

          {/* Auth Form */}
          <div className="space-y-4">
            {authMethod === 'web2' ? (
              <div className="text-center">
                <button
                  onClick={handleLogin}
                  disabled={loading || !isCivicConfigured}
                  className="w-full bg-gradient-to-r from-primary to-primary/80 text-white py-4 px-6 rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Connecting...
                    </div>
                  ) : !isCivicConfigured ? (
                    <>
                      <Shield size={20} className="inline mr-2" />
                      Configure Civic Auth First
                    </>
                  ) : (
                    <>
                      <Shield size={20} className="inline mr-2" />
                      Login with Civic
                    </>
                  )}
                </button>

                <p className="text-xs text-neutral/50 mt-3">
                  Secure authentication with Civic Auth
                </p>
              </div>
            ) : (
              <div className="text-center">
                <button
                  onClick={handleLogin}
                  disabled={loading || !isCivicConfigured}
                  className="w-full bg-gradient-to-r from-secondary to-secondary/80 text-white py-4 px-6 rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Connecting...
                    </div>
                  ) : !isCivicConfigured ? (
                    <>
                      <Wallet size={20} className="inline mr-2" />
                      Configure Civic Auth First
                    </>
                  ) : (
                    <>
                      <Wallet size={20} className="inline mr-2" />
                      Connect with Web3 Wallet
                    </>
                  )}
                </button>

                <p className="text-xs text-neutral/50 mt-3">
                  Connect your wallet for blockchain authentication
                </p>
              </div>
            )}
          </div>

          {/* Features */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <h3 className="text-sm font-semibold text-neutral mb-4">Why choose Civic Auth?</h3>
            <ul className="space-y-2 text-xs text-neutral/70">
              <li className="flex items-center">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3"></div>
                Decentralized identity verification
              </li>
              <li className="flex items-center">
                <div className="w-1.5 h-1.5 bg-secondary rounded-full mr-3"></div>
                No personal data storage
              </li>
              <li className="flex items-center">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-3"></div>
                Works across all EventPass features
              </li>
            </ul>
          </div>
        </div>

        {/* Civic Auth Info */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-xs text-blue-200 text-center">
            <strong>Powered by Civic Auth:</strong> Secure, decentralized authentication 
            with support for Web2 and Web3 wallets. 
            <a href="https://docs.civic.com/" target="_blank" rel="noopener noreferrer" 
               className="text-blue-300 hover:text-blue-100 underline ml-1">
              Learn more
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
