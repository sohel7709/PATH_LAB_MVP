const WhatsAppSettings = require('../models/WhatsAppSettings');

// @desc    Get WhatsApp settings for a lab
// @route   GET /api/settings/whatsapp
// @access  Private (admin, super-admin)
exports.getWhatsAppSettings = async (req, res, next) => {
  try {
    const labId = req.query.lab || req.user.lab;
    if (!labId) {
      return res.status(400).json({ success: false, message: 'Lab ID is required' });
    }

    let settings = await WhatsAppSettings.findOne({ lab: labId });

    if (!settings) {
      settings = {
        lab: labId,
        enabled: false,
        sendToPatientOnReportComplete: true,
        sendToDoctorOnReportComplete: false,
        patientTemplateName: 'test_results_uploaded',
        doctorTemplateName: 'doctor_report_ready',
        templateLanguage: 'en_US',
        sendGoogleReviewOnDelivery: false,
        googleReviewTemplateName: 'google_review_request',
        googleReviewUrl: '',
      };
    }

    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update WhatsApp settings for a lab
// @route   POST /api/settings/whatsapp
// @access  Private (admin, super-admin)
exports.updateWhatsAppSettings = async (req, res, next) => {
  try {
    const labId = req.body.labId || req.user.lab;
    if (!labId) {
      return res.status(400).json({ success: false, message: 'Lab is not associated with your account' });
    }

    const {
      enabled,
      sendToPatientOnReportComplete,
      sendToDoctorOnReportComplete,
      patientTemplateName,
      doctorTemplateName,
      templateLanguage,
      sendGoogleReviewOnDelivery,
      googleReviewTemplateName,
      googleReviewUrl,
    } = req.body;

    const updateData = {};
    if (enabled !== undefined) updateData.enabled = enabled;
    if (sendToPatientOnReportComplete !== undefined) updateData.sendToPatientOnReportComplete = sendToPatientOnReportComplete;
    if (sendToDoctorOnReportComplete !== undefined) updateData.sendToDoctorOnReportComplete = sendToDoctorOnReportComplete;
    if (patientTemplateName !== undefined) updateData.patientTemplateName = patientTemplateName;
    if (doctorTemplateName !== undefined) updateData.doctorTemplateName = doctorTemplateName;
    if (templateLanguage !== undefined) updateData.templateLanguage = templateLanguage;
    if (sendGoogleReviewOnDelivery !== undefined) updateData.sendGoogleReviewOnDelivery = sendGoogleReviewOnDelivery;
    if (googleReviewTemplateName !== undefined) updateData.googleReviewTemplateName = googleReviewTemplateName;
    if (googleReviewUrl !== undefined) updateData.googleReviewUrl = googleReviewUrl;

    const settings = await WhatsAppSettings.findOneAndUpdate(
      { lab: labId },
      { ...updateData, lab: labId },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};
