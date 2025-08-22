const mongoose = require('mongoose');

const payoutRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    required: true,
    default: 'KES',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'processing', 'completed', 'rejected', 'cancelled'],
    default: 'pending',
    index: true,
  },
  requestedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  reviewedAt: {
    type: Date,
  },
  processedAt: {
    type: Date,
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // Payment details for payout
  payoutMethod: {
    type: String,
    enum: ['bank_transfer', 'mobile_money', 'pesapal'],
    required: true,
  },
  payoutDetails: {
    // Bank transfer details
    bankName: String,
    accountNumber: String,
    accountName: String,
    // Mobile money details
    mobileNumber: String,
    provider: String, // M-PESA, Airtel, etc.
    // Additional details
    notes: String,
  },
  adminNotes: {
    type: String,
    trim: true,
  },
  rejectionReason: {
    type: String,
    trim: true,
  },
  // Transaction reference for completed payouts
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
  },
  // External reference (bank reference, mobile money transaction ID, etc.)
  externalReference: {
    type: String,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
payoutRequestSchema.index({ userId: 1, status: 1 });
payoutRequestSchema.index({ status: 1, requestedAt: 1 });
payoutRequestSchema.index({ createdAt: 1 });

// Static method to get pending payouts
payoutRequestSchema.statics.getPendingPayouts = function() {
  return this.find({ status: 'pending' })
    .populate('userId', 'name email organizationDetails')
    .sort({ requestedAt: 1 });
};

// Method to approve payout
payoutRequestSchema.methods.approve = function(reviewedBy, adminNotes = '') {
  this.status = 'approved';
  this.reviewedBy = reviewedBy;
  this.reviewedAt = new Date();
  this.adminNotes = adminNotes;
  return this.save();
};

// Method to reject payout
payoutRequestSchema.methods.reject = function(reviewedBy, rejectionReason, adminNotes = '') {
  this.status = 'rejected';
  this.reviewedBy = reviewedBy;
  this.reviewedAt = new Date();
  this.rejectionReason = rejectionReason;
  this.adminNotes = adminNotes;
  return this.save();
};

// Method to mark as processing
payoutRequestSchema.methods.markProcessing = function() {
  this.status = 'processing';
  this.processedAt = new Date();
  return this.save();
};

// Method to complete payout
payoutRequestSchema.methods.complete = function(transactionId, externalReference = '') {
  this.status = 'completed';
  this.transactionId = transactionId;
  this.externalReference = externalReference;
  if (!this.processedAt) {
    this.processedAt = new Date();
  }
  return this.save();
};

// Virtual to get request age in days
payoutRequestSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.requestedAt.getTime()) / (1000 * 60 * 60 * 24));
});

// Ensure virtual fields are serialised
payoutRequestSchema.set('toJSON', { virtuals: true });
payoutRequestSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('PayoutRequest', payoutRequestSchema);