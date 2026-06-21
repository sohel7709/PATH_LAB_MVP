const mongoose = require('mongoose');

const labSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Lab name is required.'],
    trim: true,
    unique: true,
    maxlength: [100, 'Lab name cannot be more than 100 characters']
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  contact: {
    phone: String,
    email: {
      type: String,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email'
      ]
    }
  },
  // Subscription details linked to the Plan model
  subscription: {
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
    },
    startDate: {
      type: Date,
    },
    endDate: Date,
  },
  // Subscription status fields
  subscriptionStatus: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'pending', 'trial'],
    default: 'pending',
  },
  subscriptionExpiry: {
    type: Date,
    default: null,
  },
  subscriptionPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    default: null,
  },
  totalPatientsCreated: {
    type: Number,
    default: 0,
  },
  totalReportsCreated: {
    type: Number,
    default: 0,
  },
  // Overall status of the lab account
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending_approval', 'suspended'],
    default: 'pending_approval',
    required: true,
  },
  settings: {
    reportHeader: String,
    reportFooter: String,
    logo: String,
    theme: {
      primaryColor: String,
      secondaryColor: String
    }
  },
  stats: {
    totalReports: {
      type: Number,
      default: 0
    },
    totalPatients: {
      type: Number,
      default: 0
    },
    lastReportDate: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting all users associated with this lab
labSchema.virtual('users', {
  ref: 'User',
  localField: '_id',
  foreignField: 'lab',
  justOne: false
});

// Virtual for getting all reports associated with this lab
labSchema.virtual('reports', {
  ref: 'Report',
  localField: '_id',
  foreignField: 'lab',
  justOne: false
});

// Middleware to update the updatedAt timestamp
labSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster queries
labSchema.index({ name: 1 });
labSchema.index({ status: 1 });
labSchema.index({ subscriptionStatus: 1 });
labSchema.index({ subscriptionExpiry: 1 });
labSchema.index({ subscriptionPlan: 1 });
labSchema.index({ 'subscription.plan': 1 });
labSchema.index({ 'subscription.endDate': 1 });
labSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Lab', labSchema);