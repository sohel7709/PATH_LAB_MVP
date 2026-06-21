const mongoose = require('mongoose');

const revenueTransactionSchema = new mongoose.Schema({
  lab: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lab',
    required: true,
    index: true,
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  subscriptionPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true,
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true,
    unique: true, // One revenue record per subscription
  },
  amount: {
    type: Number,
    required: true,
  },
  activatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  activatedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['active', 'refunded'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient date-based queries
revenueTransactionSchema.index({ activatedAt: -1 });
revenueTransactionSchema.index({ status: 1 });

const RevenueTransaction = mongoose.model('RevenueTransaction', revenueTransactionSchema);

module.exports = RevenueTransaction;