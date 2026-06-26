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
  sendToPatientOnReportComplete: {
    type: Boolean,
    default: true,
  },
  sendToDoctorOnReportComplete: {
    type: Boolean,
    default: false,
  },
  // Meta WhatsApp Business API — approved template names
  patientTemplateName: {
    type: String,
    default: 'test_results_uploaded',
  },
  doctorTemplateName: {
    type: String,
    default: 'doctor_report_ready',
  },
  templateLanguage: {
    type: String,
    default: 'en_US',
  },

  // Google Review request — sent when report status → delivered
  sendGoogleReviewOnDelivery: {
    type: Boolean,
    default: false,
  },
  googleReviewTemplateName: {
    type: String,
    default: 'google_review_request',
  },
  googleReviewUrl: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('WhatsAppSettings', whatsAppSettingsSchema);
