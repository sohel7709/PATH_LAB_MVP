const Report = require('../models/Report');
const User = require('../models/User');
const { createAuditLog } = require('../services/auditService');

// @desc    Verify report
// @route   PUT /api/admin/reports/:id/verify
// @access  Private/Admin
exports.verifyReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    if (report.lab.toString() !== req.user.lab.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to verify this report'
      });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Only Admins can verify reports.'
        });
    }

    const oldStatus = report.status;
    report.status = 'verified';
    report.verifiedBy = req.user.id;
    report.reportMeta = report.reportMeta || {};
    report.reportMeta.lastModifiedAt = Date.now();
    report.reportMeta.lastModifiedBy = req.user.id;
    report.reportMeta.verifiedAt = Date.now();

    await report.save();

    // Audit Log
    createAuditLog({
      user: req.user._id,
      role: req.user.role,
      module: 'REPORTS',
      action: 'VERIFY',
      entityId: report._id,
      entityType: 'Report',
      description: `${req.user.name} verified report for ${report.patientInfo?.name || 'Unknown'}`,
      oldData: { status: oldStatus },
      newData: { status: 'verified' },
      req,
    });

    const populatedReport = await Report.findById(report._id).populate('verifiedBy', 'name email');

    res.status(200).json({
      success: true,
      data: populatedReport
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add comment to report
// @route   POST /api/reports/:id/comments
// @access  Private/Admin/Technician
exports.addComment = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    if (report.lab.toString() !== req.user.lab.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to comment on this report'
      });
    }

    const comment = {
      user: req.user.id,
      text: req.body.text,
      createdAt: Date.now()
    };

    report.comments = report.comments || [];
    report.comments.push(comment);

    report.reportMeta = report.reportMeta || {};
    report.reportMeta.lastModifiedAt = Date.now();
    report.reportMeta.lastModifiedBy = req.user.id;

    await report.save();

    const populatedReport = await Report.findById(report._id)
        .populate('comments.user', 'name email role');

    res.status(200).json({
      success: true,
      data: populatedReport
    });
  } catch (error) {
    next(error);
  }
};
// @desc    Resend WhatsApp notification for a report
// @route   POST /api/reports/:id/whatsapp/resend
// @access  Private/Admin/Technician
exports.resendWhatsApp = async (req, res, next) => {
  try {
    const Report = require('../models/Report');
    const Lab = require('../models/Lab');
    const Doctor = require('../models/Doctor');
    const Patient = require('../models/Patient');
    const WhatsAppSettings = require('../models/WhatsAppSettings');
    const whatsappService = require('../utils/whatsappService');
    const whatsappCreditService = require('../services/whatsappCreditService');

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    if (report.lab.toString() !== req.user.lab.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorised' });
    }

    const whatsAppSettings = await WhatsAppSettings.findOne({ lab: req.user.lab });
    if (!whatsAppSettings?.enabled) {
      return res.status(400).json({ success: false, message: 'WhatsApp notifications are disabled for this lab' });
    }
    if (!whatsappService.isConfigured()) {
      return res.status(500).json({ success: false, message: 'WhatsApp API is not configured on the server' });
    }

    const lab = await Lab.findById(req.user.lab);
    const baseUrl = process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`;
    const reportLink = `${baseUrl}/view-report/${report._id}`;
    const { target = 'patient' } = req.body; // 'patient' | 'doctor' | 'both'

    const results = { patient: null, doctor: null };

    // Resolve recipients first. One resend consumes ONE credit total,
    // covering both patient and doctor when target is 'both'.
    const wantPatient = target === 'patient' || target === 'both';
    const wantDoctor = target === 'doctor' || target === 'both';

    const patientPhone = report.patientInfo?.contact?.phone;
    let doctor = null;
    if (wantDoctor) {
      doctor = await Doctor.findOne({ name: report.testInfo?.referenceDoctor, lab: req.user.lab });
    }

    if (wantPatient && !patientPhone) {
      results.patient = { success: false, reason: 'No phone number on record' };
    }
    if (wantDoctor && !doctor?.phone) {
      results.doctor = { success: false, reason: 'Doctor phone not found' };
    }

    const canSendPatient = wantPatient && Boolean(patientPhone);
    const canSendDoctor = wantDoctor && Boolean(doctor?.phone);

    if (canSendPatient || canSendDoctor) {
      const credit = await whatsappCreditService.tryConsumeCredit({
        labId: req.user.lab,
        relatedReport: report._id,
        recipientType: 'report',
      });

      if (!credit.ok) {
        if (canSendPatient) results.patient = { success: false, reason: 'Insufficient WhatsApp credits' };
        if (canSendDoctor) results.doctor = { success: false, reason: 'Insufficient WhatsApp credits' };
      } else {
        let anySent = false;

        if (canSendPatient) {
          try {
            await whatsappService.sendReportNotification(
              patientPhone,
              report.patientInfo.name,
              reportLink,
              whatsAppSettings.patientTemplateName,
              whatsAppSettings.templateLanguage,
            );
            await Report.findByIdAndUpdate(report._id, {
              $set: {
                'reportMeta.deliveryStatus.whatsapp': { sent: true, sentAt: new Date(), recipient: patientPhone },
              },
            });
            results.patient = { success: true, recipient: patientPhone };
            anySent = true;
          } catch (sendErr) {
            results.patient = { success: false, reason: 'Send failed' };
            console.error('Patient WhatsApp resend failed:', sendErr?.response?.data || sendErr.message);
          }
        }

        if (canSendDoctor) {
          try {
            await whatsappService.sendDoctorNotification(
              doctor.phone,
              doctor.name,
              report.patientInfo.name,
              report.testInfo.name,
              reportLink,
              lab.name,
              whatsAppSettings.doctorTemplateName,
              whatsAppSettings.templateLanguage,
            );
            await Report.findByIdAndUpdate(report._id, {
              $set: {
                'reportMeta.deliveryStatus.whatsappDoctor': { sent: true, sentAt: new Date(), recipient: doctor.phone },
              },
            });
            results.doctor = { success: true, recipient: doctor.phone };
            anySent = true;
          } catch (sendErr) {
            results.doctor = { success: false, reason: 'Send failed' };
            console.error('Doctor WhatsApp resend failed:', sendErr?.response?.data || sendErr.message);
          }
        }

        // Refund the credit if no message actually went out.
        if (!anySent) {
          await whatsappCreditService.refundCredit({
            labId: req.user.lab,
            relatedReport: report._id,
            recipientType: 'report',
          });
        }
      }
    }

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};
