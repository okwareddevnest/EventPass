import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import Modal from './Modal';
import FormField from './FormField';

const PesapalCheckoutForm = ({ event, quantity, onSuccess, onClose }) => {
  const { user } = useAuth();
  const { error: showError, success, info } = useNotification();

  const [loading, setLoading] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState('');
  const [orderTrackingId, setOrderTrackingId] = useState('');
  const [showIframe, setShowIframe] = useState(false);

  const totalAmount = event.price * quantity;

  const handlePesapalPayment = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/pesapal/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          eventId: event._id,
          quantity,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create order');
      }

      const data = await response.json();

      setRedirectUrl(data.redirect_url);
      setOrderTrackingId(data.order_tracking_id);
      setShowIframe(true);

      info('Redirecting to Pesapal payment...');

    } catch (err) {
      console.error('Pesapal order creation error:', err);
      showError(err.message || 'Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-redirect to Pesapal when redirectUrl is available
  if (showIframe && redirectUrl) {
    // Redirect immediately to Pesapal
    window.location.href = redirectUrl;
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <div className="bg-white/5 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-neutral">Order Summary</h3>

        <div className="flex justify-between">
          <span className="text-neutral/80">Event</span>
          <span className="text-neutral font-medium">{event.title}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-neutral/80">Tickets</span>
          <span className="text-neutral font-medium">{quantity} × KES {event.price.toFixed(2)}</span>
        </div>

        <div className="flex justify-between border-t border-white/10 pt-2">
          <span className="text-lg font-semibold text-neutral">Total</span>
          <span className="text-lg font-bold text-secondary">KES {totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Information */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
          <span className="text-blue-300 font-medium">Secure Payment with Pesapal</span>
        </div>
        <p className="text-blue-200 text-sm">
          You'll be redirected to Pesapal's secure payment gateway to complete your transaction.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex space-x-4 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-6 py-3 border border-white/20 text-neutral rounded-lg hover:bg-white/5 transition-all duration-200"
          disabled={loading}
        >
          Cancel
        </button>

        <button
          onClick={handlePesapalPayment}
          disabled={loading}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Processing...
            </div>
          ) : (
            `Pay with Pesapal`
          )}
        </button>
      </div>
    </div>
  );
};

const TicketPurchaseModal = ({ isOpen, onClose, event, onPurchaseSuccess }) => {
  const [quantity, setQuantity] = useState(1);

  const maxQuantity = event?.maxAttendees
    ? Math.min(10, event.maxAttendees - event.currentAttendees)
    : 10;

  const totalAmount = event?.price * quantity || 0;

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value >= 1 && value <= maxQuantity) {
      setQuantity(value);
    }
  };

  const handleSuccess = () => {
    onPurchaseSuccess();
    setQuantity(1);
  };

  const handleClose = () => {
    onClose();
    setQuantity(1);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Purchase Tickets" size="md">
      <div className="space-y-6">
        {/* Event Info */}
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="font-semibold text-neutral mb-2">{event?.title}</h3>
          <p className="text-neutral/70 text-sm mb-3">
            KES {event?.price?.toFixed(2)} per ticket
          </p>
          {event?.maxAttendees && (
            <p className="text-xs text-neutral/50">
              {event.maxAttendees - event.currentAttendees} tickets available
            </p>
          )}
        </div>

        {/* Quantity Selection */}
        <div>
          <label className="block text-sm font-medium text-neutral mb-3">
            Number of Tickets
          </label>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 text-neutral rounded-lg transition-colors duration-200"
            >
              -
            </button>

            <input
              type="number"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={handleQuantityChange}
              className="flex-1 px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-neutral text-center focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />

            <button
              type="button"
              onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 text-neutral rounded-lg transition-colors duration-200"
            >
              +
            </button>
          </div>
        </div>

        {/* Total */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-neutral font-medium">Total Amount</span>
            <span className="text-2xl font-bold text-secondary">
              KES {totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Pesapal Checkout Form */}
        <PesapalCheckoutForm
          event={event}
          quantity={quantity}
          onSuccess={handleSuccess}
          onClose={handleClose}
        />
      </div>
    </Modal>
  );
};

export default TicketPurchaseModal;
