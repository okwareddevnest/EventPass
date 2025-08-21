const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

// Civic Auth verification endpoint
router.post('/verify', async (req, res) => {
  try {
    const { token, civicId, name, email, walletAddress } = req.body;

    // Validate required fields
    if (!token || !civicId || !name || !email) {
      return res.status(400).json({
        message: 'Missing required fields: token, civicId, name, email'
      });
    }

    // In production, you would verify the Civic Auth token here
    // For now, we'll trust the token and create/update user

    let user = await User.findOne({ civicId });

    if (user) {
      // Update existing user
      user.name = name;
      user.email = email;
      if (walletAddress) user.walletAddress = walletAddress;
      user.isActive = true;
      await user.save();
    } else {
      // Create new user
      user = new User({
        civicId,
        name,
        email,
        walletAddress: walletAddress || null,
        role: 'attendee', // Default role, can be upgraded later
      });
      await user.save();
    }

    // Generate JWT token
    const jwtToken = generateToken(user);

    res.status(200).json({
      message: 'Authentication successful',
      token: jwtToken,
      user: {
        id: user._id,
        civicId: user.civicId,
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
      },
    });
  } catch (error) {
    console.error('Auth verification error:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'User with this email already exists'
      });
    }

    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get current user profile
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ civicId: decoded.civicId, isActive: true });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        civicId: user.civicId,
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ civicId: decoded.civicId, isActive: true });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, email, walletAddress } = req.body;

    if (name) user.name = name;
    if (email) user.email = email;
    if (walletAddress !== undefined) user.walletAddress = walletAddress;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        civicId: user.civicId,
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);

    if (error.code === 11000) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
