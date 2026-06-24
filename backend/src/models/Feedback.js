const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  feedbackId: {
    type: String,
    unique: true,
    // Auto-generated in pre('save') — not required in schema
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters'],
  },
  type: {
    type: String,
    required: [true, 'Feedback type is required'],
    enum: [
      'Bug Report',
      'Feature Request',
      'Improvement Suggestion',
      'UI/UX Issue',
      'Performance Issue',
      'Other',
    ],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [5000, 'Description cannot exceed 5000 characters'],
  },
  priority: {
    type: String,
    required: [true, 'Priority is required'],
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium',
  },
  status: {
    type: String,
    enum: [
      'Pending',
      'Read',
      'Working On It',
      'Completed',
      'Rejected',
      'Need More Information',
      'Duplicate Request',
      'Planned For Future Release',
    ],
    default: 'Pending',
  },
  images: {
    type: [String],
    default: [],
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  lab: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lab',
    required: true,
  },
  internalNotes: {
    type: String,
    default: '',
    trim: true,
    maxlength: [5000, 'Internal notes cannot exceed 5000 characters'],
  },
  statusHistory: [
    {
      status: String,
      changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      changedAt: {
        type: Date,
        default: Date.now,
      },
      note: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Auto-generate feedbackId before saving
feedbackSchema.pre('save', async function (next) {
  if (this.isNew && !this.feedbackId) {
    try {
      const year = new Date().getFullYear();
      const Feedback = require('mongoose').model('Feedback');
      const lastFeedback = await Feedback
        .findOne({ feedbackId: new RegExp(`^FB-${year}-\\d{4}$`) })
        .sort({ feedbackId: -1 });

      let nextNumber = 1;
      if (lastFeedback && lastFeedback.feedbackId) {
        const parts = lastFeedback.feedbackId.split('-');
        nextNumber = parseInt(parts[2], 10) + 1;
      }
      this.feedbackId = `FB-${year}-${String(nextNumber).padStart(4, '0')}`;
    } catch (err) {
      // Fallback: use timestamp-based ID
      const ts = Date.now().toString(36).toUpperCase();
      this.feedbackId = `FB-${new Date().getFullYear()}-${ts.slice(-4)}`;
    }
  }
  this.updatedAt = Date.now();
  next();
});

// Indexes
feedbackSchema.index({ feedbackId: 1 });
feedbackSchema.index({ lab: 1 });
feedbackSchema.index({ admin: 1 });
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ type: 1 });
feedbackSchema.index({ priority: 1 });
feedbackSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);