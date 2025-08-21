const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const { authenticateToken, isOrganizer } = require('../middleware/auth');
const pesapalAuth = require('../services/pesapalAuth');
const PaymentIntent = require('../models/PaymentIntent');
const Settings = require('../models/Settings');
const Event = require('../models/Event');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const QRCode = require('qrcode');
const { validateRequest, ipnRegistrationSchema, createOrderSchema, callbackSchema, verificationSchema } = require('../validation/schemas');

// Generate unique merchant reference
function generateMerchantReference() {
  return `EVP-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

// IPN Registration endpoint
router.post('/ipn/register', authenticateToken, isOrganizer, validateRequest(ipnRegistrationSchema), async (req, res) => {
  try {
    const { url, ipn_notification_type } = req.validatedData;

    const endpoints = pesapalAuth.getEndpoints();
    const headers = await pesapalAuth.getAuthHeaders();

    const response = await axios.post(endpoints.registerIPN, {
      url,
      ipn_notification_type
    }, { headers });

    if (response.data.ipn_id) {
      // Store IPN ID in settings
      await Settings.setValue(
        Settings.SYSTEM_KEYS.PESAPAL_IPN_ID,
        response.data.ipn_id,
        'Pesapal IPN notification ID',
        req.user._id
      );

      // Store IPN URL
      await Settings.setValue(
        Settings.SYSTEM_KEYS.PESAPAL_IPN_URL,
        url,
        'Pesapal IPN notification URL',
        req.user._id
      );

      res.json({
        message: 'IPN registered successfully',
        ipn_id: response.data.ipn_id,
        url
      });
    } else {
      throw new Error('Invalid IPN registration response');
    }
  } catch (error) {
    console.error('IPN registration error:', error.response?.data || error.message);
    res.status(500).json({
      message: 'Failed to register IPN',
      error: error.response?.data?.message || error.message
    });
  }
});

// Create Order endpoint
router.post('/orders', authenticateToken, validateRequest(createOrderSchema), async (req, res) => {
  try {
    const { eventId } = req.validatedData;

    // Get event details
    const event = await Event.findById(eventId);
    if (!event || !event.isActive || event.status !== 'published') {
      return res.status(404).json({ message: 'Event not found or not available' });
    }

    // Check capacity
    if (event.maxAttendees && event.currentAttendees >= event.maxAttendees) {
      return res.status(400).json({ message: 'Event is sold out' });
    }

    // Get user details
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get IPN ID from settings
    const ipnId = await Settings.getValue(Settings.SYSTEM_KEYS.PESAPAL_IPN_ID);
    if (!ipnId) {
      return res.status(400).json({
        message: 'IPN not registered. Please contact support.',
        setupRequired: true
      });
    }

    const merchantReference = generateMerchantReference();
    const callbackUrl = process.env.PESAPAL_CALLBACK_URL;
    const endpoints = pesapalAuth.getEndpoints();
    const headers = await pesapalAuth.getAuthHeaders();

    // Prepare order payload
    const orderPayload = {
      id: merchantReference,
      currency: 'KES',
      amount: event.price,
      description: `${event.title} - Ticket Purchase`,
      callback_url: callbackUrl,
      notification_id: ipnId,
      redirect_mode: 'TOP_WINDOW',
      billing_address: {
        email_address: user.email || '',
        phone_number: user.phone || '',
        country_code: 'KE',
        first_name: user.name.split(' ')[0] || '',
        last_name: user.name.split(' ').slice(1).join(' ') || '',
      }
    };

    // Submit order to Pesapal
    const response = await axios.post(endpoints.submitOrder, orderPayload, { headers });

    if (response.data.redirect_url && response.data.order_tracking_id) {
      // Create payment intent record
      const paymentIntent = new PaymentIntent({
        userId: req.user._id,
        eventId: event._id,
        merchantReference,
        orderTrackingId: response.data.order_tracking_id,
        amount: event.price,
        currency: 'KES',
        status: 'PENDING',
        pesapalResponse: response.data,
      });

      await paymentIntent.save();

      res.json({
        redirect_url: response.data.redirect_url,
        order_tracking_id: response.data.order_tracking_id,
        merchant_reference: merchantReference,
        amount: event.price,
        currency: 'KES'
      });
    } else {
      throw new Error('Invalid order response from Pesapal');
    }
  } catch (error) {
    console.error('Order creation error:', error.response?.data || error.message);
    res.status(500).json({
      message: 'Failed to create order',
      error: error.response?.data?.message || error.message
    });
  }
});

// IPN Notification endpoint
router.post('/ipn', async (req, res) => {
  try {
    const notificationData = req.body;

    console.log('IPN notification received:', notificationData);

    // Acknowledge receipt immediately
    const acknowledgement = {
      orderNotificationType: notificationData.OrderNotificationType,
      orderTrackingId: notificationData.OrderTrackingId,
      orderMerchantReference: notificationData.OrderMerchantReference,
      status: 200
    };

    // Send acknowledgement first
    res.json(acknowledgement);

    // Process notification asynchronously
    setImmediate(async () => {
      try {
        await processIPNNotification(notificationData);
      } catch (error) {
        console.error('IPN processing error:', error);
      }
    });
  } catch (error) {
    console.error('IPN handler error:', error);
    res.status(500).json({ message: 'IPN processing failed' });
  }
});

// Payment Callback endpoint
router.post('/callback', authenticateToken, validateRequest(callbackSchema), async (req, res) => {
  try {
    const { OrderTrackingId, OrderMerchantReference } = req.validatedData;

    // Get transaction status from Pesapal
    const endpoints = pesapalAuth.getEndpoints();
    const headers = await pesapalAuth.getAuthHeaders();

    const statusResponse = await axios.get(
      `${endpoints.getTransactionStatus}?orderTrackingId=${OrderTrackingId}`,
      { headers }
    );

    const statusData = statusResponse.data;
    const paymentIntent = await PaymentIntent.findByOrderTrackingId(OrderTrackingId);

    if (!paymentIntent) {
      return res.status(404).json({ message: 'Payment intent not found' });
    }

    // Map Pesapal status codes
    let newStatus;
    switch (statusData.status_code) {
      case 0: // INVALID
        newStatus = 'FAILED';
        await paymentIntent.markAsFailed(statusData.payment_status_description);
        break;
      case 1: // COMPLETED
        newStatus = 'COMPLETED';
        await paymentIntent.markAsCompleted(
          statusData.payment_status_description,
          statusData.confirmation_code
        );

        // Create ticket for completed payment
        await createTicketForPayment(paymentIntent);
        break;
      case 2: // FAILED
        newStatus = 'FAILED';
        await paymentIntent.markAsFailed(statusData.payment_status_description);
        break;
      case 3: // REVERSED
        newStatus = 'REVERSED';
        await paymentIntent.markAsReversed(statusData.payment_status_description);
        break;
      default:
        newStatus = 'FAILED';
        await paymentIntent.markAsFailed('Unknown status');
    }

    res.json({
      message: `Payment ${newStatus.toLowerCase()}`,
      status: newStatus,
      orderTrackingId: OrderTrackingId,
      merchantReference: OrderMerchantReference,
      paymentStatusDescription: statusData.payment_status_description,
      confirmationCode: statusData.confirmation_code
    });
  } catch (error) {
    console.error('Callback processing error:', error);
    res.status(500).json({
      message: 'Callback processing failed',
      error: error.response?.data?.message || error.message
    });
  }
});

// Payment Verification endpoint
router.get('/verify', validateRequest(verificationSchema), async (req, res) => {
  try {
    const { orderTrackingId } = req.query;

    // Get transaction status from Pesapal
    const endpoints = pesapalAuth.getEndpoints();
    const headers = await pesapalAuth.getAuthHeaders();

    const statusResponse = await axios.get(
      `${endpoints.getTransactionStatus}?orderTrackingId=${orderTrackingId}`,
      { headers }
    );

    const statusData = statusResponse.data;
    const paymentIntent = await PaymentIntent.findByOrderTrackingId(orderTrackingId);

    if (!paymentIntent) {
      return res.status(404).json({
        valid: false,
        message: 'Payment not found'
      });
    }

    // Check if ticket exists and is valid
    const ticket = await Ticket.findOne({
      orderTrackingId,
      userId: paymentIntent.userId,
      eventId: paymentIntent.eventId
    });

    const isValid = statusData.status_code === 1 && ticket && ticket.status === 'valid';

    res.json({
      valid: isValid,
      payment_status_description: statusData.payment_status_description,
      confirmation_code: statusData.confirmation_code,
      ticket_status: ticket?.status || 'not_found',
      payment_status: statusData.status_code === 1 ? 'COMPLETED' : 'FAILED'
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      message: 'Verification failed',
      error: error.response?.data?.message || error.message
    });
  }
});

// Helper function to process IPN notifications
async function processIPNNotification(notificationData) {
  try {
    const { OrderTrackingId, OrderNotificationType } = notificationData;

    const paymentIntent = await PaymentIntent.findByOrderTrackingId(OrderTrackingId);
    if (!paymentIntent) {
      throw new Error(`Payment intent not found for OrderTrackingId: ${OrderTrackingId}`);
    }

    // Add IPN notification record
    await paymentIntent.addIPNNotification(OrderNotificationType, notificationData);

    // If this is a status change notification, fetch current status
    if (OrderNotificationType === 'IPNCHANGE') {
      const endpoints = pesapalAuth.getEndpoints();
      const headers = await pesapalAuth.getAuthHeaders();

      const statusResponse = await axios.get(
        `${endpoints.getTransactionStatus}?orderTrackingId=${OrderTrackingId}`,
        { headers }
      );

      const statusData = statusResponse.data;

      // Update payment intent based on status
      switch (statusData.status_code) {
        case 1: // COMPLETED
          if (paymentIntent.status !== 'COMPLETED') {
            await paymentIntent.markAsCompleted(
              statusData.payment_status_description,
              statusData.confirmation_code
            );
            await createTicketForPayment(paymentIntent);
          }
          break;
        case 2: // FAILED
          if (paymentIntent.status !== 'FAILED') {
            await paymentIntent.markAsFailed(statusData.payment_status_description);
          }
          break;
        case 3: // REVERSED
          if (paymentIntent.status !== 'REVERSED') {
            await paymentIntent.markAsReversed(statusData.payment_status_description);
          }
          break;
      }
    }
  } catch (error) {
    console.error('IPN notification processing error:', error);
    throw error;
  }
}

// Helper function to create ticket for completed payment
async function createTicketForPayment(paymentIntent) {
  try {
    // Check if ticket already exists
    const existingTicket = await Ticket.findOne({
      userId: paymentIntent.userId,
      eventId: paymentIntent.eventId,
      orderTrackingId: paymentIntent.orderTrackingId
    });

    if (existingTicket) {
      console.log('Ticket already exists for payment:', paymentIntent.orderTrackingId);
      return existingTicket;
    }

    // Create QR code
    const qrData = JSON.stringify({
      ticketId: `TKT-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      userId: paymentIntent.userId.toString(),
      eventId: paymentIntent.eventId.toString(),
      orderTrackingId: paymentIntent.orderTrackingId,
      purchaseDate: new Date(),
    });

    const qrCodeUrl = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#1D4ED8', // Primary blue
        light: '#FFFFFF',
      },
    });

    // Create ticket
    const ticket = new Ticket({
      userId: paymentIntent.userId,
      eventId: paymentIntent.eventId,
      ticketId: `TKT-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      qrCodeUrl,
      status: 'valid',
      price: paymentIntent.amount,
      paymentIntentId: paymentIntent._id.toString(),
      orderTrackingId: paymentIntent.orderTrackingId,
      purchasedAt: new Date(),
    });

    await ticket.save();

    // Update event attendee count
    await Event.findByIdAndUpdate(paymentIntent.eventId, {
      $inc: { currentAttendees: 1 }
    });

    console.log('Ticket created for payment:', paymentIntent.orderTrackingId);
    return ticket;
  } catch (error) {
    console.error('Error creating ticket for payment:', error);
    throw error;
  }
}

module.exports = router;
