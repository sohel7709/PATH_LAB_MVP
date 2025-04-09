const mongoose = require('mongoose');

const labReportSettingsSchema = new mongoose.Schema({
  lab: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lab',
    required: true,
    unique: true
  },
  header: {
    labName: {
      type: String,
      required: [true, 'Lab name is required']
    },
    doctorName: {
      type: String,
      required: [true, 'Doctor name is required']
    },
    address: {
      type: String,
      required: [true, 'Address is required']
    },
    phone: {
      type: String
    },
    email: {
      type: String
    },
    logo: {
      type: String, // URL to the logo image
      default: ''
    }
  },
  footer: {
    verifiedBy: {
      type: String,
      required: [true, 'Verified by name is required']
    },
    designation: {
      type: String,
      default: 'Consultant Pathologist'
    },
    signature: {
      type: String, // URL to the signature image
      default: ''
    }
  },
  styling: {
    primaryColor: {
      type: String,
      default: '#3b82f6' // Blue color
    },
    secondaryColor: {
      type: String,
      default: '#1e40af' // Darker blue
    },
    fontFamily: {
      type: String,
      default: 'Arial, sans-serif'
    },
    fontSize: {
      type: Number,
      default: 12
    }
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

module.exports = mongoose.model('LabReportSettings', labReportSettingsSchema);
