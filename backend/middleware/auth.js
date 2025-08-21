const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
      }

      try {
        // Find user by civicId from decoded token
        const user = await User.findOne({ civicId: decoded.civicId, isActive: true });

        if (!user) {
          return res.status(401).json({ message: 'User not found or inactive' });
        }

        req.user = user;
        next();
      } catch (error) {
        console.error('Error finding user:', error);
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
  isOwner,
  generateToken,
};
