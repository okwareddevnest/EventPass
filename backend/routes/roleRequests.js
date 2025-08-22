const express = require('express');
const router = express.Router();
const User = require('../models/User');
const RoleRequest = require('../models/RoleRequest');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Get current user's role requests
router.get('/my-requests', async (req, res) => {
  try {
    const roleRequests = await RoleRequest.find({ userId: req.user._id })
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ roleRequests });
  } catch (error) {
    console.error('Get my role requests error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Submit a new role request
router.post('/', async (req, res) => {
  try {
    const { requestedRole, reason } = req.body;

    // Validate required fields
    if (!requestedRole || !reason) {
      return res.status(400).json({
        message: 'Requested role and reason are required'
      });
    }

    // Validate requested role
    if (!['admin'].includes(requestedRole)) {
      return res.status(400).json({
        message: 'Invalid requested role. Currently only admin role requests are supported.'
      });
    }

    // Check if user is already the requested role
    if (req.user.role === requestedRole) {
      return res.status(400).json({
        message: `You are already a ${requestedRole}`
      });
    }

    // Check if user already has a pending request for this role
    const existingRequest = await RoleRequest.findOne({
      userId: req.user._id,
      requestedRole,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(409).json({
        message: 'You already have a pending role request for this role'
      });
    }

    // Create new role request
    const roleRequest = new RoleRequest({
      userId: req.user._id,
      requestedRole,
      reason: reason.trim(),
    });

    await roleRequest.save();

    const populatedRoleRequest = await RoleRequest.findById(roleRequest._id)
      .populate('userId', 'name email role');

    res.status(201).json({
      message: 'Role request submitted successfully',
      roleRequest: populatedRoleRequest,
    });
  } catch (error) {
    console.error('Submit role request error:', error);

    if (error.code === 11000) {
      return res.status(409).json({ message: 'A role request already exists' });
    }

    res.status(500).json({ message: 'Internal server error' });
  }
});

// Cancel a pending role request
router.delete('/:id', async (req, res) => {
  try {
    const roleRequest = await RoleRequest.findById(req.params.id);

    if (!roleRequest) {
      return res.status(404).json({ message: 'Role request not found' });
    }

    // Check if user owns this request
    if (roleRequest.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only cancel your own requests' });
    }

    // Check if request is still pending
    if (roleRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending requests can be cancelled' });
    }

    await RoleRequest.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Role request cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel role request error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
