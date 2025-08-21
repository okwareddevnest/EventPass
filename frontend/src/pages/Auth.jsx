import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { Shield, Wallet, ArrowLeft } from 'lucide-react';

const Auth = () => {
  const { login, isAuthenticated } = useAuth();
  const { error, info } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState('web2'); // 'web2' or 'web3'

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleWeb2Login = async () => {
    setLoading(true);

    try {
      // Simulate Civic Web2 Auth
      // In production, this would integrate with Civic's Web2 SDK
      const mockCivicToken = 'mock-civic-token-' + Date.now();
      const mockUserData = {
        civicId: 'user-' + Date.now(),
        name: 'Demo User',
        email: 'demo@example.com',
        walletAddress: null,
      };

      const result = await login(mockCivicToken, mockUserData);

      if (result.success) {
        info('Successfully logged in with Civic Auth!');
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      } else {
        error(result.error || 'Login failed');
      }
    } catch (err) {
      console.error('Web2 login error:', err);
      error('Failed to authenticate with Civic');
    } finally {
      setLoading(false);
    }
  };

  const handleWeb3Login = async () => {
    setLoading(true);

    try {
      // Check if MetaMask or other Web3 wallet is available
      if (!window.ethereum) {
        error('Please install MetaMask or another Web3 wallet');
        return;
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const walletAddress = accounts[0];

      // Simulate Civic Web3 Auth
      // In production, this would integrate with Civic's Web3 SDK
      const mockCivicToken = 'mock-civic-web3-token-' + Date.now();
      const mockUserData = {
        civicId: 'web3-user-' + Date.now(),
        name: 'Web3 User',
        email: 'web3@example.com',
        walletAddress: walletAddress,
      };

      const result = await login(mockCivicToken, mockUserData);

      if (result.success) {
        info('Successfully logged in with Civic Web3 Auth!');
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      } else {
        error(result.error || 'Login failed');
      }
    } catch (err) {
      console.error('Web3 login error:', err);
      if (err.code === 4001) {
        error('User rejected the request');
      } else {
        error('Failed to authenticate with Web3 wallet');
      }
    } finally {
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

          {/* Auth Method Toggle */}
          <div className="flex bg-white/5 rounded-lg p-1 mb-6">
            <button
              onClick={() => setAuthMethod('web2')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                authMethod === 'web2'
                  ? 'bg-primary text-white shadow-lg'
                  : 'text-neutral/70 hover:text-neutral'
              }`}
            >
              <Shield size={16} className="inline mr-2" />
              Civic Web2
            </button>
            <button
              onClick={() => setAuthMethod('web3')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                authMethod === 'web3'
                  ? 'bg-secondary text-white shadow-lg'
                  : 'text-neutral/70 hover:text-neutral'
              }`}
            >
              <Wallet size={16} className="inline mr-2" />
              Civic Web3
            </button>
          </div>

          {/* Auth Form */}
          <div className="space-y-4">
            {authMethod === 'web2' ? (
              <div className="text-center">
                <button
                  onClick={handleWeb2Login}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary to-primary/80 text-white py-4 px-6 rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Connecting...
                    </div>
                  ) : (
                    <>
                      <Shield size={20} className="inline mr-2" />
                      Login with Civic Web2
                    </>
                  )}
                </button>

                <p className="text-xs text-neutral/50 mt-3">
                  Secure authentication with email and social login
                </p>
              </div>
            ) : (
              <div className="text-center">
                <button
                  onClick={handleWeb3Login}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-secondary to-secondary/80 text-white py-4 px-6 rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Connecting...
                    </div>
                  ) : (
                    <>
                      <Wallet size={20} className="inline mr-2" />
                      Connect Web3 Wallet
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

        {/* Demo Notice */}
        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-xs text-yellow-200 text-center">
            <strong>Demo Mode:</strong> This is a demo implementation. In production,
            this would integrate with Civic's actual authentication SDKs.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
