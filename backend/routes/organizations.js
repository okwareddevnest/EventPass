const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/logos/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'org-logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadDir = 'uploads/logos';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Register as organization
router.post('/register', authenticateToken, async (req, res) => {
  try {
    const {
      orgName,
      orgDescription,
      orgWebsite,
      orgPhone,
      orgAddress,
      orgLogo,
      depositAmount
    } = req.body;

    // Validate required fields
    if (!orgName || !orgDescription || !orgPhone || !orgAddress) {
      return res.status(400).json({
        message: 'Missing required fields: orgName, orgDescription, orgPhone, orgAddress'
      });
    }

    // Get current user
    const user = await User.findOne({ civicId: req.user.civicId, isActive: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already an organization
    if (user.role === 'organization') {
      return res.status(400).json({ message: 'User is already registered as an organization' });
    }

    // Update user role and organization details
    user.role = 'organization';
    user.organizationDetails = {
      orgName: orgName.trim(),
      orgDescription: orgDescription.trim(),
      orgWebsite: orgWebsite ? orgWebsite.trim() : '',
      orgPhone: orgPhone.trim(),
      orgAddress: orgAddress.trim(),
      orgLogo: orgLogo || null,
      isApproved: false,
      depositAmount: parseFloat(depositAmount) || 100,
      depositPaid: false,
      totalEarnings: 0,
      pendingEarnings: 0,
      withdrawnAmount: 0,
    };

    await user.save();

    // For now, skip payment URL creation to avoid complex dependencies
    // TODO: Implement payment URL creation when Pesapal is fully configured
    const paymentUrl = null;
    console.log(`✅ Organization registration completed for ${user.organizationDetails.orgName}`);

    res.status(201).json({
      message: 'Organization registration submitted successfully',
      user: {
        id: user._id,
        civicId: user.civicId,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationDetails: user.organizationDetails,
      },
      paymentUrl: paymentUrl,
    });
  } catch (error) {
    console.error('Organization registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Upload organization logo (optional)
router.post('/upload/logo', authenticateToken, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const logoUrl = `/uploads/logos/${req.file.filename}`;

    // Update user's organization logo
    const user = await User.findOne({ civicId: req.user.civicId, isActive: true });
    if (user && user.role === 'organization') {
      user.organizationDetails.orgLogo = logoUrl;
      await user.save();
    }

    res.json({
      message: 'Logo uploaded successfully',
      logoUrl: logoUrl,
    });
  } catch (error) {
    console.error('Logo upload error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all pending organization approvals (admin only)
router.get('/pending-approvals', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const pendingOrganizations = await User.find({
      role: 'organization',
      'organizationDetails.isApproved': false,
      isActive: true,
    })
    .select('name email organizationDetails createdAt')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await User.countDocuments({
      role: 'organization',
      'organizationDetails.isApproved': false,
      isActive: true,
    });

    res.json({
      organizations: pendingOrganizations,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalOrganizations: total,
      },
    });
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Approve organization (admin only)
router.put('/:userId/approve', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'organization') {
      return res.status(400).json({ message: 'User is not registered as an organization' });
    }

    if (user.organizationDetails.isApproved) {
      return res.status(400).json({ message: 'Organization is already approved' });
    }

    // Approve the organization
    user.organizationDetails.isApproved = true;
    user.organizationDetails.approvalDate = new Date();

    await user.save();

    res.json({
      message: 'Organization approved successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationDetails: user.organizationDetails,
      },
    });
  } catch (error) {
    console.error('Approve organization error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Reject organization (admin only)
router.put('/:userId/reject', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'organization') {
      return res.status(400).json({ message: 'User is not registered as an organization' });
    }

    // Reset user to attendee and clear organization details
    user.role = 'attendee';
    user.organizationDetails = undefined;

    await user.save();

    res.json({
      message: 'Organization registration rejected',
      reason: reason || 'No reason provided',
    });
  } catch (error) {
    console.error('Reject organization error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get organization profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ civicId: req.user.civicId, isActive: true });

    if (!user || user.role !== 'organization') {
      return res.status(404).json({ message: 'Organization not found' });
    }

    res.json({
      organization: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationDetails: user.organizationDetails,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Get organization profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update organization profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ civicId: req.user.civicId, isActive: true });

    if (!user || user.role !== 'organization') {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const allowedUpdates = [
      'orgName', 'orgDescription', 'orgWebsite', 'orgPhone', 'orgAddress', 'orgLogo'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        user.organizationDetails[field] = req.body[field];
      }
    });

    await user.save();

    res.json({
      message: 'Organization profile updated successfully',
      organization: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationDetails: user.organizationDetails,
      },
    });
  } catch (error) {
    console.error('Update organization profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create deposit payment URL using Pesapal
async function createDepositPaymentUrl(user, amount) {
  const axios = require('axios');
  const crypto = require('crypto');
  const pesapalAuth = require('../services/pesapalAuth');
  const Settings = require('../models/Settings');
  const PaymentIntent = require('../models/PaymentIntent');
  
  try {
    // Get IPN ID from settings
    const ipnId = await Settings.getValue(Settings.SYSTEM_KEYS.PESAPAL_IPN_ID);
    if (!ipnId) {
      throw new Error('Pesapal IPN not registered. Please contact support.');
    }

    const merchantReference = `ORG-DEP-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const callbackUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/organization/deposit-callback`;
    const endpoints = pesapalAuth.getEndpoints();
    const headers = await pesapalAuth.getAuthHeaders();

    // Prepare order payload for organization deposit
    const orderPayload = {
      id: merchantReference,
      currency: 'KES',
      amount: amount,
      description: `Organization registration deposit for ${user.organizationDetails.orgName}`,
      callback_url: callbackUrl,
      notification_id: ipnId,
      redirect_mode: 'TOP_WINDOW',
      billing_address: {
        email_address: user.email || '',
        phone_number: user.organizationDetails.orgPhone || user.phone || '',
        country_code: 'KE',
        first_name: user.name.split(' ')[0] || '',
        last_name: user.name.split(' ').slice(1).join(' ') || '',
      }
    };

    // Submit order to Pesapal
    const response = await axios.post(endpoints.submitOrder, orderPayload, { headers });

    if (response.data.redirect_url && response.data.order_tracking_id) {
      // Create payment intent record for deposit
      const paymentIntent = new PaymentIntent({
        userId: user._id,
        eventId: null, // No event for organization deposits
        merchantReference,
        orderTrackingId: response.data.order_tracking_id,
        amount: amount,
        currency: 'KES',
        status: 'PENDING',
        pesapalResponse: response.data,
      });

      await paymentIntent.save();

      // Store payment references in user record
      user.organizationDetails.depositPaymentId = paymentIntent._id.toString();
      user.organizationDetails.depositOrderTrackingId = response.data.order_tracking_id;
      user.organizationDetails.depositMerchantReference = merchantReference;
      await user.save();

      console.log(`Organization deposit payment created for ${user.organizationDetails.orgName}: KES ${amount}`);
      
      return response.data.redirect_url;

    } else {
      throw new Error('Invalid order response from Pesapal');
    }

  } catch (error) {
    console.error('Error creating deposit payment:', error);
    throw new Error('Failed to create deposit payment: ' + (error.response?.data?.message || error.message));
  }
}

module.exports = router;
