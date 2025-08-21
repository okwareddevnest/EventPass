const mongoose = require('mongoose');

const paymentIntentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true,
  },
  merchantReference: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  orderTrackingId: {
    type: String,
    required: true,
    unique: true,
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
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'REVERSED', 'CANCELLED'],
    default: 'PENDING',
    index: true,
  },
  paymentStatusDescription: {
    type: String,
    default: '',
  },
  confirmationCode: {
    type: String,
    default: '',
  },
  // Pesapal response data
  pesapalResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  // IPN notification data
  ipnNotifications: [{
    notificationType: String,
    receivedAt: {
      type: Date,
      default: Date.now,
    },
    data: mongoose.Schema.Types.Mixed,
  }],
}, {
  timestamps: true,
});

// Indexes for better query performance
paymentIntentSchema.index({ userId: 1, eventId: 1 });
paymentIntentSchema.index({ merchantReference: 1 });
paymentIntentSchema.index({ orderTrackingId: 1 });
paymentIntentSchema.index({ status: 1 });
paymentIntentSchema.index({ createdAt: 1 });

// Static method to find by order tracking ID
paymentIntentSchema.statics.findByOrderTrackingId = function(orderTrackingId) {
  return this.findOne({ orderTrackingId });
};

// Static method to find by merchant reference
paymentIntentSchema.statics.findByMerchantReference = function(merchantReference) {
  return this.findOne({ merchantReference });
};

// Method to mark as completed
paymentIntentSchema.methods.markAsCompleted = function(paymentStatusDescription, confirmationCode) {
  this.status = 'COMPLETED';
  this.paymentStatusDescription = paymentStatusDescription;
  this.confirmationCode = confirmationCode;
  return this.save();
};

// Method to mark as failed
paymentIntentSchema.methods.markAsFailed = function(paymentStatusDescription) {
  this.status = 'FAILED';
  this.paymentStatusDescription = paymentStatusDescription;
  return this.save();
};

// Method to mark as reversed
paymentIntentSchema.methods.markAsReversed = function(paymentStatusDescription) {
  this.status = 'REVERSED';
  this.paymentStatusDescription = paymentStatusDescription;
  return this.save();
};

// Method to add IPN notification
paymentIntentSchema.methods.addIPNNotification = function(notificationType, data) {
  this.ipnNotifications.push({
    notificationType,
    data,
  });
  return this.save();
};

module.exports = mongoose.model('PaymentIntent', paymentIntentSchema);
