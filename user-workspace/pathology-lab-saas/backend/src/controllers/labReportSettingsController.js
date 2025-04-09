const LabReportSettings = require('../models/LabReportSettings');
const Lab = require('../models/Lab');
const asyncHandler = require('express-async-handler');

// @desc    Get lab report settings
// @route   GET /api/labs/:labId/report-settings
// @access  Private (Admin, Lab Owner)
exports.getLabReportSettings = asyncHandler(async (req, res) => {
  const labId = req.params.labId || req.labId;

  // Check if lab exists
  const lab = await Lab.findById(labId);
  if (!lab) {
    return res.status(404).json({
      success: false,
      message: 'Lab not found'
    });
  }

  // Find settings or create default
  let settings = await LabReportSettings.findOne({ lab: labId });
  
  if (!settings) {
    // Create default settings
    settings = await LabReportSettings.create({
      lab: labId,
      header: {
        labName: lab.name || 'Pathology Lab',
        doctorName: 'Dr. Consultant',
        address: lab.address || 'Lab Address',
        phone: lab.phone || '',
        email: lab.email || ''
      },
      footer: {
        verifiedBy: 'Dr. Consultant',
        designation: 'Consultant Pathologist'
      }
    });
  }

  res.status(200).json({
    success: true,
    data: settings
  });
});

// @desc    Update lab report settings
// @route   PUT /api/labs/:labId/report-settings
// @access  Private (Admin, Lab Owner)
exports.updateLabReportSettings = asyncHandler(async (req, res) => {
  const labId = req.params.labId || req.labId;

  // Check if lab exists
  const lab = await Lab.findById(labId);
  if (!lab) {
    return res.status(404).json({
      success: false,
      message: 'Lab not found'
    });
  }

  // Find settings or create default
  let settings = await LabReportSettings.findOne({ lab: labId });
  
  if (!settings) {
    // Create with provided data
    settings = await LabReportSettings.create({
      lab: labId,
      ...req.body
    });
  } else {
    // Update existing settings
    settings = await LabReportSettings.findOneAndUpdate(
      { lab: labId },
      req.body,
      { new: true, runValidators: true }
    );
  }

  res.status(200).json({
    success: true,
    data: settings
  });
});

// @desc    Upload logo or signature
// @route   POST /api/labs/:labId/report-settings/upload
// @access  Private (Admin, Lab Owner)
exports.uploadImage = asyncHandler(async (req, res) => {
  // This would typically use a file upload middleware like multer
  // and then store the file in a cloud storage service like AWS S3
  // For now, we'll just return a mock URL
  
  const labId = req.params.labId || req.labId;
  const { type } = req.query; // 'logo' or 'signature'
  
  if (!type || (type !== 'logo' && type !== 'signature')) {
    return res.status(400).json({
      success: false,
      message: 'Please specify a valid image type (logo or signature)'
    });
  }
  
  // Mock URL for demonstration
  const imageUrl = `https://example.com/uploads/${labId}/${type}-${Date.now()}.png`;
  
  // Update the settings with the new image URL
  let settings = await LabReportSettings.findOne({ lab: labId });
  
  if (!settings) {
    return res.status(404).json({
      success: false,
      message: 'Lab report settings not found'
    });
  }
  
  if (type === 'logo') {
    settings.header.logo = imageUrl;
  } else {
    settings.footer.signature = imageUrl;
  }
  
  await settings.save();
  
  res.status(200).json({
    success: true,
    data: {
      url: imageUrl,
      type
    }
  });
});

// @desc    Generate PDF report
// @route   POST /api/reports/:reportId/generate-pdf
// @access  Private (Admin, Lab Owner, Technician)
exports.generatePdfReport = asyncHandler(async (req, res) => {
  const reportId = req.params.reportId;
  
  // This would typically:
  // 1. Fetch the report data
  // 2. Fetch the lab report settings
  // 3. Generate a PDF using a library like pdfmake
  // 4. Return the PDF or a URL to download it
  
  // For now, we'll just return a mock response
  res.status(200).json({
    success: true,
    data: {
      pdfUrl: `https://example.com/reports/${reportId}.pdf`,
      message: 'PDF report generated successfully'
    }
  });
});
