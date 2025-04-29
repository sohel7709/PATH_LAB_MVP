 const Report = require('../models/Report');
const Lab = require('../models/Lab');
const User = require('../models/User');
const LabReportSettings = require('../models/LabReportSettings');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const TestTemplate = require('../models/TestTemplate'); // Import TestTemplate model
const whatsappService = require('../utils/whatsappService');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

// @desc    Create new report
// @route   POST /api/technician/reports or /api/admin/reports
// @access  Private/Technician/Admin
exports.createReport = async (req, res, next) => {
  try {
    // Add lab and technician info to report
    req.body.lab = req.user.lab;
    req.body.technician = req.user.id;

    // Enhanced logging before attempting to create the report
    console.log('--- Attempting to Create Report ---');
    console.log('User Lab ID:', req.user.lab);
    console.log('User Technician ID:', req.user.id);
    console.log('Received Request Body:', JSON.stringify(req.body, null, 2));
    console.log('-----------------------------------');

    const report = await Report.create(req.body);

    // Update lab statistics
    await Lab.findByIdAndUpdate(req.user.lab, {
      $inc: { 'stats.totalReports': 1 },
      $set: { 'stats.lastReportDate': Date.now() }
    });

    // Get lab details for notification
    const lab = await Lab.findById(req.user.lab);
    
    // Send WhatsApp notification if patient phone is available
    try {
      if (report.patientInfo && report.patientInfo.contact && report.patientInfo.contact.phone) {
        // Get the base URL for the report link
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const reportLink = `${baseUrl}/reports/view/${report._id}`;
        
        // Send WhatsApp notification to patient
        await whatsappService.sendReportNotification(
          report.patientInfo.contact.phone,
          report.patientInfo.name,
          report.testInfo.name,
          reportLink,
          lab.name
        );
        
        // Update report delivery status
        report.reportMeta.deliveryStatus.whatsapp = {
          sent: true,
          sentAt: Date.now(),
          recipient: report.patientInfo.contact.phone
        };
        
        await report.save();
        console.log('WhatsApp notification sent to patient');
      }
      
      // If there's a referring doctor, send notification to them as well
      if (report.testInfo && report.testInfo.referenceDoctor) {
        // Try to find the doctor in the database
        const doctor = await Doctor.findOne({ 
          name: report.testInfo.referenceDoctor,
          lab: req.user.lab
        });
        
        if (doctor && doctor.phone) {
          // Get the base URL for the report link
          const baseUrl = `${req.protocol}://${req.get('host')}`;
          const reportLink = `${baseUrl}/reports/view/${report._id}`;
          
          // Send WhatsApp notification to doctor
          await whatsappService.sendDoctorNotification(
            doctor.phone,
            doctor.name,
            report.patientInfo.name,
            report.testInfo.name,
            reportLink,
            lab.name
          );
          
          console.log('WhatsApp notification sent to doctor');
        }
      }
    } catch (notificationError) {
      // Log the error but don't fail the report creation
      console.error('Error sending WhatsApp notification:', notificationError);
    }

    res.status(201).json({
      success: true,
      data: report
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

    // Convert Mongoose document to a plain JavaScript object
    let reportObject = report.toObject();

    // --- Populate Test Template Names ---
    if (reportObject.results && reportObject.results.length > 0) {
      const templateIds = [...new Set(reportObject.results.map(r => r.templateId).filter(id => id))]; // Get unique template IDs from plain object

      if (templateIds.length > 0) {
        const templates = await TestTemplate.find({ '_id': { $in: templateIds } }).select('templateName name'); // Fetch relevant templates
        const templateMap = templates.reduce((map, t) => {
          map[t._id.toString()] = t.templateName || t.name; // Create a map ID -> Name
          return map;
        }, {});

        // Modify the results array within the plain object
        reportObject.results = reportObject.results.map(result => {
          if (result.templateId) {
            // No need for .toObject() here as it's already a plain object
            result.templateName = templateMap[result.templateId.toString()] || 'Unknown Test';
          }
          return result; // Return the potentially modified result object
        });
      }
    }
    // --- End Populate Test Template Names ---


    res.status(200).json({
      success: true,
      data: reportObject // Send the modified plain object
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
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check if user has access to update this report
    if (report.lab.toString() !== req.user.lab.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this report'
      });
    }

    // Check if report is modifiable
    if (!report.isModifiable()) {
      return res.status(400).json({
        success: false,
        message: 'Report cannot be modified in its current status'
      });
    }

    // Log the incoming data for debugging
    console.log('Update report request body:', req.body);

    // Preserve existing data that shouldn't be overwritten
    const updateData = {
      ...req.body,
      lab: report.lab, // Ensure lab cannot be changed
      technician: report.technician, // Ensure technician cannot be changed
      
      // Make sure patientInfo is properly updated
      patientInfo: req.body.patientInfo ? {
        ...report.patientInfo, // Keep existing data
        ...req.body.patientInfo, // Override with new data
        patientId: req.body.patientInfo?.patientId || report.patientInfo?.patientId // Preserve ID
      } : report.patientInfo,
      
      // Make sure testInfo is properly updated
      testInfo: req.body.testInfo ? {
        ...report.testInfo, // Keep existing data
        ...req.body.testInfo, // Override with new data
        sampleId: req.body.testInfo?.sampleId || report.testInfo?.sampleId // Preserve ID
      } : report.testInfo,
      
      // Update report metadata
      reportMeta: {
        ...report.reportMeta,
        lastModifiedAt: Date.now(),
        lastModifiedBy: req.user.id,
        version: (report.reportMeta?.version || 1) + 1
      }
    };
    
    // Log the update data for debugging
    console.log('Updating report with data:', JSON.stringify(updateData, null, 2));

    report = await Report.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: report
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

    // Check if user has access to verify this report
    if (report.lab.toString() !== req.user.lab.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to verify this report'
      });
    }

    report.status = 'verified';
    report.verifiedBy = req.user.id;
    report.reportMeta.lastModifiedAt = Date.now();
    report.reportMeta.lastModifiedBy = req.user.id;

    await report.save();

    res.status(200).json({
      success: true,
      data: report
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

    // Check if user has access to this report
    if (report.lab.toString() !== req.user.lab.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to comment on this report'
      });
    }

    const comment = {
      user: req.user.id,
      text: req.body.text
    };

    report.comments.push(comment);
    await report.save();

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate HTML report
// @route   GET /api/reports/:id/html
// @access  Private/Admin/Technician
exports.generateHtmlReport = async (req, res, next) => {
  try {
    // Get the showHeader and showFooter query parameters (default to true if not provided)
    const showHeader = req.query.showHeader !== 'false';
    const showFooter = req.query.showFooter !== 'false';
    
    console.log(`Report generation options - Show Header: ${showHeader}, Show Footer: ${showFooter}`);
    
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

    // Get lab report settings
    const labReportSettings = await LabReportSettings.findOne({ lab: report.lab });
    
    // Get lab details
    const lab = await Lab.findById(report.lab);
    if (!lab) {
      return res.status(404).json({
        success: false,
        message: 'Lab not found'
      });
    }

    // Read the black-only HTML template
    const reportTemplatePath = path.join(__dirname, '..', 'black-only-report.html');
    let templateSource;
    try {
      templateSource = fs.readFileSync(reportTemplatePath, 'utf8');
      console.log('Black-only template loaded successfully for HTML view');
    } catch (err) {
      console.error('Error reading template file:', err);
      return res.status(500).json({
        success: false,
        message: 'Error reading report template'
      });
    }
    
    // Compile the template
    let template;
    try {
      template = handlebars.compile(templateSource);
      console.log('Template compiled successfully');
    } catch (err) {
      console.error('Error compiling template:', err);
      return res.status(500).json({
        success: false,
        message: 'Error compiling report template'
      });
    }
    
    // Process test results to include abnormal flag
    const testResults = [];
    if (report.results && report.results.length > 0) {
      report.results.forEach(param => {
        const result = {
          name: param.parameter,
          result: param.value,
          unit: param.unit,
          referenceRange: param.referenceRange,
          isAbnormal: param.flag === 'high' || param.flag === 'low' || param.flag === 'critical'
        };
        testResults.push(result);
      });
    } else if (report.testInfo?.parameters) {
      report.testInfo.parameters.forEach(param => {
        const min = param.normalRange?.min;
        const max = param.normalRange?.max;
        const value = parseFloat(param.value);
        const isAbnormal = !isNaN(value) && (value < min || value > max);
        
        const result = {
          name: param.name,
          result: param.value,
          unit: param.unit,
          referenceRange: `${min} - ${max}`,
          isAbnormal: isAbnormal
        };
        testResults.push(result);
      });
    }

    // --- Group results by templateId ---
    const groupedResults = [];
    const templateIds = [...new Set(report.results.map(r => r.templateId).filter(id => id))]; // Get unique template IDs

    if (templateIds.length > 0) {
      const templates = await TestTemplate.find({ '_id': { $in: templateIds } }).select('templateName name'); // Only select name fields
      const templateMap = templates.reduce((map, t) => {
        map[t._id.toString()] = t.templateName || t.name;
        return map;
      }, {});

      for (const templateId of templateIds) {
        const templateName = templateMap[templateId.toString()] || 'Unknown Test';
        // const templateNotes = ''; // Removed notes logic

        const parameters = report.results
          .filter(r => r.templateId && r.templateId.toString() === templateId.toString())
          .map(param => ({
            name: param.parameter,
            result: param.value,
            unit: param.unit,
            referenceRange: param.referenceRange,
            isAbnormal: param.flag === 'high' || param.flag === 'low' || param.flag === 'critical',
            isHeader: param.isHeader, // Pass isHeader to template
            isSubparameter: param.isSubparameter // Pass isSubparameter to template
          }));

        if (parameters.length > 0) {
          // Only add templateName and parameters
          groupedResults.push({ templateName, parameters });
        }
      }
    } else {
       // Fallback for reports created before templateId was added or custom reports
       // Treat all results as one group (using the report's main test name)
       const parameters = report.results.map(param => ({
          name: param.parameter,
          result: param.value,
          unit: param.unit,
          referenceRange: param.referenceRange,
          isAbnormal: param.flag === 'high' || param.flag === 'low' || param.flag === 'critical',
          isHeader: param.isHeader,
          isSubparameter: param.isSubparameter
       }));
       if (parameters.length > 0) {
         groupedResults.push({ templateName: report.testInfo?.name || 'Test Results', parameters });
       }
    }
    // --- End grouping logic ---
    
    // Get the server's base URL for image paths
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    // Check if header and footer settings exist and should be shown
    const hasHeaderSettings = labReportSettings && 
                             (labReportSettings.header.headerImage || 
                              labReportSettings.header.labName || 
                              labReportSettings.header.doctorName);
                              
    const hasFooterSettings = labReportSettings && 
                             (labReportSettings.footer.signature || 
                              labReportSettings.footer.footerImage);
    
    // Prepare data for the template
    const data = {
      // Header data - only include if settings exist and showHeader is true
      showHeader: showHeader && hasHeaderSettings,
      headerImage: (showHeader && hasHeaderSettings && labReportSettings.header.headerImage) ? 
                   `${baseUrl}${labReportSettings.header.headerImage}` : '',
      labName: (showHeader && hasHeaderSettings) ? 
               (labReportSettings.header.labName || lab.name || 'Pathology Laboratory') : '',
      doctorName: (showHeader && hasHeaderSettings) ? 
                  (labReportSettings.header.doctorName || 'Dr. Consultant') : '',
      address: (showHeader && hasHeaderSettings) ? 
               (labReportSettings.header.address || lab.address || 'Lab Address') : '',
      phone: (showHeader && hasHeaderSettings) ? 
             (labReportSettings.header.phone || lab.phone || '') : '',
      email: (showHeader && hasHeaderSettings) ? 
             (labReportSettings.header.email || lab.email || '') : '',
      
      // Patient data
      patientName: report.patientInfo?.name || 'N/A',
      patientAge: report.patientInfo?.age || 'N/A',
      patientGender: report.patientInfo?.gender || 'N/A',
      patientId: report.patientInfo?.patientId || 'N/A',
      
      // Sample data
      reportDate: new Date(report.createdAt).toLocaleDateString(),
      referringDoctor: report.testInfo?.referenceDoctor || 'N/A',
      
      // Test data - Now using groupedResults
      // testName: report.testInfo?.name || 'COMPLETE BLOOD COUNT (CBC)', // Keep original testName for overall context if needed
      // testResults: testResults, // Replaced by groupedResults
      groupedResults: groupedResults, // Pass grouped results to template
      testNotes: report.testNotes, // Pass overall notes
      
      // Footer data - only include if settings exist and showFooter is true
      showFooter: showFooter && hasFooterSettings,
      signatureImage: (showFooter && hasFooterSettings && labReportSettings.footer.signature) ? 
                      `${baseUrl}${labReportSettings.footer.signature}` : '',
      verifiedBy: (showFooter && hasFooterSettings) ? 
                  (labReportSettings.footer.verifiedBy || 'Lab Incharge') : '',
      designation: (showFooter && hasFooterSettings) ? 
                   (labReportSettings.footer.designation || 'Pathologist') : '',
      footerImage: (showFooter && hasFooterSettings && labReportSettings.footer.footerImage) ? 
                   `${baseUrl}${labReportSettings.footer.footerImage}` : '',
      
      // Styling
      styling: {
        primaryColor: labReportSettings?.styling?.primaryColor || '#007bff',
        secondaryColor: labReportSettings?.styling?.secondaryColor || '#6c757d',
        fontFamily: labReportSettings?.styling?.fontFamily || 'Arial, sans-serif',
        fontSize: labReportSettings?.styling?.fontSize || 12
      }
    };
    
    // Register a helper for debugging
    handlebars.registerHelper('debug', function(optionalValue) {
      console.log('Current Context');
      console.log('====================');
      console.log(this);
      
      if (optionalValue) {
        console.log('Value');
        console.log('====================');
        console.log(optionalValue);
      }
    });
    
    // Generate the HTML
    const html = template(data);
    
    // Log the data being passed to the template for debugging
    console.log('Template data:', JSON.stringify(data, null, 2));
    
    // Send the HTML as the response
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error generating HTML report:', error);
    next(error);
  }
};

// @desc    Test Handlebars template
// @route   GET /api/reports/test-template
// @access  Private/Admin/Technician
exports.testTemplate = async (req, res, next) => {
  try {
    // Read the test template
    const testTemplatePath = path.join(__dirname, '..', 'test-template.html');
    let templateSource;
    try {
      templateSource = fs.readFileSync(testTemplatePath, 'utf8');
      console.log('Test template loaded successfully');
    } catch (err) {
      console.error('Error reading test template file:', err);
      return res.status(500).json({
        success: false,
        message: 'Error reading test template'
      });
    }
    
    // Compile the template
    let template;
    try {
      template = handlebars.compile(templateSource);
      console.log('Test template compiled successfully');
    } catch (err) {
      console.error('Error compiling test template:', err);
      return res.status(500).json({
        success: false,
        message: 'Error compiling test template'
      });
    }
    
    // Prepare test data
    const data = {
      name: 'John Doe',
      user: {
        name: 'Jane Smith',
        age: 30
      },
      showMessage: true,
      items: ['Item 1', 'Item 2', 'Item 3']
    };
    
    // Generate the HTML
    const html = template(data);
    
    // Send the HTML as the response
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error testing template:', error);
    next(error);
  }
};

// @desc    Generate PDF report
// @route   GET /api/reports/:id/pdf
// @access  Private/Admin/Technician
exports.generatePdfReport = async (req, res, next) => {
  try {
    // Get the showHeader and showFooter query parameters (default to true if not provided)
    const showHeader = req.query.showHeader !== 'false';
    const showFooter = req.query.showFooter !== 'false';
    
    console.log(`PDF generation options - Show Header: ${showHeader}, Show Footer: ${showFooter}`);
    
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

    // Get lab report settings
    const labReportSettings = await LabReportSettings.findOne({ lab: report.lab });
    
    // Get lab details
    const lab = await Lab.findById(report.lab);
    if (!lab) {
      return res.status(404).json({
        success: false,
        message: 'Lab not found'
      });
    }
    
    // Check if header and footer settings exist
    const hasHeaderSettings = labReportSettings && 
                             (labReportSettings.header.headerImage || 
                              labReportSettings.header.labName || 
                              labReportSettings.header.doctorName);
                              
    const hasFooterSettings = labReportSettings && 
                             (labReportSettings.footer.signature || 
                              labReportSettings.footer.footerImage);

    // Process test results to include abnormal flag
    const testResults = [];
    if (report.results && report.results.length > 0) {
      report.results.forEach(param => {
        const result = {
          name: param.parameter,
          result: param.value,
          unit: param.unit,
          referenceRange: param.referenceRange,
          isAbnormal: param.flag === 'high' || param.flag === 'low' || param.flag === 'critical'
        };
        testResults.push(result);
      });
    } else if (report.testInfo?.parameters) {
      report.testInfo.parameters.forEach(param => {
        const min = param.normalRange?.min;
        const max = param.normalRange?.max;
        const value = parseFloat(param.value);
        const isAbnormal = !isNaN(value) && (value < min || value > max);
        
        const result = {
          name: param.name,
          result: param.value,
          unit: param.unit,
          referenceRange: `${min} - ${max}`,
          isAbnormal: isAbnormal
        };
        testResults.push(result);
      });
    }

    // --- Group results by templateId (Same logic as in generateHtmlReport) ---
    const groupedResultsPdf = [];
    const templateIdsPdf = [...new Set(report.results.map(r => r.templateId).filter(id => id))];

    if (templateIdsPdf.length > 0) {
      const templatesPdf = await TestTemplate.find({ '_id': { $in: templateIdsPdf } }).select('templateName name'); // Only select name fields
      const templateMapPdf = templatesPdf.reduce((map, t) => {
        map[t._id.toString()] = t.templateName || t.name;
        return map;
      }, {});

      for (const templateId of templateIdsPdf) {
        const templateName = templateMapPdf[templateId.toString()] || 'Unknown Test';
        // const templateNotes = ''; // Removed notes logic

        const parameters = report.results
          .filter(r => r.templateId && r.templateId.toString() === templateId.toString())
          .map(param => ({
            name: param.parameter,
            result: param.value,
            unit: param.unit,
            referenceRange: param.referenceRange,
            isAbnormal: param.flag === 'high' || param.flag === 'low' || param.flag === 'critical',
            isHeader: param.isHeader,
            isSubparameter: param.isSubparameter
          }));

        if (parameters.length > 0) {
          // Only add templateName and parameters
          groupedResultsPdf.push({ templateName, parameters });
        }
      }
    } else {
       // Fallback
       const parameters = report.results.map(param => ({
          name: param.parameter,
          result: param.value,
          unit: param.unit,
          referenceRange: param.referenceRange,
          isAbnormal: param.flag === 'high' || param.flag === 'low' || param.flag === 'critical',
          isHeader: param.isHeader,
          isSubparameter: param.isSubparameter
       }));
       if (parameters.length > 0) {
         groupedResultsPdf.push({ templateName: report.testInfo?.name || 'Test Results', parameters });
       }
    }
    // --- End grouping logic ---
    
    // Get the server's base URL for image paths
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    // Prepare data for the template
    const data = {
      // Header data - only include if settings exist and showHeader is true
      showHeader: showHeader && hasHeaderSettings,
      headerImage: (showHeader && hasHeaderSettings && labReportSettings.header.headerImage) ? 
                   `${baseUrl}${labReportSettings.header.headerImage}` : '',
      labName: (showHeader && hasHeaderSettings) ? 
               (labReportSettings.header.labName || lab.name || 'Pathology Laboratory') : '',
      doctorName: (showHeader && hasHeaderSettings) ? 
                  (labReportSettings.header.doctorName || 'Dr. Consultant') : '',
      address: (showHeader && hasHeaderSettings) ? 
               (labReportSettings.header.address || lab.address || 'Lab Address') : '',
      phone: (showHeader && hasHeaderSettings) ? 
             (labReportSettings.header.phone || lab.phone || '') : '',
      email: (showHeader && hasHeaderSettings) ? 
             (labReportSettings.header.email || lab.email || '') : '',
      
      // Patient data
      patientName: report.patientInfo?.name || 'N/A',
      patientAge: report.patientInfo?.age || 'N/A',
      patientGender: report.patientInfo?.gender || 'N/A',
      patientId: report.patientInfo?.patientId || 'N/A',
      
      // Sample data
      sampleCollectionDate: new Date(report.testInfo?.sampleCollectionDate || Date.now()).toLocaleDateString(),
      sampleType: report.testInfo?.sampleType || 'Blood',
      referringDoctor: report.testInfo?.referenceDoctor || 'N/A',
      
      // Test data - Now using groupedResultsPdf
      // testName: report.testInfo?.name || 'COMPLETE BLOOD COUNT (CBC)', 
      // testResults: testResults, // Replaced by groupedResultsPdf
      groupedResults: groupedResultsPdf, // Pass grouped results to template
      testNotes: report.testNotes, // Pass overall notes

      // Footer data - only include if settings exist and showFooter is true
      showFooter: showFooter && hasFooterSettings,
      signatureImage: (showFooter && hasFooterSettings && labReportSettings.footer.signature) ? 
                      `${baseUrl}${labReportSettings.footer.signature}` : '',
      verifiedBy: (showFooter && hasFooterSettings) ? 
                  (labReportSettings.footer.verifiedBy || 'Lab Incharge') : '',
      designation: (showFooter && hasFooterSettings) ? 
                   (labReportSettings.footer.designation || 'Pathologist') : '',
      footerImage: (showFooter && hasFooterSettings && labReportSettings.footer.footerImage) ? 
                   `${baseUrl}${labReportSettings.footer.footerImage}` : '',
      
      // Styling
      styling: {
        primaryColor: labReportSettings?.styling?.primaryColor || '#007bff',
        secondaryColor: labReportSettings?.styling?.secondaryColor || '#6c757d',
        fontFamily: labReportSettings?.styling?.fontFamily || 'Arial, sans-serif',
        fontSize: labReportSettings?.styling?.fontSize || 12
      }
    };

    // Import puppeteer
    const puppeteer = require('puppeteer');
    const fs = require('fs');
    const path = require('path');
    
    // Read the black-only template specifically designed for PDF generation
    const pdfTemplatePath = path.join(__dirname, '..', 'black-only-report.html');
    const templateSource = fs.readFileSync(pdfTemplatePath, 'utf8');
    
    // Compile the template
    const template = handlebars.compile(templateSource);
    
    // Generate the HTML
    const html = template(data);
    
    console.log('Using black-only template for PDF generation');
    
    // Launch a headless browser with additional configuration
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1280,720'
      ]
    });
    
    // Create a new page
    const page = await browser.newPage();
    
    // Set viewport size to A4
    await page.setViewport({
      width: 794, // A4 width in pixels (210mm at 96 DPI)
      height: 1123, // A4 height in pixels (297mm at 96 DPI)
      deviceScaleFactor: 1
    });
    
    // Set the content of the page with longer timeout
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Add debug logging
    console.log('Page content set successfully');
    
    // Set the PDF options with more detailed configuration
    const pdfOptions = {
      format: 'A4',
      printBackground: true,
      margin: {
        top: '40mm', // Reserve space for pre-printed letterhead
        right: '0',
        bottom: '0',
        left: '0'
      },
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      scale: 1,
      landscape: false
    };
    
    // Add debug logging
    console.log('Generating PDF with options:', JSON.stringify(pdfOptions));
    
    try {
      // Generate the PDF
      const pdf = await page.pdf(pdfOptions);
      console.log('PDF generated successfully');
      
      // Close the browser
      await browser.close();
      console.log('Browser closed successfully');
      
      // Set the response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="report-${report._id}.pdf"`);
      
      // Send the PDF as the response
      res.send(pdf);
    } catch (pdfError) {
      console.error('Error in PDF generation step:', pdfError);
      await browser.close();
      return res.status(500).json({
        success: false,
        message: 'Error generating PDF',
        error: pdfError.message
      });
    }
  } catch (error) {
    console.error('Error generating PDF report:', error);
    next(error);
  }
};
