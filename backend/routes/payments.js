const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');

// Webhook endpoint for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

// Handle successful payment
async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);

  try {
    const { eventId, userId, quantity } = paymentIntent.metadata;

    // Check if tickets were already created
    const existingTickets = await Ticket.find({ paymentIntentId: paymentIntent.id });
    if (existingTickets.length > 0) {
      console.log('Tickets already created for payment:', paymentIntent.id);
      return;
    }

    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    // Create tickets
    const tickets = [];
    for (let i = 0; i < parseInt(quantity); i++) {
      const ticket = new Ticket({
        userId: userId,
        eventId: eventId,
        price: event.price,
        paymentIntentId: paymentIntent.id,
      });
      tickets.push(ticket);
    }

    await Ticket.insertMany(tickets);

    // Update event attendee count
    await Event.findByIdAndUpdate(eventId, {
      $inc: { currentAttendees: parseInt(quantity) }
    });

    console.log(`Created ${quantity} tickets for event: ${event.title}`);
  } catch (error) {
    console.error('Error processing successful payment:', error);
    throw error;
  }
}

// Handle failed payment
async function handlePaymentIntentFailed(paymentIntent) {
  console.log('Payment failed:', paymentIntent.id);

  try {
    // Log failed payment for manual review
    console.log('Failed payment details:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      metadata: paymentIntent.metadata,
      lastError: paymentIntent.last_payment_error,
    });

    // TODO: Send notification to user about failed payment
    // TODO: Clean up any partial data if needed

  } catch (error) {
    console.error('Error processing failed payment:', error);
    throw error;
  }
}

// Handle refund
async function handleChargeRefunded(charge) {
  console.log('Charge refunded:', charge.id);

  try {
    const paymentIntentId = charge.payment_intent;

    // Find tickets associated with this payment
    const tickets = await Ticket.find({ paymentIntentId });

    if (tickets.length === 0) {
      console.log('No tickets found for refunded payment:', paymentIntentId);
      return;
    }

    // Update tickets to refunded status
    await Ticket.updateMany(
      { paymentIntentId },
      { status: 'refunded' }
    );

    // Update event attendee count
    const eventId = tickets[0].eventId;
    await Event.findByIdAndUpdate(eventId, {
      $inc: { currentAttendees: -tickets.length }
    });

    console.log(`Refunded ${tickets.length} tickets for payment: ${paymentIntentId}`);
  } catch (error) {
    console.error('Error processing refund:', error);
    throw error;
  }
}

// Get payment methods for user
router.get('/payment-methods', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    const user = await require('../models/User').findOne({ civicId: decoded.civicId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get customer's payment methods from Stripe
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let paymentMethods = [];
    if (customers.data.length > 0) {
      const customer = customers.data[0];
      paymentMethods = await stripe.paymentMethods.list({
        customer: customer.id,
        type: 'card',
      });
    }

    res.json({
      paymentMethods: paymentMethods.data,
      hasPaymentMethods: paymentMethods.data.length > 0,
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create payment intent for saved card
router.post('/create-payment-intent-saved', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    const user = await require('../models/User').findOne({ civicId: decoded.civicId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { eventId, quantity = 1, paymentMethodId } = req.body;

    if (!eventId || !paymentMethodId) {
      return res.status(400).json({
        message: 'Event ID and payment method ID are required'
      });
    }

    const event = await Event.findById(eventId);
    if (!event || !event.isActive || event.status !== 'published') {
      return res.status(404).json({ message: 'Event not found or not available' });
    }

    const amount = Math.round(event.price * 100);
    const totalAmount = amount * quantity;

    // Find or create customer
    let customer;
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
      });
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id,
    });

    // Update customer's default payment method
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'usd',
      customer: customer.id,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      metadata: {
        eventId: eventId,
        userId: user._id.toString(),
        quantity: quantity.toString(),
      },
    });

    res.json({
      success: true,
      message: 'Payment processed successfully',
      amount: totalAmount,
    });
  } catch (error) {
    console.error('Create payment intent with saved card error:', error);

    if (error.type === 'StripeCardError') {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
