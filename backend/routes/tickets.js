const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const { authenticateToken } = require('../middleware/auth');

// Get user's tickets
router.get('/my-tickets', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    let query = { userId: req.user._id, isActive: true };

    if (status) {
      query.status = status;
    }

    const tickets = await Ticket.find(query)
      .populate('eventId', 'title date location organizerId')
      .sort({ purchaseDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Ticket.countDocuments(query);

    res.json({
      tickets,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalTickets: total,
      },
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Validate event for ticket purchase (for Pesapal integration)
router.post('/validate-purchase', authenticateToken, async (req, res) => {
  try {
    const { eventId, quantity = 1 } = req.body;

    if (!eventId || quantity < 1) {
      return res.status(400).json({
        message: 'Event ID and valid quantity are required'
      });
    }

    const event = await Event.findById(eventId);
    if (!event || !event.isActive || event.status !== 'published') {
      return res.status(404).json({ message: 'Event not found or not available' });
    }

    // Check capacity
    if (event.maxAttendees && event.currentAttendees + quantity > event.maxAttendees) {
      return res.status(400).json({
        message: 'Not enough tickets available',
        available: event.maxAttendees - event.currentAttendees
      });
    }

    const totalAmount = event.price * quantity;

    res.json({
      isValid: true,
      event: {
        title: event.title,
        price: event.price,
        quantity,
        total: totalAmount,
      },
    });
  } catch (error) {
    console.error('Validate purchase error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create tickets after successful Pesapal payment
router.post('/create-from-pesapal', authenticateToken, async (req, res) => {
  try {
    const { orderTrackingId, eventId, quantity = 1 } = req.body;

    if (!orderTrackingId || !eventId) {
      return res.status(400).json({
        message: 'Order tracking ID and event ID are required'
      });
    }

    // Check if tickets were already created for this order
    const existingTickets = await Ticket.find({ orderTrackingId });
    if (existingTickets.length > 0) {
      return res.status(409).json({ message: 'Tickets already created for this order' });
    }

    const event = await Event.findById(eventId);
    if (!event || !event.isActive || event.status !== 'published') {
      return res.status(404).json({ message: 'Event not found or not available' });
    }

    // Create tickets
    const tickets = [];
    for (let i = 0; i < quantity; i++) {
      const ticket = new Ticket({
        userId: req.user._id,
        eventId: eventId,
        price: event.price,
        orderTrackingId: orderTrackingId,
        paymentIntentId: orderTrackingId, // Use order tracking ID as payment intent ID for compatibility
      });
      tickets.push(ticket);
    }

    await Ticket.insertMany(tickets);

    // Update event attendee count
    await Event.findByIdAndUpdate(eventId, {
      $inc: { currentAttendees: quantity }
    });

    res.status(201).json({
      message: 'Tickets created successfully',
      tickets: tickets.map(ticket => ({
        ticketId: ticket.ticketId,
        qrCodeUrl: ticket.qrCodeUrl,
        event: {
          title: event.title,
          date: event.date,
          location: event.location,
        },
      })),
    });
  } catch (error) {
    console.error('Create tickets from Pesapal error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Verify ticket (public endpoint for event organizers)
router.post('/verify', async (req, res) => {
  try {
    const { ticketId } = req.body;

    if (!ticketId) {
      return res.status(400).json({ message: 'Ticket ID is required' });
    }

    const ticket = await Ticket.findByTicketId(ticketId)
      .populate('userId', 'name email')
      .populate('eventId', 'title date location organizerId');

    if (!ticket) {
      return res.status(404).json({
        valid: false,
        message: 'Ticket not found'
      });
    }

    if (!ticket.validate()) {
      return res.status(400).json({
        valid: false,
        message: `Ticket is ${ticket.status}`,
        ticket: {
          status: ticket.status,
          eventTitle: ticket.eventId.title,
          userName: ticket.userId.name,
          purchaseDate: ticket.purchaseDate,
        }
      });
    }

    // Mark ticket as used
    await ticket.markAsUsed();

    res.json({
      valid: true,
      message: 'Ticket is valid',
      ticket: {
        ticketId: ticket.ticketId,
        status: 'used',
        userName: ticket.userId.name,
        userEmail: ticket.userId.email,
        eventTitle: ticket.eventId.title,
        eventDate: ticket.eventId.date,
        eventLocation: ticket.eventId.location,
        purchaseDate: ticket.purchaseDate,
        usedDate: ticket.usedDate,
      }
    });
  } catch (error) {
    console.error('Verify ticket error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get ticket details by ticket ID (authenticated users only)
router.get('/:ticketId', authenticateToken, async (req, res) => {
  try {
    const ticket = await Ticket.findByTicketId(req.params.ticketId)
      .populate('userId', 'name email')
      .populate('eventId', 'title date location organizerId');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check if user owns the ticket or is the event organizer
    const isOwner = ticket.userId._id.toString() === req.user._id.toString();
    const isOrganizer = ticket.eventId.organizerId.toString() === req.user._id.toString();

    if (!isOwner && !isOrganizer) {
      return res.status(403).json({ message: 'Not authorized to view this ticket' });
    }

    res.json({ ticket });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Cancel ticket (user only)
router.put('/:ticketId/cancel', authenticateToken, async (req, res) => {
  try {
    const ticket = await Ticket.findByTicketId(req.params.ticketId);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check if user owns the ticket
    if (ticket.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this ticket' });
    }

    // Check if ticket can be cancelled
    if (ticket.status !== 'valid') {
      return res.status(400).json({
        message: `Cannot cancel ticket with status: ${ticket.status}`
      });
    }

    ticket.status = 'cancelled';
    await ticket.save();

    // Update event attendee count
    await Event.findByIdAndUpdate(ticket.eventId, {
      $inc: { currentAttendees: -1 }
    });

    // TODO: Process refund through Pesapal

    res.json({
      message: 'Ticket cancelled successfully',
      ticket
    });
  } catch (error) {
    console.error('Cancel ticket error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
