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
    enum: ['attendee', 'organizer', 'admin'],
    default: 'attendee',
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
