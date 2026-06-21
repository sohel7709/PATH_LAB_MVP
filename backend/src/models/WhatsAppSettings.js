const mongoose = require('mongoose');

const whatsAppSettingsSchema = new mongoose.Schema({
  lab: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lab',
    required: true,
    unique: true,
  },
  enabled: {
    type: Boolean,
    default: false,
  },
  messageTemplate: {
    type: String,
    default: 'Dear {patientName}, your {testName} report is ready. View your report here: {reportLink} - {labName}',
  },
  sendToPatientOnReportComplete: {
    type: Boolean,
    default: true,
  },
  sendToDoctorOnReportComplete: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

whatsAppSettingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('WhatsAppSettings', whatsAppSettingsSchema);