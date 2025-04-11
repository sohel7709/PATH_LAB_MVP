const Report = require('../models/Report');
const Lab = require('../models/Lab');
const User = require('../models/User');
const LabReportSettings = require('../models/LabReportSettings');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

// @desc    Create new report
// @route   POST /api/technician/reports
// @access  Private/Technician
exports.createReport = async (req, res, next) => {
  try {
    // Add lab and technician info to report
    req.body.lab = req.user.lab;
    req.body.technician = req.user.id;

    const report = await Report.create(req.body);

    // Update lab statistics
    await Lab.findByIdAndUpdate(req.user.lab, {
      $inc: { 'stats.totalReports': 1 },
      $set: { 'stats.lastReportDate': Date.now() }
    });

    res.status(201).json({
      success: true,
      data: report
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

    res.status(200).json({
      success: true,
      data: report
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
    
    if (!labReportSettings) {
      return res.status(404).json({
        success: false,
        message: 'Lab report settings not found'
      });
    }

    // Get lab details
    const lab = await Lab.findById(report.lab);
    if (!lab) {
      return res.status(404).json({
        success: false,
        message: 'Lab not found'
      });
    }

    // Read the HTML template
    const reportTemplatePath = path.join(__dirname, '..', 'report.html');
    let templateSource;
    try {
      templateSource = fs.readFileSync(reportTemplatePath, 'utf8');
      console.log('Template loaded successfully');
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
    
    // Get the server's base URL for image paths
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    // Prepare data for the template
    const data = {
      // Header data
      headerImage: labReportSettings.header.headerImage ? `${baseUrl}${labReportSettings.header.headerImage}` : '',
      labName: labReportSettings.header.labName || lab.name || 'Pathology Laboratory',
      doctorName: labReportSettings.header.doctorName || 'Dr. Consultant',
      address: labReportSettings.header.address || lab.address || 'Lab Address',
      phone: labReportSettings.header.phone || lab.phone || '',
      email: labReportSettings.header.email || lab.email || '',
      
      // Patient data
      patientName: report.patientInfo?.name || 'N/A',
      patientAge: report.patientInfo?.age || 'N/A',
      patientGender: report.patientInfo?.gender || 'N/A',
      patientId: report.patientInfo?.patientId || 'N/A',
      
      // Sample data
      sampleCollectionDate: new Date(report.testInfo?.sampleCollectionDate || Date.now()).toLocaleDateString(),
      sampleType: report.testInfo?.sampleType || 'Blood',
      referringDoctor: report.testInfo?.referenceDoctor || 'N/A',
      
      // Test data
      testName: report.testInfo?.name || 'COMPLETE BLOOD COUNT (CBC)',
      testResults: testResults,
      
      // Signature data
      signatureImage: labReportSettings.footer.signature ? `${baseUrl}${labReportSettings.footer.signature}` : '',
      verifiedBy: labReportSettings.footer.verifiedBy || 'Lab Incharge',
      designation: labReportSettings.footer.designation || 'Pathologist',
      
      // Footer data
      footerImage: labReportSettings.footer.footerImage ? `${baseUrl}${labReportSettings.footer.footerImage}` : '',
      
      // Styling
      styling: {
        primaryColor: labReportSettings.styling?.primaryColor || '#007bff',
        secondaryColor: labReportSettings.styling?.secondaryColor || '#6c757d',
        fontFamily: labReportSettings.styling?.fontFamily || 'Arial, sans-serif',
        fontSize: labReportSettings.styling?.fontSize || 12
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
    
    if (!labReportSettings) {
      return res.status(404).json({
        success: false,
        message: 'Lab report settings not found'
      });
    }

    // In a real implementation, we would:
    // 1. Generate HTML using the same template as generateHtmlReport
    // 2. Convert HTML to PDF using a library like puppeteer or html-pdf
    // 3. Return the PDF file
    
    // For now, we'll just return a message with more detailed information
    res.status(200).json({
      success: true,
      message: 'PDF generation is not fully implemented yet. In a production environment, this would generate and return a PDF file.',
      data: {
        reportId: report._id,
        patientName: report.patientInfo?.name,
        testName: report.testInfo?.name,
        labSettings: {
          headerImage: labReportSettings.header.headerImage ? 'Available' : 'Not available',
          signature: labReportSettings.footer.signature ? 'Available' : 'Not available',
          footerImage: labReportSettings.footer.footerImage ? 'Available' : 'Not available'
        }
      }
    });
  } catch (error) {
    console.error('Error generating PDF report:', error);
    next(error);
  }
};
