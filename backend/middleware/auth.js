const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        message: 'Access token required',
        error: 'NO_TOKEN'
      });
    }

    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        console.error('JWT verification error:', err.message);
        return res.status(403).json({
          message: 'Invalid or expired token',
          error: err.name // TokenExpiredError or JsonWebTokenError
        });
      }

      try {
        // Check database connection before querying
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState !== 1) {
          return res.status(503).json({
            message: 'Database connection not available',
            error: 'DB_CONNECTION_ERROR'
          });
        }

        // Find user by civicId from decoded token
        const user = await User.findOne({ civicId: decoded.civicId, isActive: true });

        if (!user) {
          return res.status(401).json({
            message: 'User not found or inactive',
            error: 'USER_NOT_FOUND'
          });
        }

        req.user = user;
        next();
      } catch (error) {
        console.error('Error finding user:', error);
        if (error.name === 'MongoNetworkError' || error.name === 'MongoServerError') {
          return res.status(503).json({
            message: 'Database connection error',
            error: 'DB_CONNECTION_ERROR'
          });
        }
        res.status(500).json({ message: 'Internal server error' });
      }
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Check if user is organizer
const isOrganizer = (req, res, next) => {
  if (req.user.role !== 'organizer') {
    return res.status(403).json({ message: 'Access denied. Organizer role required.' });
  }
  next();
};

// Check if user is organization
const isOrganization = (req, res, next) => {
  if (req.user.role !== 'organization') {
    return res.status(403).json({ message: 'Access denied. Organization role required.' });
  }
  next();
};

// Check if user is approved organization
const isApprovedOrganization = (req, res, next) => {
  if (req.user.role !== 'organization' || !req.user.organizationDetails?.isApproved) {
    return res.status(403).json({ message: 'Access denied. Approved organization required.' });
  }
  next();
};

// Check if user is admin (highest level)
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

// Check if user is organizer or admin
const isOrganizerOrAdmin = (req, res, next) => {
  if (req.user.role !== 'organizer' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Organizer or Admin privileges required.' });
  }
  next();
};

// Check if user owns the resource
const isOwner = (req, res, next) => {
  if (req.user._id.toString() !== req.params.userId && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Resource ownership required.' });
  }
  next();
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      civicId: user.civicId,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

module.exports = {
  authenticateToken,
  isOrganizer,
  isOrganization,
  isApprovedOrganization,
  isOwner,
  isAdmin,
  isOrganizerOrAdmin,
  generateToken,
};
