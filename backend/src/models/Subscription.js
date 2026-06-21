const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subscriptionSchema = new Schema({
  lab: {
    type: Schema.Types.ObjectId,
    ref: 'Lab',
    required: true,
    index: true,
  },
  plan: {
    type: Schema.Types.ObjectId,
    ref: 'Plan',
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
    enum: ['active', 'expired', 'cancelled', 'pending'],
    default: 'active',
  },
  paymentProvider: {
    type: String,
    enum: ['None', 'Stripe', 'Razorpay', 'UPI', 'WhatsApp'],
    default: 'None',
  },
  paymentId: {
    type: String,
    sparse: true,
  },
  activatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  cancelledBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  cancelledAt: {
    type: Date,
  },
  cancelReason: {
    type: String,
  },
  autoRenew: {
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
subscriptionSchema.index({ lab: 1, status: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;