const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    unique: true
  },
  designation: {
    type: String,
    required: [true, 'Please add a designation'],
    enum: ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Master', 'Miss'],
    trim: true
  },
  fullName: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  age: {
    type: Number,
    required: [true, 'Please add an age'],
    min: [0, 'Age must be a positive number'],
    max: [150, 'Age cannot be more than 150']
  },
  gender: {
    type: String,
    required: [true, 'Please specify gender'],
    enum: ['male', 'female', 'other']
  },
  phone: {
    type: String,
    required: false, // Made phone number optional
    trim: true,
    maxlength: [20, 'Phone number cannot be more than 20 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  address: {
    type: String,
    trim: true,
    maxlength: [200, 'Address cannot be more than 200 characters']
  },
  labId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lab',
    required: [true, 'Please add a lab ID']
  },
  lastTestType: {
    type: String,
    trim: true
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
  timestamps: true
});

// Create index for faster queries
PatientSchema.index({ labId: 1 });
PatientSchema.index({ phone: 1 });
PatientSchema.index({ email: 1 });

module.exports = mongoose.model('Patient', PatientSchema);
