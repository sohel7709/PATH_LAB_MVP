const mongoose = require('mongoose');

const subscriptionHistorySchema = new mongoose.Schema({
  lab: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lab',
    required: true,
    index: true, // Index for faster queries by lab
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
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
  status: { // e.g., 'active', 'expired', 'cancelled', 'pending_payment'
    type: String,
    enum: ['active', 'expired', 'cancelled', 'pending_payment'],
    default: 'active',
    required: true,
  },
  paymentDetails: { // Optional: Store payment transaction details
    transactionId: String,
    amount: Number,
    currency: String,
    paymentDate: Date,
    paymentMethod: String, // e.g., 'stripe', 'paypal', 'manual'
  },
  createdBy: { // Who initiated this subscription record (e.g., Super Admin)
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const SubscriptionHistory = mongoose.model('SubscriptionHistory', subscriptionHistorySchema);

module.exports = SubscriptionHistory;
