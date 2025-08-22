const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  isSystem: {
    type: Boolean,
    default: false,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, {
  timestamps: true,
});

// Static method to get setting by key
settingsSchema.statics.getValue = async function(key, defaultValue = null) {
  const setting = await this.findOne({ key });
  return setting ? setting.value : defaultValue;
};

// Static method to set setting value
settingsSchema.statics.setValue = async function(key, value, description = '', updatedBy = null) {
  const setting = await this.findOneAndUpdate(
    { key },
    {
      value,
      description,
      updatedBy,
      isSystem: true,
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );
  return setting;
};

// Predefined system settings keys
settingsSchema.statics.SYSTEM_KEYS = {
  PESAPAL_IPN_ID: 'pesapal_ipn_id',
  PESAPAL_IPN_URL: 'pesapal_ipn_url',
  PESAPAL_CALLBACK_URL: 'pesapal_callback_url',
  // Financial settings
  ADMIN_COMMISSION_PERCENTAGE: 'admin_commission_percentage',
  MINIMUM_PAYOUT_AMOUNT: 'minimum_payout_amount',
  ORGANIZATION_DEPOSIT_AMOUNT: 'organization_deposit_amount',
};

module.exports = mongoose.model('Settings', settingsSchema);
