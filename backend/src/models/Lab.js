const mongoose = require('mongoose');

const labSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a lab name'],
    trim: true,
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
  subscription: {
    plan: {
      type: String,
      enum: ['basic', 'premium', 'enterprise'],
      default: 'basic'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: Date,
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active'
    }
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
labSchema.index({ 'subscription.status': 1 });
labSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Lab', labSchema);