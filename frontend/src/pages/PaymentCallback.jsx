import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import QRCodeModal from '../components/QRCodeModal';

const PaymentCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { error: showError, success, info } = useNotification();

  const [status, setStatus] = useState('processing'); // 'processing', 'success', 'failed'
  const [paymentData, setPaymentData] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [event, setEvent] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    handlePaymentCallback();
  }, [searchParams]);

  const handlePaymentCallback = async () => {
    try {
      const orderTrackingId = searchParams.get('OrderTrackingId');
      const orderMerchantReference = searchParams.get('OrderMerchantReference');
      const orderNotificationType = searchParams.get('OrderNotificationType');

      if (!orderTrackingId || !orderMerchantReference) {
        setStatus('failed');
        showError('Missing payment information from Pesapal');
        return;
      }

      // Verify payment status with Pesapal through our backend
      const response = await fetch('/api/pesapal/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          OrderTrackingId: orderTrackingId,
          OrderMerchantReference: orderMerchantReference,
          OrderNotificationType: orderNotificationType,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setPaymentData(result);

        if (result.status === 'COMPLETED') {
          setStatus('success');
          success('Payment completed successfully! Your ticket has been generated.');

          // Fetch ticket information
          await fetchTicket(orderTrackingId);
        } else {
          setStatus('failed');
          showError(`Payment ${result.status.toLowerCase()}: ${result.paymentStatusDescription}`);
        }
      } else {
        setStatus('failed');
        const errorData = await response.json();
        showError(errorData.message || 'Payment verification failed');
      }
    } catch (err) {
      console.error('Payment callback error:', err);
      setStatus('failed');
      showError('Failed to verify payment with Pesapal');
    }
  };

  const fetchTicket = async (orderTrackingId) => {
    try {
      // Find the ticket by orderTrackingId
      const response = await fetch('/api/tickets/my-tickets', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const foundTicket = data.tickets.find(ticket => ticket.orderTrackingId === orderTrackingId);

        if (foundTicket) {
          setTicket(foundTicket);

          // Fetch event details
          const eventResponse = await fetch(`/api/events/${foundTicket.eventId._id}`);
          if (eventResponse.ok) {
            const eventData = await eventResponse.json();
            setEvent(eventData.event);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching ticket:', err);
    }
  };

  const handleViewTicket = () => {
    if (ticket && event) {
      setShowQRModal(true);
    }
  };

  const handleBack = () => {
    navigate('/events');
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle size={64} className="text-green-400" />;
      case 'failed':
        return <XCircle size={64} className="text-red-400" />;
      default:
        return <AlertCircle size={64} className="text-blue-400" />;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'success':
        return 'Payment Successful!';
      case 'failed':
        return 'Payment Failed';
      default:
        return 'Processing Payment...';
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'success':
        return 'Your payment has been processed successfully. Your ticket is ready!';
      case 'failed':
        return paymentData?.paymentStatusDescription || 'There was an issue processing your payment. Please try again.';
      default:
        return 'Please wait while we process your payment...';
    }
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
          <span>Back to Events</span>
        </button>

        {/* Status Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
          <div className="flex justify-center mb-6">
            {getStatusIcon()}
          </div>

          <h1 className="text-2xl font-bold text-neutral mb-4">
            {getStatusTitle()}
          </h1>

          <p className="text-neutral/70 mb-6">
            {getStatusMessage()}
          </p>

          {status === 'success' && paymentData && (
            <div className="bg-white/5 rounded-lg p-4 mb-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral/70">Amount Paid:</span>
                  <span className="text-neutral font-medium">
                    KES {paymentData.amount?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral/70">Tracking ID:</span>
                  <span className="text-neutral font-mono text-xs">
                    {paymentData.orderTrackingId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral/70">Reference:</span>
                  <span className="text-neutral font-mono text-xs">
                    {paymentData.merchantReference}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {status === 'success' && ticket && (
              <button
                onClick={handleViewTicket}
                className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 px-6 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                View Your Ticket
              </button>
            )}

            <button
              onClick={handleBack}
              className={`w-full py-3 px-6 rounded-lg transition-all duration-200 ${
                status === 'success'
                  ? 'border border-white/20 text-neutral hover:bg-white/5'
                  : 'bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg hover:scale-105'
              }`}
            >
              {status === 'success' ? 'Browse More Events' : 'Back to Events'}
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-neutral/50">
              Need help? Contact our support team if you have any questions about your payment.
            </p>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && ticket && event && (
        <QRCodeModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          ticket={ticket}
          event={event}
        />
      )}
    </div>
  );
};

export default PaymentCallback;
