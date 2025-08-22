const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['payment', 'commission', 'payout', 'deposit', 'refund'],
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    index: true,
  },
  paymentIntentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentIntent',
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
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed',
    index: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  // Reference to related transaction (e.g., payout for commission)
  relatedTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    index: true,
  },
  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ createdAt: 1 });

// Static method to create payment transaction with commission split
transactionSchema.statics.createPaymentWithCommission = async function(
  paymentIntent, 
  event, 
  commissionPercentage
) {
  const paymentAmount = paymentIntent.amount;
  const commissionAmount = Math.round(paymentAmount * (commissionPercentage / 100));
  const organizerAmount = paymentAmount - commissionAmount;

  // Create payment transaction record
  const paymentTransaction = new this({
    type: 'payment',
    userId: paymentIntent.userId,
    eventId: paymentIntent.eventId,
    paymentIntentId: paymentIntent._id,
    amount: paymentAmount,
    currency: paymentIntent.currency,
    status: 'completed',
    description: `Ticket purchase for ${event.title}`,
    metadata: {
      originalAmount: paymentAmount,
      commissionAmount: commissionAmount,
      organizerAmount: organizerAmount,
    },
  });

  // Create commission transaction
  const commissionTransaction = new this({
    type: 'commission',
    userId: event.organizerId, // Organization that the commission is taken from
    eventId: paymentIntent.eventId,
    paymentIntentId: paymentIntent._id,
    amount: commissionAmount,
    currency: paymentIntent.currency,
    status: 'completed',
    description: `Admin commission (${commissionPercentage}%) from ${event.title}`,
    relatedTransactionId: paymentTransaction._id,
    metadata: {
      commissionPercentage: commissionPercentage,
      originalPayment: paymentAmount,
    },
  });

  paymentTransaction.relatedTransactionId = commissionTransaction._id;

  // Save both transactions
  await paymentTransaction.save();
  await commissionTransaction.save();

  return {
    paymentTransaction,
    commissionTransaction,
    organizerEarnings: organizerAmount,
    adminCommission: commissionAmount,
  };
};

// Static method to get total earnings for a user
transactionSchema.statics.getTotalEarnings = async function(userId) {
  const result = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        type: 'payment',
        status: 'completed',
      }
    },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: '$amount' },
        count: { $sum: 1 },
      }
    }
  ]);

  return result[0] || { totalEarnings: 0, count: 0 };
};

// Static method to get commission earnings for admin
transactionSchema.statics.getTotalCommissions = async function() {
  const result = await this.aggregate([
    {
      $match: {
        type: 'commission',
        status: 'completed',
      }
    },
    {
      $group: {
        _id: null,
        totalCommissions: { $sum: '$amount' },
        count: { $sum: 1 },
      }
    }
  ]);

  return result[0] || { totalCommissions: 0, count: 0 };
};

module.exports = mongoose.model('Transaction', transactionSchema);