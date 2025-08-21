import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { QrCode, CheckCircle, XCircle, Camera, Search, RefreshCw } from 'lucide-react';

const CheckIn = () => {
  const { user } = useAuth();
  const { success, error, info } = useNotification();

  const [orderTrackingId, setOrderTrackingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Check if user is an organizer
  if (user?.role !== 'organizer') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-neutral mb-4">Access Denied</h2>
        <p className="text-neutral/70 mb-6">You need organizer privileges to access the check-in system.</p>
        <a
          href="/"
          className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-200"
        >
          Back to Home
        </a>
      </div>
    );
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
        info('Camera started. Point at QR code to scan.');
      }
    } catch (err) {
      console.error('Camera access error:', err);
      error('Camera access denied. Please allow camera permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const captureQR = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // In a real implementation, you would use a QR code scanning library
    // For now, we'll simulate QR code detection
    info('QR code scanning feature would process the captured image here.');
  };

  const verifyTicket = async (trackingId) => {
    if (!trackingId.trim()) {
      error('Please enter an Order Tracking ID');
      return;
    }

    setLoading(true);
    setVerificationResult(null);

    try {
      const response = await fetch(`/api/pesapal/verify?orderTrackingId=${encodeURIComponent(trackingId)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        setVerificationResult(result);

        if (result.valid) {
          success('Ticket verified successfully!');
        } else {
          error(`Invalid ticket: ${result.payment_status_description}`);
        }
      } else {
        error(result.message || 'Failed to verify ticket');
        setVerificationResult({ valid: false, message: result.message });
      }
    } catch (err) {
      console.error('Verification error:', err);
      error('Failed to verify ticket. Please try again.');
      setVerificationResult({ valid: false, message: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  const handleManualVerify = () => {
    verifyTicket(orderTrackingId);
  };

  const resetVerification = () => {
    setOrderTrackingId('');
    setVerificationResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-neutral mb-2">Event Check-In</h1>
        <p className="text-neutral/70">Verify tickets at your event entrance</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Manual Entry Section */}
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-neutral mb-4">Manual Entry</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral/70 mb-2">
                  Order Tracking ID
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={orderTrackingId}
                    onChange={(e) => setOrderTrackingId(e.target.value)}
                    placeholder="Enter tracking ID (e.g., TKT-123456)"
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-neutral focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                  <button
                    onClick={handleManualVerify}
                    disabled={loading}
                    className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Search size={20} />
                  </button>
                </div>
              </div>

              <button
                onClick={resetVerification}
                className="w-full px-4 py-2 border border-white/20 text-neutral/70 rounded-lg hover:bg-white/5 transition-colors duration-200"
              >
                <RefreshCw size={16} className="inline mr-2" />
                Reset
              </button>
            </div>
          </div>

          {/* Camera Section */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-neutral mb-4">QR Code Scanner</h2>

            <div className="space-y-4">
              {!cameraActive ? (
                <button
                  onClick={startCamera}
                  className="w-full px-6 py-3 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors duration-200 flex items-center justify-center"
                >
                  <Camera size={20} className="mr-2" />
                  Start Camera
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      className="w-full h-64 object-cover"
                      playsInline
                      muted
                    />
                    <canvas
                      ref={canvasRef}
                      className="hidden"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={captureQR}
                      className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200"
                    >
                      <QrCode size={16} className="inline mr-2" />
                      Scan QR Code
                    </button>
                    <button
                      onClick={stopCamera}
                      className="flex-1 px-4 py-2 border border-white/20 text-neutral rounded-lg hover:bg-white/5 transition-colors duration-200"
                    >
                      <XCircle size={16} className="inline mr-2" />
                      Stop Camera
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-neutral mb-4">Verification Result</h2>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-neutral/70">Verifying ticket...</p>
              </div>
            ) : verificationResult ? (
              <div className="space-y-4">
                <div className={`flex items-center space-x-3 p-4 rounded-lg ${
                  verificationResult.valid
                    ? 'bg-green-500/10 border border-green-500/20'
                    : 'bg-red-500/10 border border-red-500/20'
                }`}>
                  {verificationResult.valid ? (
                    <CheckCircle size={24} className="text-green-400" />
                  ) : (
                    <XCircle size={24} className="text-red-400" />
                  )}
                  <div>
                    <p className={`font-semibold ${
                      verificationResult.valid ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {verificationResult.valid ? 'Valid Ticket' : 'Invalid Ticket'}
                    </p>
                    <p className="text-sm text-neutral/70">
                      {verificationResult.payment_status_description || verificationResult.message}
                    </p>
                  </div>
                </div>

                {verificationResult.valid && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-300 mb-2">Ticket Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral/70">Tracking ID:</span>
                        <span className="text-neutral font-mono">
                          {verificationResult.confirmation_code || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral/70">Status:</span>
                        <span className="text-green-400">{verificationResult.payment_status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral/70">Ticket Status:</span>
                        <span className={`capitalize ${
                          verificationResult.ticket_status === 'valid' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {verificationResult.ticket_status}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <QrCode size={48} className="text-neutral/30 mx-auto mb-4" />
                <p className="text-neutral/70">
                  Enter a tracking ID or scan a QR code to verify a ticket
                </p>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-neutral mb-4">How to Use</h3>
            <ul className="space-y-2 text-sm text-neutral/70">
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span>Enter the Order Tracking ID manually or scan the QR code</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-secondary rounded-full mt-2 flex-shrink-0"></div>
                <span>The system will verify payment status with Pesapal</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                <span>Green checkmark indicates valid, paid ticket</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                <span>Red X indicates invalid or unpaid ticket</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckIn;
