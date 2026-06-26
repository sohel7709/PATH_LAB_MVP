const mongoose = require('mongoose');

// Ledger of every WhatsApp credit change for a lab (top-ups and deductions).
const whatsappCreditTransactionSchema = new mongoose.Schema({
  lab: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lab',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['topup', 'deduction', 'refund'],
    required: true,
  },
  // Positive number of credits added (topup) or removed (deduction).
  amount: {
    type: Number,
    required: true,
  },
  // Lab balance immediately after this transaction was applied.
  balanceAfter: {
    type: Number,
    required: true,
  },
  // For deductions: which report/recipient the message was for.
  relatedReport: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    default: null,
  },
  recipientType: {
    type: String,
    enum: ['patient', 'doctor', 'review', 'report'],
    // No default: an unset enum must be `undefined` (not null) or Mongoose
    // enum validation rejects it. Top-ups simply omit this field.
  },
  // For top-ups: the super-admin who added the credits.
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  reason: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

whatsappCreditTransactionSchema.index({ lab: 1, createdAt: -1 });

module.exports = mongoose.model('WhatsAppCreditTransaction', whatsappCreditTransactionSchema);
