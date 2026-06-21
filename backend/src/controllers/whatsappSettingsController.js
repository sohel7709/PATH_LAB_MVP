const WhatsAppSettings = require('../models/WhatsAppSettings');

// @desc    Get WhatsApp settings for a lab
// @route   GET /api/settings/whatsapp
// @access  Private (admin, super-admin)
exports.getWhatsAppSettings = async (req, res, next) => {
  try {
    // Determine labId: check query param first (sent from frontend), then JWT user.lab
    const labId = req.query.lab || req.user.lab;

    if (!labId) {
      return res.status(400).json({
        success: false,
        message: 'Lab ID is required'
      });
    }

    let settings = await WhatsAppSettings.findOne({ lab: labId });

    if (!settings) {
      // Return default settings if none exist
      settings = {
        lab: labId,
        enabled: false,
        messageTemplate: 'Dear {patientName}, your {testName} report is ready. View your report here: {reportLink} - {labName}',
        sendToPatientOnReportComplete: true,
        sendToDoctorOnReportComplete: false
      };
    }

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update WhatsApp settings for a lab
// @route   PUT /api/settings/whatsapp
// @access  Private (admin, super-admin)
exports.updateWhatsAppSettings = async (req, res, next) => {
  try {
    // Determine labId: check req.body.labId first (sent from frontend), then req.user.lab
    const labId = req.body.labId || req.user.lab;

    if (!labId) {
      return res.status(400).json({
        success: false,
        message: 'Lab is not associated with your account'
      });
    }

    const { enabled, messageTemplate, sendToPatientOnReportComplete, sendToDoctorOnReportComplete } = req.body;

    const updateData = {};
    if (enabled !== undefined) updateData.enabled = enabled;
    if (messageTemplate !== undefined) updateData.messageTemplate = messageTemplate;
    if (sendToPatientOnReportComplete !== undefined) updateData.sendToPatientOnReportComplete = sendToPatientOnReportComplete;
    if (sendToDoctorOnReportComplete !== undefined) updateData.sendToDoctorOnReportComplete = sendToDoctorOnReportComplete;

    const settings = await WhatsAppSettings.findOneAndUpdate(
      { lab: labId },
      { ...updateData, lab: labId },
      { 
        new: true, 
        upsert: true, 
        runValidators: true 
      }
    );

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};