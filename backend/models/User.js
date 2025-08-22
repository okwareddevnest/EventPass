const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  civicId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    default: '',
    trim: true,
  },
  role: {
    type: String,
    enum: ['attendee', 'organization', 'organizer', 'admin'],
    default: 'attendee',
  },
  // Organization-specific fields
  organizationDetails: {
    orgName: {
      type: String,
      trim: true,
    },
    orgLogo: {
      type: String,
      default: null,
    },
    orgDescription: {
      type: String,
      trim: true,
    },
    orgWebsite: {
      type: String,
      trim: true,
    },
    orgPhone: {
      type: String,
      trim: true,
    },
    orgAddress: {
      type: String,
      trim: true,
    },
    // Organization approval and payment status
    isApproved: {
      type: Boolean,
      default: false,
    },
    approvalDate: {
      type: Date,
    },
    depositAmount: {
      type: Number,
      default: 0,
    },
    depositPaid: {
      type: Boolean,
      default: false,
    },
    depositPaymentId: {
      type: String,
    },
    // Financial tracking
    totalEarnings: {
      type: Number,
      default: 0,
    },
    pendingEarnings: {
      type: Number,
      default: 0,
    },
    withdrawnAmount: {
      type: Number,
      default: 0,
    },
  },
  walletAddress: {
    type: String,
    default: null,
  },
  profileImage: {
    type: String,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Index for better query performance
// Note: email and civicId are already indexed with unique: true above

module.exports = mongoose.model('User', userSchema);
