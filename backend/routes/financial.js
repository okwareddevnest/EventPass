const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin, isOrganization } = require('../middleware/auth');
const { validateRequest, payoutRequestSchema } = require('../validation/schemas');
const Transaction = require('../models/Transaction');
const PayoutRequest = require('../models/PayoutRequest');
const Settings = require('../models/Settings');
const User = require('../models/User');

// Get financial dashboard for organizations
router.get('/dashboard', authenticateToken, isOrganization, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's earnings data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get detailed earnings breakdown
    const earningsBreakdown = await Transaction.aggregate([
      {
        $match: {
          userId: userId,
          type: 'payment',
          status: 'completed',
        }
      },
      {
        $lookup: {
          from: 'events',
          localField: 'eventId',
          foreignField: '_id',
          as: 'event'
        }
      },
      {
        $unwind: '$event'
      },
      {
        $group: {
          _id: '$eventId',
          eventTitle: { $first: '$event.title' },
          totalAmount: { $sum: '$amount' },
          ticketsSold: { $sum: 1 },
          organizerEarnings: { $sum: '$metadata.organizerAmount' },
          commissionPaid: { $sum: '$metadata.commissionAmount' },
        }
      },
      {
        $sort: { totalAmount: -1 }
      }
    ]);

    // Get recent transactions
    const recentTransactions = await Transaction.find({
      userId: userId,
      status: 'completed',
    })
      .populate('eventId', 'title')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get pending payout requests
    const pendingPayouts = await PayoutRequest.find({
      userId: userId,
      status: { $in: ['pending', 'approved', 'processing'] }
    }).sort({ requestedAt: -1 });

    // Calculate available balance (pending earnings - pending payouts)
    const pendingPayoutAmount = pendingPayouts.reduce((sum, payout) => sum + payout.amount, 0);
    const availableBalance = user.organizationDetails.pendingEarnings - pendingPayoutAmount;

    res.json({
      organizationDetails: {
        totalEarnings: user.organizationDetails.totalEarnings || 0,
        pendingEarnings: user.organizationDetails.pendingEarnings || 0,
        withdrawnAmount: user.organizationDetails.withdrawnAmount || 0,
        availableBalance: Math.max(0, availableBalance),
        pendingPayoutAmount,
      },
      earningsBreakdown,
      recentTransactions,
      pendingPayouts,
    });
  } catch (error) {
    console.error('Financial dashboard error:', error);
    res.status(500).json({
      message: 'Failed to fetch financial dashboard',
      error: error.message
    });
  }
});

// Request payout
router.post('/payouts/request', authenticateToken, isOrganization, validateRequest(payoutRequestSchema), async (req, res) => {
  try {
    const userId = req.user._id;
    const { amount, payoutMethod, payoutDetails } = req.validatedData;

    // Get user data
    const user = await User.findById(userId);
    if (!user || !user.organizationDetails) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Check minimum payout amount
    const minPayoutAmount = await Settings.getValue(Settings.SYSTEM_KEYS.MINIMUM_PAYOUT_AMOUNT, 1000);
    if (amount < minPayoutAmount) {
      return res.status(400).json({
        message: `Minimum payout amount is ${minPayoutAmount} KES`,
        minAmount: minPayoutAmount
      });
    }

    // Check available balance
    const pendingPayouts = await PayoutRequest.find({
      userId: userId,
      status: { $in: ['pending', 'approved', 'processing'] }
    });

    const pendingPayoutAmount = pendingPayouts.reduce((sum, payout) => sum + payout.amount, 0);
    const availableBalance = user.organizationDetails.pendingEarnings - pendingPayoutAmount;

    if (amount > availableBalance) {
      return res.status(400).json({
        message: 'Insufficient available balance',
        availableBalance,
        requestedAmount: amount
      });
    }

    // Create payout request
    const payoutRequest = new PayoutRequest({
      userId: userId,
      amount,
      payoutMethod,
      payoutDetails,
      currency: 'KES',
    });

    await payoutRequest.save();

    res.status(201).json({
      message: 'Payout request submitted successfully',
      payoutRequest
    });
  } catch (error) {
    console.error('Payout request error:', error);
    res.status(500).json({
      message: 'Failed to submit payout request',
      error: error.message
    });
  }
});

// Get payout requests (for organizations)
router.get('/payouts', authenticateToken, isOrganization, async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const payouts = await PayoutRequest.find(query)
      .sort({ requestedAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await PayoutRequest.countDocuments(query);

    res.json({
      payouts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get payouts error:', error);
    res.status(500).json({
      message: 'Failed to fetch payouts',
      error: error.message
    });
  }
});

// Cancel payout request
router.patch('/payouts/:id/cancel', authenticateToken, isOrganization, async (req, res) => {
  try {
    const payoutId = req.params.id;
    const userId = req.user._id;

    const payout = await PayoutRequest.findOne({ _id: payoutId, userId });
    if (!payout) {
      return res.status(404).json({ message: 'Payout request not found' });
    }

    if (payout.status !== 'pending') {
      return res.status(400).json({
        message: 'Only pending payout requests can be cancelled',
        currentStatus: payout.status
      });
    }

    payout.status = 'cancelled';
    await payout.save();

    res.json({
      message: 'Payout request cancelled successfully',
      payout
    });
  } catch (error) {
    console.error('Cancel payout error:', error);
    res.status(500).json({
      message: 'Failed to cancel payout request',
      error: error.message
    });
  }
});

// Admin endpoints

// Get financial overview (admin only)
router.get('/admin/overview', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Get total commissions earned
    const totalCommissions = await Transaction.getTotalCommissions();

    // Get total payments processed
    const totalPayments = await Transaction.aggregate([
      {
        $match: {
          type: 'payment',
          status: 'completed',
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        }
      }
    ]);

    const paymentsData = totalPayments[0] || { totalAmount: 0, count: 0 };

    // Get pending payout requests
    const pendingPayouts = await PayoutRequest.find({ status: 'pending' })
      .populate('userId', 'name email organizationDetails.orgName')
      .sort({ requestedAt: 1 });

    // Get recent transactions
    const recentTransactions = await Transaction.find({ status: 'completed' })
      .populate('userId', 'name email organizationDetails.orgName')
      .populate('eventId', 'title')
      .sort({ createdAt: -1 })
      .limit(20);

    // Calculate statistics
    const stats = {
      totalRevenue: paymentsData.totalAmount,
      totalCommissions: totalCommissions.totalCommissions,
      organizerEarnings: paymentsData.totalAmount - totalCommissions.totalCommissions,
      totalTransactions: paymentsData.count,
      pendingPayouts: pendingPayouts.length,
      pendingPayoutAmount: pendingPayouts.reduce((sum, payout) => sum + payout.amount, 0),
    };

    res.json({
      stats,
      pendingPayouts,
      recentTransactions,
    });
  } catch (error) {
    console.error('Admin financial overview error:', error);
    res.status(500).json({
      message: 'Failed to fetch financial overview',
      error: error.message
    });
  }
});

// Get all payout requests (admin only)
router.get('/admin/payouts', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const payouts = await PayoutRequest.find(query)
      .populate('userId', 'name email organizationDetails.orgName')
      .populate('reviewedBy', 'name email')
      .sort({ requestedAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await PayoutRequest.countDocuments(query);

    res.json({
      payouts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Admin get payouts error:', error);
    res.status(500).json({
      message: 'Failed to fetch payout requests',
      error: error.message
    });
  }
});

// Approve payout request (admin only)
router.patch('/admin/payouts/:id/approve', authenticateToken, isAdmin, async (req, res) => {
  try {
    const payoutId = req.params.id;
    const { adminNotes } = req.body;

    const payout = await PayoutRequest.findById(payoutId)
      .populate('userId', 'name email organizationDetails');

    if (!payout) {
      return res.status(404).json({ message: 'Payout request not found' });
    }

    if (payout.status !== 'pending') {
      return res.status(400).json({
        message: 'Only pending payout requests can be approved',
        currentStatus: payout.status
      });
    }

    await payout.approve(req.user._id, adminNotes);

    res.json({
      message: 'Payout request approved successfully',
      payout
    });
  } catch (error) {
    console.error('Approve payout error:', error);
    res.status(500).json({
      message: 'Failed to approve payout request',
      error: error.message
    });
  }
});

// Reject payout request (admin only)
router.patch('/admin/payouts/:id/reject', authenticateToken, isAdmin, async (req, res) => {
  try {
    const payoutId = req.params.id;
    const { rejectionReason, adminNotes } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const payout = await PayoutRequest.findById(payoutId);
    if (!payout) {
      return res.status(404).json({ message: 'Payout request not found' });
    }

    if (payout.status !== 'pending') {
      return res.status(400).json({
        message: 'Only pending payout requests can be rejected',
        currentStatus: payout.status
      });
    }

    await payout.reject(req.user._id, rejectionReason, adminNotes);

    res.json({
      message: 'Payout request rejected successfully',
      payout
    });
  } catch (error) {
    console.error('Reject payout error:', error);
    res.status(500).json({
      message: 'Failed to reject payout request',
      error: error.message
    });
  }
});

// Complete payout (admin only)
router.patch('/admin/payouts/:id/complete', authenticateToken, isAdmin, async (req, res) => {
  try {
    const payoutId = req.params.id;
    const { externalReference, notes } = req.body;

    const payout = await PayoutRequest.findById(payoutId);
    if (!payout) {
      return res.status(404).json({ message: 'Payout request not found' });
    }

    if (!['approved', 'processing'].includes(payout.status)) {
      return res.status(400).json({
        message: 'Only approved or processing payout requests can be completed',
        currentStatus: payout.status
      });
    }

    // Create payout transaction
    const payoutTransaction = new Transaction({
      type: 'payout',
      userId: payout.userId,
      amount: payout.amount,
      currency: payout.currency,
      status: 'completed',
      description: `Payout to organization`,
      metadata: {
        payoutRequestId: payout._id,
        payoutMethod: payout.payoutMethod,
        externalReference: externalReference || '',
        adminNotes: notes || '',
      },
    });

    await payoutTransaction.save();

    // Update payout request
    await payout.complete(payoutTransaction._id, externalReference);

    // Update user's financial tracking
    const user = await User.findById(payout.userId);
    if (user && user.organizationDetails) {
      user.organizationDetails.pendingEarnings -= payout.amount;
      user.organizationDetails.withdrawnAmount += payout.amount;
      await user.save();
    }

    res.json({
      message: 'Payout completed successfully',
      payout,
      transaction: payoutTransaction
    });
  } catch (error) {
    console.error('Complete payout error:', error);
    res.status(500).json({
      message: 'Failed to complete payout',
      error: error.message
    });
  }
});

// Update financial settings (admin only)
router.patch('/admin/settings', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { 
      adminCommissionPercentage,
      minimumPayoutAmount,
      organizationDepositAmount
    } = req.body;

    const updatedSettings = {};

    if (adminCommissionPercentage !== undefined) {
      if (adminCommissionPercentage < 0 || adminCommissionPercentage > 50) {
        return res.status(400).json({
          message: 'Commission percentage must be between 0 and 50'
        });
      }

      await Settings.setValue(
        Settings.SYSTEM_KEYS.ADMIN_COMMISSION_PERCENTAGE,
        adminCommissionPercentage,
        'Admin commission percentage',
        req.user._id
      );
      updatedSettings.adminCommissionPercentage = adminCommissionPercentage;
    }

    if (minimumPayoutAmount !== undefined) {
      if (minimumPayoutAmount < 0) {
        return res.status(400).json({
          message: 'Minimum payout amount cannot be negative'
        });
      }

      await Settings.setValue(
        Settings.SYSTEM_KEYS.MINIMUM_PAYOUT_AMOUNT,
        minimumPayoutAmount,
        'Minimum payout amount in KES',
        req.user._id
      );
      updatedSettings.minimumPayoutAmount = minimumPayoutAmount;
    }

    if (organizationDepositAmount !== undefined) {
      if (organizationDepositAmount < 0) {
        return res.status(400).json({
          message: 'Organization deposit amount cannot be negative'
        });
      }

      await Settings.setValue(
        Settings.SYSTEM_KEYS.ORGANIZATION_DEPOSIT_AMOUNT,
        organizationDepositAmount,
        'Organization registration deposit amount in KES',
        req.user._id
      );
      updatedSettings.organizationDepositAmount = organizationDepositAmount;
    }

    res.json({
      message: 'Financial settings updated successfully',
      updatedSettings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      message: 'Failed to update financial settings',
      error: error.message
    });
  }
});

// Get financial settings (admin only)
router.get('/admin/settings', authenticateToken, isAdmin, async (req, res) => {
  try {
    const adminCommissionPercentage = await Settings.getValue(
      Settings.SYSTEM_KEYS.ADMIN_COMMISSION_PERCENTAGE, 
      10
    );
    const minimumPayoutAmount = await Settings.getValue(
      Settings.SYSTEM_KEYS.MINIMUM_PAYOUT_AMOUNT, 
      1000
    );
    const organizationDepositAmount = await Settings.getValue(
      Settings.SYSTEM_KEYS.ORGANIZATION_DEPOSIT_AMOUNT, 
      5000
    );

    res.json({
      adminCommissionPercentage,
      minimumPayoutAmount,
      organizationDepositAmount,
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      message: 'Failed to fetch financial settings',
      error: error.message
    });
  }
});

module.exports = router;