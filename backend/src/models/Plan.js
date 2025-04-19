const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Plan name is required.'],
    trim: true,
    unique: true,
  },
  description: {
    type: String,
    trim: true,
  },
  price: {
    type: Number,
    required: [true, 'Plan price is required.'],
    min: [0, 'Price cannot be negative.'],
  },
  duration: { // Duration in days
    type: Number,
    required: [true, 'Plan duration is required.'],
    min: [1, 'Duration must be at least 1 day.'],
  },
  features: {
    // Define specific feature toggles here
    // Example:
    maxUsers: { type: Number, default: 5 },
    maxPatients: { type: Number, default: 1000 },
    customReportHeader: { type: Boolean, default: false },
    customReportFooter: { type: Boolean, default: false },
    apiAccess: { type: Boolean, default: false },
    // Add more features as needed
  },
  isDefault: { // Optional: Mark a plan as the default for new labs
    type: Boolean,
    default: false,
  },
  isActive: { // Allows disabling a plan without deleting it
      type: Boolean,
      default: true,
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

// Middleware to update `updatedAt` field
planSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

planSchema.pre('findOneAndUpdate', function (next) {
    this.set({ updatedAt: Date.now() });
    next();
});


const Plan = mongoose.model('Plan', planSchema);

module.exports = Plan;
