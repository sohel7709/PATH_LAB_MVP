const Report = require('../models/Report');
const Lab = require('../models/Lab');
const User = require('../models/User'); // Needed for population/modification tracking
const Doctor = require('../models/Doctor'); // Needed for doctor notification
const TestTemplate = require('../models/TestTemplate'); // Needed for populating template names
const whatsappService = require('../utils/whatsappService');
const { getAbnormalFlag } = require('../utils/reportUtils'); // Import from the new utility file

// @desc    Create new report
// @route   POST /api/technician/reports or /api/admin/reports
// @access  Private/Technician/Admin
exports.createReport = async (req, res, next) => {
  try {
    // Add lab and technician info to report
    req.body.lab = req.user.lab;
    req.body.technician = req.user.id;

    console.log('--- Attempting to Create Report ---');
    console.log('Received Request Body:', JSON.stringify(req.body, null, 2));

    // Prepare data, ensuring results is an array and calculating flags
    let resultsWithFlags = (Array.isArray(req.body.results) ? req.body.results : []).map(result => ({
      ...result,
      flag: getAbnormalFlag(result.value, result.referenceRange, req.body.patientInfo?.gender)
    }));

    // Populate templateName in resultsWithFlags
    const templateIds = [...new Set(resultsWithFlags.map(r => r.templateId).filter(id => id))];
    if (templateIds.length > 0) {
      const templates = await TestTemplate.find({ '_id': { $in: templateIds } }).select('templateName name');
      const templateMap = templates.reduce((map, t) => {
        map[t._id.toString()] = t.templateName || t.name;
        return map;
      }, {});
      resultsWithFlags = resultsWithFlags.map(result => {
        if (result.templateId) {
          result.templateName = templateMap[result.templateId.toString()] || 'Unknown Test';
        }
        return result;
      });
    }

    const reportDataToCreate = {
      ...req.body, // Include all other fields from the request body
      results: resultsWithFlags, // Use results with calculated flags
      templateNotes: req.body.templateNotes || {}, // Get template notes object
      testNotes: req.body.testNotes || '', // Get general notes
      lab: req.user.lab,
      technician: req.user.id,
      reportMeta: {
        generatedAt: new Date(),
        version: 1
      }
    };

    // Compute hideTableHeadingAndReference flag
    const testsToHideTableHeadingAndReference = [
      'blood group',
      'serum for hiv i & ii test',
      'c-reactive protein (crp)',
      'rapid malaria test',
      'urine examination report',
      'dengue test report',
      'rheumatoid arthritis factor test',
      'typhi dot test',
      'troponin-i test',
      'vdrl test'
    ];
    const templateNamesLower = (resultsWithFlags || []).map(r => (r.templateName || '').toLowerCase());
    const hideTableHeadingAndReference = templateNamesLower.some(name => testsToHideTableHeadingAndReference.includes(name));
    reportDataToCreate.hideTableHeadingAndReference = hideTableHeadingAndReference;

    // Remove fields that might have been sent but aren't directly part of the top-level schema
    delete reportDataToCreate.patientName;
    delete reportDataToCreate.patientAge;
    // ... potentially others if the frontend sends redundant data

    console.log('--- Data before Report.create ---'); // LOG BEFORE CREATE
    console.log('Template Notes:', JSON.stringify(reportDataToCreate.templateNotes)); // LOG templateNotes specifically
    console.log('Full Data:', JSON.stringify(reportDataToCreate, null, 2)); // Log full data
    console.log('---------------------------------');

    const report = await Report.create(reportDataToCreate);

    // Update lab statistics
    await Lab.findByIdAndUpdate(req.user.lab, {
      $inc: { 'stats.totalReports': 1 },
      $set: { 'stats.lastReportDate': Date.now() }
    });

    // Get lab details for notification
    const lab = await Lab.findById(req.user.lab);

    // Send WhatsApp notification logic...
    try {
      if (report.patientInfo && report.patientInfo.contact && report.patientInfo.contact.phone) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const reportLink = `${baseUrl}/reports/view/${report._id}`;
        await whatsappService.sendReportNotification(
          report.patientInfo.contact.phone,
          report.patientInfo.name,
          report.testInfo.name,
          reportLink,
          lab.name
        );
        // Update delivery status (needs report object after creation)
        const createdReport = await Report.findById(report._id); // Re-fetch to update
        if (createdReport) {
            createdReport.reportMeta.deliveryStatus = {
                ...(createdReport.reportMeta.deliveryStatus || {}),
                whatsapp: {
                    sent: true,
                    sentAt: Date.now(),
                    recipient: report.patientInfo.contact.phone
                }
            };
            await createdReport.save();
            console.log('WhatsApp notification sent to patient and status updated.');
        }
      }
      if (report.testInfo && report.testInfo.referenceDoctor) {
        const doctor = await Doctor.findOne({ name: report.testInfo.referenceDoctor, lab: req.user.lab });
        if (doctor && doctor.phone) {
          const baseUrl = `${req.protocol}://${req.get('host')}`;
          const reportLink = `${baseUrl}/reports/view/${report._id}`;
          await whatsappService.sendDoctorNotification(
            doctor.phone, doctor.name, report.patientInfo.name, report.testInfo.name, reportLink, lab.name
          );
          console.log('WhatsApp notification sent to doctor.');
        }
      }
    } catch (notificationError) {
      console.error('Error sending WhatsApp notification:', notificationError);
    }

    res.status(201).json({
      success: true,
      data: report // Send the initially created report data
    });
  } catch (error) {
    console.error('Error creating report:', error);
    next(error);
  }
};


// @desc    Get all reports for a lab
// @route   GET /api/admin/reports or /api/technician/reports
// @access  Private/Admin/Technician
exports.getReports = async (req, res, next) => {
  try {
    let query = { lab: req.user.lab };
    console.log(`[getReports] Initial query for lab ${req.user.lab}:`, JSON.stringify(query)); // Log initial query

    // Add filters from query parameters
    if (req.query.status) {
      query.status = req.query.status;
      console.log(`[getReports] Added status filter: ${query.status}`);
    }
    if (req.query.patientId) {
      query['patientInfo.patientId'] = req.query.patientId;
      console.log(`[getReports] Added patientId filter: ${query['patientInfo.patientId']}`);
    }
    if (req.query.testName) {
      query['testInfo.name'] = new RegExp(req.query.testName, 'i');
      console.log(`[getReports] Added testName filter (regex): ${req.query.testName}`);
    }

    // Add date range filter
    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
      console.log(`[getReports] Added date range filter: ${JSON.stringify(query.createdAt)}`);
    }

    console.log(`[getReports] Final query object:`, JSON.stringify(query)); // Log final query

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    console.log(`[getReports] Pagination: page=${page}, limit=${limit}, startIndex=${startIndex}`); // Log pagination

    console.log('[getReports] Attempting to count documents...'); // Log before count
    const total = await Report.countDocuments(query);
    console.log(`[getReports] Document count successful: total=${total}`); // Log after count

    console.log('[getReports] Attempting to find documents...'); // Log before find
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
    console.log(`[getReports] Find documents successful: found ${reports.length} reports`); // Log after find

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

    console.log('[getReports] Sending successful response.'); // Log before sending response
    res.status(200).json({
      success: true,
      count: reports.length,
      pagination,
      data: reports
    });
  } catch (error) {
    console.error('[getReports] Error occurred:', error); // Log the specific error
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
    console.log('[getReport] Raw report document fetched:', report);
    // Specifically log the templateNotes field from the raw document
    console.log('[getReport] Raw report.templateNotes:', report.templateNotes);


    // Convert Mongoose document to a plain JavaScript object
    let reportObject = report.toObject();

    // --- Explicitly convert templateNotes Map to Object ---
    // (Even though schema transform should do this, let's be certain)
    if (reportObject.templateNotes instanceof Map) {
        console.log('[getReport] templateNotes is a Map, converting to object...');
        reportObject.templateNotes = Object.fromEntries(reportObject.templateNotes);
    } else {
         console.log('[getReport] templateNotes is already an object or null/undefined:', reportObject.templateNotes);
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

    console.log('[getReport] Sending reportObject:', JSON.stringify(reportObject, null, 2)); // Log the object being sent
    res.status(200).json({
      success: true,
      data: reportObject
    });
  } catch (error) {
    console.error('[getReport] Error occurred:', error); // Log the specific error
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

    console.log('Update report request body:', req.body);

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

    // Populate templateName in results if results are provided
    if (Array.isArray(req.body.results)) {
      const templateIds = [...new Set(req.body.results.map(r => r.templateId).filter(id => id))];
      if (templateIds.length > 0) {
        const templates = await TestTemplate.find({ '_id': { $in: templateIds } }).select('templateName name');
        const templateMap = templates.reduce((map, t) => {
          map[t._id.toString()] = t.templateName || t.name;
          return map;
        }, {});
        req.body.results = req.body.results.map(result => {
          if (result.templateId) {
            result.templateName = templateMap[result.templateId.toString()] || 'Unknown Test';
          }
          return result;
        });
      }
    }

    // Compute hideTableHeadingAndReference flag
    const testsToHideTableHeadingAndReference = [
      'blood group',
      'serum for hiv i & ii test',
      'c-reactive protein (crp)',
      'rapid malaria test',
      'urine examination report',
      'dengue test report',
      'rheumatoid arthritis factor test',
      'typhi dot test',
      'troponin-i test',
      'vdrl test'
    ];
    const templateNamesLower = (req.body.results || []).map(r => (r.templateName || '').toLowerCase());
    const hideTableHeadingAndReference = templateNamesLower.some(name => testsToHideTableHeadingAndReference.includes(name));
    updateData.hideTableHeadingAndReference = hideTableHeadingAndReference;

    // Handle 'results' update separately to ensure flags are recalculated
    if (Array.isArray(req.body.results)) {
        const patientGenderForFlags = updateData.patientInfo?.gender || report.patientInfo?.gender;
        updateData.results = req.body.results.map(result => ({
            ...result,
            flag: getAbnormalFlag(result.value, result.referenceRange, patientGenderForFlags)
        }));
    } else {
        // If results are not in the request, keep the existing ones but still recalculate flags
        const patientGenderForFlags = updateData.patientInfo?.gender || report.patientInfo?.gender;
        updateData.results = (report.results || []).map(result => ({
            ...result, // Keep existing data
            flag: getAbnormalFlag(result.value, result.referenceRange, patientGenderForFlags) // Recalculate flag
        }));
    }


    console.log('--- Data before Report.findByIdAndUpdate ---'); // LOG BEFORE UPDATE
    console.log('Template Notes:', JSON.stringify(updateData.templateNotes)); // LOG templateNotes specifically
    console.log('Full Data:', JSON.stringify(updateData, null, 2)); // Log full data
    console.log('------------------------------------------');


    const updatedReport = await Report.findByIdAndUpdate(req.params.id, updateData, {
      new: true, // Return the modified document
      runValidators: true // Ensure schema validation runs
    });

    if (!updatedReport) {
         // Should not happen if findById found it earlier, but good practice
         return res.status(404).json({ success: false, message: 'Report not found after update attempt.' });
    }

    res.status(200).json({
      success: true,
      data: updatedReport // Send the updated report data
    });
  } catch (error) {
    console.error('Error updating report:', error);
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

    await Report.findByIdAndDelete(report._id);

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
