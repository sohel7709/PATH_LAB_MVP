const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subscriptionSchema = new Schema({
  labId: {
    type: Schema.Types.ObjectId,
    ref: 'Lab', // Reference to the Lab model
    required: true,
    index: true, // Index for faster lookups by labId
  },
  planId: {
    type: Schema.Types.ObjectId,
    ref: 'Plan', // Reference to the Plan model
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'trial', 'expired', 'cancelled', 'pending_payment'], // Added more statuses
    default: 'trial',
  },
  paymentProvider: { // Track which payment provider was used (if any)
    type: String,
    enum: ['Stripe', 'Razorpay', 'Instamojo', 'None'], // Allow 'None' for trials/manual activation
    default: 'None',
  },
  paymentId: { // Store the transaction ID from the payment provider
    type: String,
    sparse: true, // Allow null/undefined values, only index if present
  },
  autoRenew: { // Flag for auto-renewal status
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for efficient querying of active subscriptions by end date (for cron jobs)
subscriptionSchema.index({ status: 1, endDate: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
