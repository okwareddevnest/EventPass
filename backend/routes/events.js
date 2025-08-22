const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Event = require('../models/Event');
const { authenticateToken, isOrganizer } = require('../middleware/auth');

// Database connection check middleware
const checkDBConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ 
      message: 'Database connection not available',
      error: 'Please check MongoDB connection and environment variables'
    });
  }
  next();
};

// Get all events (public)
router.get('/', checkDBConnection, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, date, price, search } = req.query;

    let query = { status: 'published', isActive: true };

    // Add filters
    if (category) {
      query.tags = { $in: [category.toLowerCase()] };
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }

    if (price) {
      const priceRange = price.split('-');
      if (priceRange.length === 2) {
        query.price = {
          $gte: parseFloat(priceRange[0]),
          $lte: parseFloat(priceRange[1])
        };
      }
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const events = await Event.find(query)
      .populate('organizerId', 'name email')
      .sort({ date: 1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Event.countDocuments(query);

    res.json({
      events,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalEvents: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single event (public)
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizerId', 'name email civicId');

    if (!event || !event.isActive) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ event });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new event (organizer only)
router.post('/', authenticateToken, isOrganizer, async (req, res) => {
  try {
    const { title, description, date, location, price, maxAttendees, tags, image } = req.body;

    // Validate required fields
    if (!title || !description || !date || !location || price === undefined) {
      return res.status(400).json({
        message: 'Missing required fields: title, description, date, location, price'
      });
    }

    // Validate date
    const eventDate = new Date(date);
    if (eventDate <= new Date()) {
      return res.status(400).json({ message: 'Event date must be in the future' });
    }

    // Validate price
    if (price < 0) {
      return res.status(400).json({ message: 'Price cannot be negative' });
    }

    const event = new Event({
      organizerId: req.user._id,
      title: title.trim(),
      description: description.trim(),
      date: eventDate,
      location: location.trim(),
      price: parseFloat(price),
      maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
      tags: tags ? tags.map(tag => tag.toLowerCase().trim()) : [],
      image,
    });

    await event.save();

    res.status(201).json({
      message: 'Event created successfully',
      event,
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update event (organizer only)
router.put('/:id', authenticateToken, isOrganizer, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is the organizer
    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this event' });
    }

    const allowedUpdates = ['title', 'description', 'date', 'location', 'price', 'maxAttendees', 'tags', 'image', 'status'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'date') {
          const eventDate = new Date(req.body[field]);
          if (eventDate <= new Date()) {
            throw new Error('Event date must be in the future');
          }
          updates[field] = eventDate;
        } else if (field === 'price') {
          const price = parseFloat(req.body[field]);
          if (price < 0) {
            throw new Error('Price cannot be negative');
          }
          updates[field] = price;
        } else if (field === 'maxAttendees') {
          updates[field] = req.body[field] ? parseInt(req.body[field]) : null;
        } else if (field === 'tags') {
          updates[field] = req.body[field].map(tag => tag.toLowerCase().trim());
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Event updated successfully',
      event: updatedEvent,
    });
  } catch (error) {
    console.error('Update event error:', error);

    if (error.message.includes('future') || error.message.includes('negative')) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete event (organizer only)
router.delete('/:id', authenticateToken, isOrganizer, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is the organizer
    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get organizer's events (organizer only)
router.get('/organizer/events', authenticateToken, isOrganizer, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    let query = { organizerId: req.user._id, isActive: true };

    if (status) {
      query.status = status;
    }

    const events = await Event.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Event.countDocuments(query);

    res.json({
      events,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalEvents: total,
      },
    });
  } catch (error) {
    console.error('Get organizer events error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
