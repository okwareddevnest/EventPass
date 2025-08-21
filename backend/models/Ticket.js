const mongoose = require('mongoose');
const QRCode = require('qrcode');

const ticketSchema = new mongoose.Schema({
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
  ticketId: {
    type: String,
    unique: true,
    required: true,
    index: true,
  },
  qrCodeUrl: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['valid', 'used', 'cancelled', 'refunded'],
    default: 'valid',
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  purchaseDate: {
    type: Date,
    default: Date.now,
  },
  usedDate: {
    type: Date,
    default: null,
  },
  paymentIntentId: {
    type: String,
    required: true,
    unique: true,
  },
  orderTrackingId: {
    type: String,
    required: true,
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
ticketSchema.index({ userId: 1, eventId: 1 });
ticketSchema.index({ ticketId: 1 });
ticketSchema.index({ status: 1 });
ticketSchema.index({ purchaseDate: 1 });

// Pre-save middleware to generate QR code
ticketSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      // Generate unique ticket ID
      if (!this.ticketId) {
        this.ticketId = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      }

      // Generate QR code data
      const qrData = JSON.stringify({
        ticketId: this.ticketId,
        userId: this.userId.toString(),
        eventId: this.eventId.toString(),
        purchaseDate: this.purchaseDate,
      });

      // Generate QR code as data URL
      this.qrCodeUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#1D4ED8', // Primary blue
          light: '#FFFFFF',
        },
      });

      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Method to mark ticket as used
ticketSchema.methods.markAsUsed = function() {
  this.status = 'used';
  this.usedDate = new Date();
  return this.save();
};

// Method to validate ticket
ticketSchema.methods.validate = function() {
  return this.status === 'valid' && this.isActive;
};

// Static method to find ticket by ticket ID
ticketSchema.statics.findByTicketId = function(ticketId) {
  return this.findOne({ ticketId, isActive: true });
};

module.exports = mongoose.model('Ticket', ticketSchema);
