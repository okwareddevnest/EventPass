import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { success, error: showError } = useNotification();
  
  const [status, setStatus] = useState('processing'); // processing, success, failed
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      // Get the authorization code from URL params
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        setStatus('failed');
        setErrorMessage('Authentication was cancelled or failed');
        return;
      }

      if (!code) {
        setStatus('failed');
        setErrorMessage('No authorization code received');
        return;
      }

      // Exchange the authorization code for tokens
      const response = await fetch('/api/auth/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          state,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Login with the received user data
        const result = await login(data.token, {
          civicId: data.user.civicId,
          name: data.user.name,
          email: data.user.email,
          walletAddress: data.user.walletAddress,
        });

        if (result.success) {
          setStatus('success');
          success('Successfully authenticated with Civic!');
          
          // Redirect to dashboard or intended page
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 2000);
        } else {
          setStatus('failed');
          setErrorMessage(result.error || 'Failed to complete authentication');
        }
      } else {
        const errorData = await response.json();
        setStatus('failed');
        setErrorMessage(errorData.message || 'Authentication callback failed');
      }
    } catch (err) {
      console.error('Auth callback error:', err);
      setStatus('failed');
      setErrorMessage('Network error during authentication');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {status === 'processing' && (
          <>
            <Loader2 className="animate-spin text-primary w-16 h-16 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-neutral mb-3">Completing Authentication...</h2>
            <p className="text-neutral/70">Please wait while we complete your Civic Auth login.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="text-secondary w-16 h-16 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-neutral mb-3">Authentication Successful!</h2>
            <p className="text-neutral/70 mb-4">You have been successfully authenticated with Civic Auth.</p>
            <p className="text-sm text-neutral/50">Redirecting to dashboard...</p>
          </>
        )}

        {status === 'failed' && (
          <>
            <XCircle className="text-red-500 w-16 h-16 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-neutral mb-3">Authentication Failed</h2>
            <p className="text-neutral/70 mb-4">{errorMessage}</p>
            <button
              onClick={() => navigate('/auth')}
              className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg transition-colors duration-200 font-semibold"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
