const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { verify: verifyCivicToken } = require('@civic/auth-verify');

// Admin email whitelist for auto role assignment
const ADMIN_EMAILS = [
  'softengdedan@gmail.com',
  process.env.ADMIN_EMAIL
].filter(Boolean).map(email => email.toLowerCase());

// Determine user role based on email
function determineUserRole(email) {
  const lowercaseEmail = email.toLowerCase();
  
  // Check if user is in admin whitelist
  if (ADMIN_EMAILS.includes(lowercaseEmail)) {
    return 'admin';
  }
  
  // Check if user is already in database with a specific role
  // This will be handled in the main function
  return 'attendee'; // Default role
}

// Civic Auth verification endpoint
router.post('/verify', async (req, res) => {
  console.log('🚀 Auth /verify route hit with body:', JSON.stringify(req.body, null, 2));
  try {
    const { token, civicId, name, email, walletAddress } = req.body;

    // Validate required fields
    if (!token || !civicId || !name || !email) {
      return res.status(400).json({
        message: 'Missing required fields: token, civicId, name, email'
      });
    }

    // For development/testing, skip Civic token verification if no client config
    // OR if we're in development and using a test token
    const skipVerification = !process.env.CIVIC_CLIENT_ID || 
                             process.env.NODE_ENV === 'development' ||
                             token === 'test-token' || token === 'civic-auth-token';
    
    console.log(`🔐 Auth Debug: skipVerification=${skipVerification}, NODE_ENV=${process.env.NODE_ENV}, token=${token}`);
    
    if (!skipVerification) {
      // Verify the Civic Auth token in production
      try {
        const verificationResult = await verifyCivicToken(token);

        if (!verificationResult.valid) {
          return res.status(401).json({
            message: 'Invalid Civic Auth token'
          });
        }

        // Verify the civicId matches the token
        if (verificationResult.user && verificationResult.user.civicId !== civicId) {
          return res.status(401).json({
            message: 'Civic ID mismatch'
          });
        }
      } catch (verificationError) {
        console.error('Civic token verification error:', verificationError);
        return res.status(401).json({
          message: 'Failed to verify Civic Auth token'
        });
      }
    } else {
      console.log('⚠️ Skipping Civic token verification (development mode or no client config)');
    }

    // Look for existing user by civicId first, then by email
    let user = await User.findOne({ 
      $or: [
        { civicId },
        { email: email.toLowerCase() }
      ]
    });

    if (user) {
      // Update existing user's civic ID if it's a temp one and we have a real one
      if (user.civicId.startsWith('admin-') && civicId && !civicId.startsWith('admin-')) {
        user.civicId = civicId;
      }
      
      // Update user info
      user.name = name;
      user.email = email.toLowerCase();
      if (walletAddress) user.walletAddress = walletAddress;
      user.isActive = true;
      
      // Preserve existing role but upgrade to admin if in whitelist
      if (ADMIN_EMAILS.includes(email.toLowerCase()) && user.role !== 'admin') {
        user.role = 'admin';
        console.log(`🚀 Upgraded user ${email} to admin role`);
      }
      
      await user.save();
      
      console.log(`✅ Updated existing user: ${email} (Role: ${user.role})`);
    } else {
      // Determine initial role for new user
      const initialRole = determineUserRole(email);
      
      // Create new user
      user = new User({
        civicId,
        name,
        email: email.toLowerCase(),
        walletAddress: walletAddress || null,
        role: initialRole,
        isActive: true,
      });
      await user.save();
      
      console.log(`✅ Created new user: ${email} (Role: ${user.role})`);
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
        organizationDetails: user.organizationDetails
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

// Civic Auth OAuth callback endpoint
router.post('/callback', async (req, res) => {
  try {
    const { code, state } = req.body;

    if (!code) {
      return res.status(400).json({
        message: 'Authorization code is required'
      });
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://auth.civic.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.CIVIC_CLIENT_ID,
        client_secret: process.env.CIVIC_CLIENT_SECRET,
        code: code,
        redirect_uri: process.env.CIVIC_REDIRECT_URI || `${process.env.FRONTEND_URL}/auth/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text());
      return res.status(400).json({
        message: 'Failed to exchange authorization code for token'
      });
    }

    const tokenData = await tokenResponse.json();
    const { access_token, id_token } = tokenData;

    // Get user info using the access token
    const userInfoResponse = await fetch('https://auth.civic.com/oauth/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      return res.status(400).json({
        message: 'Failed to get user information'
      });
    }

    const userInfo = await userInfoResponse.json();

    // Verify the ID token
    try {
      const verificationResult = await verifyCivicToken(id_token, {
        clientId: process.env.CIVIC_CLIENT_ID,
        clientSecret: process.env.CIVIC_CLIENT_SECRET,
      });

      if (!verificationResult.valid) {
        return res.status(401).json({
          message: 'Invalid ID token'
        });
      }
    } catch (verificationError) {
      console.error('ID token verification error:', verificationError);
      return res.status(401).json({
        message: 'Failed to verify ID token'
      });
    }

    // Find or create user - check by civicId first, then email
    let user = await User.findOne({ 
      $or: [
        { civicId: userInfo.sub },
        { email: userInfo.email?.toLowerCase() }
      ]
    });

    if (user) {
      // Update existing user's civic ID if it's a temp one
      if (user.civicId.startsWith('admin-') && userInfo.sub && !userInfo.sub.startsWith('admin-')) {
        user.civicId = userInfo.sub;
      }
      
      // Update user info
      user.name = userInfo.name || user.name;
      user.email = userInfo.email?.toLowerCase() || user.email;
      user.isActive = true;
      
      // Upgrade to admin if in whitelist
      if (userInfo.email && ADMIN_EMAILS.includes(userInfo.email.toLowerCase()) && user.role !== 'admin') {
        user.role = 'admin';
        console.log(`🚀 Upgraded user ${userInfo.email} to admin role via callback`);
      }
      
      await user.save();
    } else {
      // Determine initial role for new user
      const initialRole = userInfo.email ? determineUserRole(userInfo.email) : 'attendee';
      
      // Create new user
      user = new User({
        civicId: userInfo.sub,
        name: userInfo.name || 'Civic User',
        email: userInfo.email?.toLowerCase(),
        walletAddress: userInfo.wallet_address || null,
        role: initialRole,
        isActive: true,
      });
      await user.save();
      
      console.log(`✅ Created new user via callback: ${userInfo.email} (Role: ${user.role})`);
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
    console.error('Auth callback error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Health check for auth routes
router.get('/', (req, res) => {
  res.json({
    message: 'Auth API is running',
    endpoints: [
      'POST /api/auth/verify - Verify Civic Auth token',
      'GET /api/auth/me - Get current user profile',
      'PUT /api/auth/profile - Update user profile',
      'POST /api/auth/callback - OAuth callback endpoint'
    ]
  });
});

module.exports = router;
