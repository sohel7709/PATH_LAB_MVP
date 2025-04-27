const mongoose = require('mongoose');

const labSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Lab name is required.'], // Updated message
    trim: true,
    unique: true, // Added unique constraint as it's usually desired for lab names
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
      // required: true // Might not be required immediately upon lab creation
    },
    startDate: { // Start date of the current subscription period
      type: Date,
      // default: Date.now // Set when a plan is assigned
    },
    endDate: Date, // End date of the current subscription period
  },
  // Overall status of the lab account
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending_approval', 'suspended'],
    default: 'pending_approval', // Default to pending until approved/plan assigned
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
labSchema.index({ status: 1 }); // Index the new top-level status
labSchema.index({ 'subscription.plan': 1 }); // Index the plan reference
labSchema.index({ 'subscription.endDate': 1 }); // Index the subscription end date
labSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Lab', labSchema);
