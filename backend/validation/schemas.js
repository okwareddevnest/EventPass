const { z } = require('zod');

// Pesapal IPN registration schema
const ipnRegistrationSchema = z.object({
  url: z.string().url('Must be a valid HTTPS URL').refine(
    (url) => url.startsWith('https://'),
    'IPN URL must be HTTPS'
  ),
  ipn_notification_type: z.literal('POST')
});

// Pesapal order creation schema
const createOrderSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required')
});

// Pesapal callback schema
const callbackSchema = z.object({
  OrderTrackingId: z.string().min(1, 'OrderTrackingId is required'),
  OrderMerchantReference: z.string().min(1, 'OrderMerchantReference is required'),
  OrderNotificationType: z.string().min(1, 'OrderNotificationType is required')
});

// Pesapal IPN notification schema
const ipnNotificationSchema = z.object({
  OrderNotificationType: z.string().min(1),
  OrderTrackingId: z.string().min(1),
  OrderMerchantReference: z.string().min(1)
});

// Verification request schema
const verificationSchema = z.object({
  orderTrackingId: z.string().min(1, 'OrderTrackingId is required')
});

// Settings schema for storing Pesapal configuration
const settingsSchema = z.object({
  key: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean()])
});

// Payout request schema
const payoutRequestSchema = z.object({
  amount: z.number().min(1, 'Amount must be greater than 0'),
  payoutMethod: z.enum(['bank_transfer', 'mobile_money', 'pesapal'], {
    errorMap: () => ({ message: 'Invalid payout method' })
  }),
  payoutDetails: z.object({
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    accountName: z.string().optional(),
    mobileNumber: z.string().optional(),
    provider: z.string().optional(),
    notes: z.string().optional()
  }).refine((data) => {
    // Validate required fields based on payout method
    return true; // Basic validation for now, can be enhanced
  }, {
    message: 'Missing required payout details'
  })
});

// Validation middleware
const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req.body);
      req.validatedData = validatedData;
      next();
    } catch (error) {
      console.error('Validation error:', error.errors);
      res.status(400).json({
        message: 'Validation failed',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
  };
};

module.exports = {
  ipnRegistrationSchema,
  createOrderSchema,
  callbackSchema,
  ipnNotificationSchema,
  verificationSchema,
  settingsSchema,
  payoutRequestSchema,
  validateRequest
};
