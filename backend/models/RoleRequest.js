const mongoose = require('mongoose');

const roleRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  requestedRole: {
    type: String,
    enum: ['admin'],
    required: true,
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true,
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  reviewNotes: {
    type: String,
    default: '',
    trim: true,
  },
  reviewedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Index for better query performance
roleRequestSchema.index({ userId: 1, status: 1 });
roleRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('RoleRequest', roleRequestSchema);
