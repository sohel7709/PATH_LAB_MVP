const Report = require('../models/Report');
const Lab = require('../models/Lab');
const { createAuditLog } = require('../services/auditService');
const User = require('../models/User'); // Needed for population/modification tracking
const Doctor = require('../models/Doctor'); // Needed for doctor notification
const TestTemplate = require('../models/TestTemplate'); // Needed for populating template names
const WhatsAppSettings = require('../models/WhatsAppSettings'); // Needed for custom message template
const whatsappService = require('../utils/whatsappService');
const whatsappCreditService = require('../services/whatsappCreditService');
const { getAbnormalFlag } = require('../utils/reportUtils'); // Import from the new utility file

// @desc    Create new report
// @route   POST /api/technician/reports or /api/admin/reports
// @access  Private/Technician/Admin
exports.createReport = async (req, res, next) => {
  try {
    // Add lab and technician info to report
    req.body.lab = req.user.lab;
    req.body.technician = req.user.id;


    // Prepare data, ensuring results is an array and calculating flags
    let resultsWithFlags = (Array.isArray(req.body.results) ? req.body.results : []);

    // Populate templateName and referenceRange in resultsWithFlags from TestTemplate parameters
    const templateIds = [...new Set(resultsWithFlags.map(r => r.templateId).filter(id => id))];
    if (templateIds.length > 0) {
      const templates = await TestTemplate.find({ '_id': { $in: templateIds } }).select('templateName name sections');
      const templateMap = templates.reduce((map, t) => {
        map[t._id.toString()] = t;
        return map;
      }, {});
      resultsWithFlags = resultsWithFlags.map(result => {
        if (result.templateId) {
          const template = templateMap[result.templateId.toString()];
          if (template) {
            result.templateName = template.templateName || template.name || 'Unknown Test';
            // Find matching parameter in template sections to get normalRange
            let referenceRange = '';
            for (const section of template.sections || []) {
              if (section.parameters) {
                const param = section.parameters.find(p => p.name.toLowerCase() === (result.parameter || result.name || '').toLowerCase());
                if (param && param.referenceRange) {
                  referenceRange = param.referenceRange;
                  break;
                }
              }
            }
            if (referenceRange) {
              result.referenceRange = referenceRange;
            }
          }
        }
        return result;
      });
    }

    const reportDataToCreate = {
      ...req.body, // Include all other fields from the request body
      results: resultsWithFlags.map(result => ({
        ...result,
        flag: getAbnormalFlag(result.value, result.referenceRange, req.body.patientInfo?.gender)
      })), // Calculate flags after adding referenceRange
      templateNotes: req.body.templateNotes || {}, // Get template notes object
      testNotes: req.body.testNotes || '', // Get general notes
      lab: req.user.lab,
      technician: req.user.id,
      reportMeta: {
        generatedAt: new Date(),
        version: 1
      }
    };

    // // Compute hideTableHeadingAndReference flag - REMOVED LOGIC - Default false from schema will be used
    // const testsToHideTableHeadingAndReference = [
    //   'blood group',
    //   'serum for hiv i & ii test',
    //   'c-reactive protein (crp)',
    //   'rapid malaria test',
    //   'urine examination report',
    //   'dengue test report',
    //   'rheumatoid arthritis factor test',
    //   'typhi dot test',
    //   'troponin-i test',
    //   'vdrl test'
    // ];
    // const templateNamesLower = (resultsWithFlags || []).map(r => (r.templateName || '').toLowerCase());
    // const hideTableHeadingAndReference = templateNamesLower.some(name => testsToHideTableHeadingAndReference.includes(name));
    // reportDataToCreate.hideTableHeadingAndReference = hideTableHeadingAndReference; // Let schema default handle this

    // Remove fields that might have been sent but aren't directly part of the top-level schema
    delete reportDataToCreate.patientName;
    delete reportDataToCreate.patientAge;
    // ... potentially others if the frontend sends redundant data


    const report = await Report.create(reportDataToCreate);

    // Audit Log
    createAuditLog({
      user: req.user._id,
      role: req.user.role,
      module: 'REPORTS',
      action: 'CREATE',
      entityId: report._id,
      entityType: 'Report',
      description: `${req.user.name} created report for ${report.patientInfo?.name || 'Unknown'} — ${report.testInfo?.name || 'Test'}`,
      newData: { patientName: report.patientInfo?.name, testName: report.testInfo?.name },
      req,
    });

    // Update lab statistics and totalReportsCreated counter
    await Lab.findByIdAndUpdate(req.user.lab, {
      $inc: { 'stats.totalReports': 1, 'totalReportsCreated': 1 },
      $set: { 'stats.lastReportDate': Date.now() }
    });

    res.status(201).json({
      success: true,
      data: report // Send the initially created report data
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Get all reports for a lab
// @route   GET /api/admin/reports or /api/technician/reports
// @access  Private/Admin/Technician
exports.getReports = async (req, res, next) => {
  try {
    let query = { lab: req.user.lab };

    // Add filters from query parameters
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.patientId) {
      query['patientInfo.patientId'] = req.query.patientId;
    }
    if (req.query.testName) {
      query['testInfo.name'] = new RegExp(req.query.testName, 'i');
    }

    // Add date range filter
    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }


    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;


    const total = await Report.countDocuments(query);

    const reports = await Report.find(query)
      .populate({
        path: 'technician',
        select: 'name email'
      })
      .populate({
        path: 'verifiedBy',
        select: 'name email'
      })
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: reports.length,
      pagination,
      data: reports
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single report
// @route   GET /api/admin/reports/:id or /api/technician/reports/:id
// @access  Private/Admin/Technician
exports.getReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate({
        path: 'technician',
        select: 'name email'
      })
      .populate({
        path: 'verifiedBy',
        select: 'name email'
      });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check if user has access to this report
    if (report.lab.toString() !== req.user.lab.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this report'
      });
    }

    // Log the raw Mongoose document before conversion
    // Specifically log the templateNotes field from the raw document


    // Convert Mongoose document to a plain JavaScript object
    let reportObject = report.toObject();

    // --- Explicitly convert templateNotes Map to Object ---
    // (Even though schema transform should do this, let's be certain)
    if (reportObject.templateNotes instanceof Map) {
        reportObject.templateNotes = Object.fromEntries(reportObject.templateNotes);
    } else {
    }
    // --- End explicit conversion ---


    // --- Populate Test Template Names ---
    if (reportObject.results && reportObject.results.length > 0) {
      const templateIds = [...new Set(reportObject.results.map(r => r.templateId).filter(id => id))];
      if (templateIds.length > 0) {
        const templates = await TestTemplate.find({ '_id': { $in: templateIds } }).select('templateName name');
        const templateMap = templates.reduce((map, t) => {
          map[t._id.toString()] = t.templateName || t.name;
          return map;
        }, {});
        reportObject.results = reportObject.results.map(result => {
          if (result.templateId) {
            result.templateName = templateMap[result.templateId.toString()] || 'Unknown Test';
          }
          return result;
        });
      }
    }
    // --- End Populate Test Template Names ---

    res.status(200).json({
      success: true,
      data: reportObject
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update report
// @route   PUT /api/technician/reports/:id
// @access  Private/Technician
exports.updateReport = async (req, res, next) => {
  try {
    let report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    if (report.lab.toString() !== req.user.lab.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this report' });
    }
    if (!report.isModifiable()) {
      return res.status(400).json({ success: false, message: 'Report cannot be modified in its current status' });
    }


    // Prepare update data, starting with allowed fields from req.body
    let updateData = {
        // Only include fields that are expected and allowed to be updated
        ...(req.body.patientInfo && { patientInfo: req.body.patientInfo }),
        ...(req.body.testInfo && { testInfo: req.body.testInfo }),
        ...(req.body.templateNotes && { templateNotes: req.body.templateNotes }), // Update template notes if provided
        testNotes: req.body.testNotes !== undefined ? req.body.testNotes : report.testNotes, // Update general notes if provided
        status: req.body.status || report.status, // Update status if provided
        // Ensure lab and technician are not changed
        lab: report.lab,
        technician: report.technician,
        // Update metadata
        reportMeta: {
            ...report.reportMeta,
            lastModifiedAt: Date.now(),
            lastModifiedBy: req.user.id,
            version: (report.reportMeta?.version || 1) + 1
        }
    };

    // Populate templateName and referenceRange in req.body.results from TestTemplate parameters
    if (Array.isArray(req.body.results)) {
      const templateIds = [...new Set(req.body.results.map(r => r.templateId).filter(id => id))];
      if (templateIds.length > 0) {
        const templates = await TestTemplate.find({ '_id': { $in: templateIds } }).select('templateName name sections');
        const templateMap = templates.reduce((map, t) => {
          map[t._id.toString()] = t;
          return map;
        }, {});
        req.body.results = req.body.results.map(result => {
          if (result.templateId) {
            const template = templateMap[result.templateId.toString()];
            if (template) {
              result.templateName = template.templateName || template.name || 'Unknown Test';
              // Find matching parameter in template sections to get normalRange
              let referenceRange = '';
              for (const section of template.sections || []) {
                if (section.parameters) {
                  const param = section.parameters.find(p => p.name.toLowerCase() === (result.parameter || result.name || '').toLowerCase());
                  if (param && param.referenceRange) {
                    referenceRange = param.referenceRange;
                    break;
                  }
                }
              }
              if (referenceRange) {
                result.referenceRange = referenceRange;
              }
            }
          }
          return result;
        });
      }
    }

    // // Compute hideTableHeadingAndReference flag - REMOVED LOGIC - Default false from schema will be used
    // const testsToHideTableHeadingAndReference = [
    //   'blood group',
    //   'serum for hiv i & ii test',
    //   'c-reactive protein (crp)',
    //   'rapid malaria test',
    //   'urine examination report',
    //   'dengue test report',
    //   'rheumatoid arthritis factor test',
    //   'typhi dot test',
    //   'troponin-i test',
    //   'vdrl test'
    // ];
    // const templateNamesLower = (req.body.results || []).map(r => (r.templateName || '').toLowerCase());
    // const hideTableHeadingAndReference = templateNamesLower.some(name => testsToHideTableHeadingAndReference.includes(name));
    // updateData.hideTableHeadingAndReference = hideTableHeadingAndReference; // Let schema default handle this

    // Handle 'results' update separately to ensure flags are recalculated and referenceRange is set
    if (Array.isArray(req.body.results)) {
      const templateIds = [...new Set(req.body.results.map(r => r.templateId).filter(id => id))];
      if (templateIds.length > 0) {
        const templates = await TestTemplate.find({ '_id': { $in: templateIds } }).select('templateName name sections');
        const templateMap = templates.reduce((map, t) => {
          map[t._id.toString()] = t;
          return map;
        }, {});
        req.body.results = req.body.results.map(result => {
          if (result.templateId) {
            const template = templateMap[result.templateId.toString()];
            if (template) {
              result.templateName = template.templateName || template.name || 'Unknown Test';
              // Find matching parameter in template sections to get referenceRange
              let refRangeFromTemplate = ''; // Changed variable name for clarity
              for (const section of template.sections || []) {
                if (section.parameters) {
                  const param = section.parameters.find(p => p.name.toLowerCase() === (result.parameter || result.name || '').toLowerCase());
                  if (param && param.referenceRange) { // Corrected to check param.referenceRange
                    refRangeFromTemplate = param.referenceRange;
                    break;
                  }
                }
              }
              if (refRangeFromTemplate) {
                result.referenceRange = refRangeFromTemplate; // Corrected to assign from refRangeFromTemplate
              }
            }
          }
          return result;
        });
      }
      const patientGenderForFlags = updateData.patientInfo?.gender || report.patientInfo?.gender;
      updateData.results = req.body.results.map(result => ({
        ...result,
        flag: getAbnormalFlag(result.value, result.referenceRange, patientGenderForFlags)
      }));
    } else {
      // If results are not in the request, keep the existing ones but still recalculate flags
      // First, ensure referenceRange is populated for existing results
      const existingResults = report.results || [];
      const templateIds = [...new Set(existingResults.map(r => r.templateId).filter(id => id))];
      let resultsWithPopulatedRefRange = existingResults;

      if (templateIds.length > 0) {
        const templates = await TestTemplate.find({ '_id': { $in: templateIds } }).select('templateName name sections');
        const templateMap = templates.reduce((map, t) => {
          map[t._id.toString()] = t;
          return map;
        }, {});
        resultsWithPopulatedRefRange = existingResults.map(result => {
          if (result.templateId) {
            const template = templateMap[result.templateId.toString()];
            if (template) {
              // Find matching parameter in template sections to get referenceRange
              let refRangeFromTemplate = '';
              for (const section of template.sections || []) {
                if (section.parameters) {
                  const param = section.parameters.find(p => p.name.toLowerCase() === (result.parameter || result.name || '').toLowerCase());
                  if (param && param.referenceRange) {
                    refRangeFromTemplate = param.referenceRange;
                    break;
                  }
                }
              }
              if (refRangeFromTemplate) {
                result.referenceRange = refRangeFromTemplate;
              }
            }
          }
          return result;
        });
      }

      // Now recalculate flags with potentially updated reference ranges
      const patientGenderForFlags = updateData.patientInfo?.gender || report.patientInfo?.gender;
      updateData.results = resultsWithPopulatedRefRange.map(result => ({
        ...result, // Keep existing data
        flag: getAbnormalFlag(result.value, result.referenceRange, patientGenderForFlags) // Recalculate flag
      }));
    }




    const oldReportData = {
      patientName: report.patientInfo?.name,
      testName: report.testInfo?.name,
      status: report.status,
    };

    const updatedReport = await Report.findByIdAndUpdate(req.params.id, updateData, {
      new: true, // Return the modified document
      runValidators: true // Ensure schema validation runs
    });

    if (!updatedReport) {
         // Should not happen if findById found it earlier, but good practice
         return res.status(404).json({ success: false, message: 'Report not found after update attempt.' });
    }

    // Audit Log
    const statusChanged = req.body.status && req.body.status !== oldReportData.status;
    createAuditLog({
      user: req.user._id,
      role: req.user.role,
      module: 'REPORTS',
      action: statusChanged ? 'STATUS_CHANGE' : 'UPDATE',
      entityId: updatedReport._id,
      entityType: 'Report',
      description: statusChanged
        ? `${req.user.name} changed report status: ${oldReportData.status} → ${req.body.status} for ${updatedReport.patientInfo?.name || 'Unknown'}`
        : `${req.user.name} updated report for ${updatedReport.patientInfo?.name || 'Unknown'}`,
      oldData: oldReportData,
      newData: { patientName: updatedReport.patientInfo?.name, testName: updatedReport.testInfo?.name, status: updatedReport.status },
      req,
    });

    // WhatsApp — fire when status changes to 'completed', then auto-set to 'delivered'
    if (statusChanged && req.body.status === 'completed') {
      try {
        const whatsAppSettings = await WhatsAppSettings.findOne({ lab: req.user.lab });
        const isEnabled = whatsAppSettings?.enabled === true;

        if (isEnabled && whatsappService.isConfigured()) {
          const lab = await Lab.findById(req.user.lab);
          const baseUrl = process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`;
          const reportLink = `${baseUrl}/view-report/${updatedReport._id}`;
          const deliveryStatus = {};

          const patientPhone = updatedReport.patientInfo?.contact?.phone;
          const shouldNotifyPatient = whatsAppSettings.sendToPatientOnReportComplete !== false;
          const shouldNotifyDoctor = whatsAppSettings.sendToDoctorOnReportComplete === true;

          let doctor = null;
          if (shouldNotifyDoctor && updatedReport.testInfo?.referenceDoctor) {
            doctor = await Doctor.findOne({ name: updatedReport.testInfo.referenceDoctor, lab: req.user.lab });
          }

          const willNotifyPatient = shouldNotifyPatient && Boolean(patientPhone);
          const willNotifyDoctor = Boolean(doctor?.phone);
          let patientWASent = false;

          if (willNotifyPatient || willNotifyDoctor) {
            const credit = await whatsappCreditService.tryConsumeCredit({
              labId: req.user.lab,
              relatedReport: updatedReport._id,
              recipientType: 'report',
            });

            if (!credit.ok) {
              if (willNotifyPatient) deliveryStatus.whatsapp = { sent: false, reason: 'insufficient_credits' };
              if (willNotifyDoctor) deliveryStatus.whatsappDoctor = { sent: false, reason: 'insufficient_credits' };
            } else {
              let anySent = false;

              if (willNotifyPatient) {
                try {
                  await whatsappService.sendReportNotification(
                    patientPhone,
                    updatedReport.patientInfo.name,
                    reportLink,
                    whatsAppSettings.patientTemplateName,
                    whatsAppSettings.templateLanguage,
                  );
                  deliveryStatus.whatsapp = { sent: true, sentAt: new Date(), recipient: patientPhone };
                  patientWASent = true;
                  anySent = true;
                } catch (sendErr) {
                  deliveryStatus.whatsapp = { sent: false, reason: 'send_failed' };
                  console.error('Patient WhatsApp send failed:', sendErr?.response?.data || sendErr.message);
                }
              }

              if (willNotifyDoctor) {
                try {
                  await whatsappService.sendDoctorNotification(
                    doctor.phone,
                    doctor.name,
                    updatedReport.patientInfo.name,
                    updatedReport.testInfo.name,
                    reportLink,
                    lab.name,
                    whatsAppSettings.doctorTemplateName,
                    whatsAppSettings.templateLanguage,
                  );
                  deliveryStatus.whatsappDoctor = { sent: true, sentAt: new Date(), recipient: doctor.phone };
                  anySent = true;
                } catch (sendErr) {
                  deliveryStatus.whatsappDoctor = { sent: false, reason: 'send_failed' };
                  console.error('Doctor WhatsApp send failed:', sendErr?.response?.data || sendErr.message);
                }
              }

              if (!anySent) {
                await whatsappCreditService.refundCredit({
                  labId: req.user.lab,
                  relatedReport: updatedReport._id,
                  recipientType: 'report',
                });
              }
            }
          }

          // Build the DB update — delivery status fields + auto-set 'delivered' if patient WA sent
          const dbSet = Object.fromEntries(
            Object.entries(deliveryStatus).map(([k, v]) => [`reportMeta.deliveryStatus.${k}`, v])
          );
          if (patientWASent) {
            dbSet.status = 'delivered';
            updatedReport.status = 'delivered';
          }

          if (Object.keys(dbSet).length > 0) {
            await Report.findByIdAndUpdate(updatedReport._id, { $set: dbSet });
          }
        }
      } catch (waError) {
        console.error('WhatsApp on complete error:', waError?.response?.data || waError.message);
      }
    }

    // Google Review WhatsApp — fire when status changes to 'delivered'
    if (statusChanged && req.body.status === 'delivered') {
      try {
        const whatsAppSettings = await WhatsAppSettings.findOne({ lab: req.user.lab });
        const shouldSend = whatsAppSettings?.enabled &&
          whatsAppSettings?.sendGoogleReviewOnDelivery &&
          whatsAppSettings?.googleReviewUrl &&
          whatsappService.isConfigured();

        if (shouldSend) {
          const patientPhone = updatedReport.patientInfo?.contact?.phone;
          if (patientPhone) {
            const credit = await whatsappCreditService.tryConsumeCredit({
              labId: req.user.lab,
              relatedReport: updatedReport._id,
              recipientType: 'review',
            });
            if (credit.ok) {
              try {
                const lab = await Lab.findById(req.user.lab);
                await whatsappService.sendGoogleReviewRequest(
                  patientPhone,
                  updatedReport.patientInfo.name,
                  lab?.name || '',
                  whatsAppSettings.googleReviewUrl,
                  whatsAppSettings.googleReviewTemplateName,
                  whatsAppSettings.templateLanguage,
                );
              } catch (sendErr) {
                await whatsappCreditService.refundCredit({
                  labId: req.user.lab,
                  relatedReport: updatedReport._id,
                  recipientType: 'review',
                });
                throw sendErr;
              }
            }
          }
        }
      } catch (reviewError) {
        console.error('Google Review WhatsApp error:', reviewError?.response?.data || reviewError.message);
      }
    }

    res.status(200).json({
      success: true,
      data: updatedReport // Send the updated report data
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Delete report
// @route   DELETE /api/admin/reports/:id
// @access  Private/Admin
exports.deleteReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check if user has access to delete this report
    if (report.lab.toString() !== req.user.lab.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this report'
      });
    }

    const reportData = {
      patientName: report.patientInfo?.name,
      testName: report.testInfo?.name,
    };

    await Report.findByIdAndDelete(report._id);

    // Audit Log
    createAuditLog({
      user: req.user._id,
      role: req.user.role,
      module: 'REPORTS',
      action: 'DELETE',
      entityId: req.params.id,
      entityType: 'Report',
      description: `${req.user.name} deleted report for ${reportData.patientName || 'Unknown'}`,
      oldData: reportData,
      req,
    });

    // Update lab statistics
    await Lab.findByIdAndUpdate(req.user.lab, {
      $inc: { 'stats.totalReports': -1 }
    });

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
