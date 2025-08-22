const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Apply authentication and admin middleware to all routes
router.use(authenticateToken);
router.use(isAdmin);

// Get all users (admin only)
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search, status } = req.query;

    let query = {};

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Filter by status
    if (status) {
      query.isActive = status === 'active';
    }

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-__v')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    // Get user stats
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      stats: userStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single user details
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-__v');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's events (if organizer)
    let userEvents = [];
    if (user.role === 'organizer') {
      userEvents = await Event.find({ organizerId: user._id })
        .select('title status date currentAttendees')
        .sort({ createdAt: -1 })
        .limit(10);
    }

    // Get user's tickets (if attendee)
    let userTickets = [];
    if (user.role === 'attendee') {
      userTickets = await Ticket.find({ userId: user._id })
        .populate('eventId', 'title date')
        .select('ticketId status price purchaseDate')
        .sort({ purchaseDate: -1 })
        .limit(10);
    }

    res.json({
      user,
      events: userEvents,
      tickets: userTickets,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user role
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;

    if (!['attendee', 'organizer', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    // Prevent admin from demoting themselves
    if (req.params.id === req.user._id.toString() && role !== 'admin') {
      return res.status(400).json({ message: 'Cannot change your own admin role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User role updated successfully',
      user,
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Toggle user active status
router.put('/users/:id/status', async (req, res) => {
  try {
    const { isActive } = req.body;

    // Prevent admin from deactivating themselves
    if (req.params.id === req.user._id.toString() && !isActive) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user,
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If user is organizer, check if they have events
    if (user.role === 'organizer') {
      const userEvents = await Event.countDocuments({ organizerId: user._id });
      if (userEvents > 0) {
        return res.status(400).json({
          message: 'Cannot delete organizer with existing events. Transfer ownership first.'
        });
      }
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get system statistics
router.get('/stats', async (req, res) => {
  try {
    // User statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Event statistics
    const eventStats = await Event.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Ticket statistics
    const ticketStats = await Ticket.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Revenue statistics
    const revenueStats = await Ticket.aggregate([
      {
        $match: { status: 'valid' }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$price' },
          totalTickets: { $sum: 1 }
        }
      }
    ]);

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUsers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const recentEvents = await Event.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const recentTickets = await Ticket.countDocuments({ purchaseDate: { $gte: thirtyDaysAgo } });

    res.json({
      users: userStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      events: eventStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      tickets: ticketStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      revenue: revenueStats[0] || { totalRevenue: 0, totalTickets: 0 },
      recentActivity: {
        users: recentUsers,
        events: recentEvents,
        tickets: recentTickets,
        period: '30 days'
      },
      systemInfo: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version,
        platform: process.platform,
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get system logs (simplified version)
router.get('/logs', async (req, res) => {
  try {
    // In a real application, you would read from actual log files
    // For now, return a placeholder
    const logs = [
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'System monitoring active',
        source: 'admin-dashboard'
      },
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Admin logged in',
        source: 'auth',
        user: req.user.email
      }
    ];

    res.json({
      logs,
      message: 'Log functionality would be implemented with actual log files'
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create organizer/admin account
router.post('/create-user', async (req, res) => {
  try {
    const { name, email, role, phone, walletAddress } = req.body;

    // Validate required fields
    if (!name || !email || !role) {
      return res.status(400).json({
        message: 'Name, email, and role are required'
      });
    }

    // Validate role
    if (!['organizer', 'admin'].includes(role)) {
      return res.status(400).json({
        message: 'Role must be either organizer or admin'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        message: 'User with this email already exists'
      });
    }

    // Generate a temporary civicId for admin-created users
    const tempCivicId = `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newUser = new User({
      civicId: tempCivicId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : '',
      role,
      walletAddress: walletAddress || null,
      isActive: true,
    });

    await newUser.save();

    res.status(201).json({
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully`,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt,
      },
      note: 'User will need to authenticate through Civic Auth to access the system'
    });
  } catch (error) {
    console.error('Create user error:', error);

    if (error.code === 11000) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
