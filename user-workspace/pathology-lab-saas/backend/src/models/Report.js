const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  patientInfo: {
    name: {
      type: String,
      required: [true, 'Please provide patient name'],
      trim: true
    },
    age: {
      type: Number,
      required: [true, 'Please provide patient age']
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: [true, 'Please specify gender']
    },
    contact: {
      phone: String,
      email: String,
      address: String
    },
    patientId: {
      type: String,
      required: [true, 'Please provide patient ID']
    }
  },
  testInfo: {
    name: {
      type: String,
      required: [true, 'Please provide test name']
    },
    category: {
      type: String,
      required: [true, 'Please provide test category']
    },
    description: String,
    method: String,
    sampleType: {
      type: String,
      required: [true, 'Please provide sample type']
    },
    sampleCollectionDate: {
      type: Date,
      required: [true, 'Please provide sample collection date']
    },
    sampleId: {
      type: String,
      required: [true, 'Please provide sample ID']
    }
  },
  results: [{
    parameter: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    },
    unit: String,
    referenceRange: String,
    interpretation: String,
    flag: {
      type: String,
      enum: ['normal', 'low', 'high', 'critical']
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'verified', 'delivered'],
    default: 'pending'
  },
  lab: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lab',
    required: true
  },
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  attachments: [{
    name: String,
    url: String,
    type: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  reportMeta: {
    generatedAt: {
      type: Date,
      default: Date.now
    },
    lastModifiedAt: Date,
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    version: {
      type: Number,
      default: 1
    },
    deliveryStatus: {
      email: {
        sent: Boolean,
        sentAt: Date,
        recipient: String
      },
      sms: {
        sent: Boolean,
        sentAt: Date,
        recipient: String
      },
      whatsapp: {
        sent: Boolean,
        sentAt: Date,
        recipient: String
      }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for faster queries
reportSchema.index({ 'patientInfo.patientId': 1 });
reportSchema.index({ 'testInfo.sampleId': 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ lab: 1 });
reportSchema.index({ technician: 1 });
reportSchema.index({ createdAt: -1 });

// Update lastModifiedAt before saving
reportSchema.pre('save', function(next) {
  this.reportMeta.lastModifiedAt = Date.now();
  next();
});

// Virtual for full patient name
reportSchema.virtual('patientInfo.fullName').get(function() {
  return `${this.patientInfo.name}`;
});

// Method to generate report number
reportSchema.methods.generateReportNumber = function() {
  return `REP-${this._id.toString().slice(-6)}-${new Date().getFullYear()}`;
};

// Method to check if report is modifiable
reportSchema.methods.isModifiable = function() {
  return ['pending', 'in-progress'].includes(this.status);
};

// Method to check if report is viewable
reportSchema.methods.isViewable = function(userRole) {
  return ['super-admin', 'admin'].includes(userRole) || 
         (userRole === 'technician' && this.technician.toString() === this.technician._id.toString());
};

module.exports = mongoose.model('Report', reportSchema);