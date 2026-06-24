const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  feedbackId: {
    type: String,
    unique: true,
    required: true,
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
  images: [
    {
      type: String, // URL/path to uploaded image
    },
  ],
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
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for faster queries
feedbackSchema.index({ feedbackId: 1 });
feedbackSchema.index({ admin: 1 });
feedbackSchema.index({ lab: 1 });
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ priority: 1 });
feedbackSchema.index({ type: 1 });
feedbackSchema.index({ createdAt: -1 });

// Update updatedAt on save
feedbackSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Auto-generate feedbackId before saving (FB-YYYY-NNNN)
feedbackSchema.pre('validate', async function (next) {
  if (this.isNew && !this.feedbackId) {
    const year = new Date().getFullYear();
    // Find the latest feedback for this year
    const Feedback = mongoose.model('Feedback');
    const latest = await Feedback.findOne({
      feedbackId: new RegExp(`^FB-${year}-\\d{4}$`),
    }).sort({ feedbackId: -1 });

    let nextNumber = 1;
    if (latest && latest.feedbackId) {
      const parts = latest.feedbackId.split('-');
      nextNumber = parseInt(parts[2], 10) + 1;
    }

    this.feedbackId = `FB-${year}-${String(nextNumber).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Feedback', feedbackSchema);