const LabReportSettings = require('../models/LabReportSettings');
const Lab = require('../models/Lab');
const asyncHandler = require('express-async-handler');
const fs = require('fs');
const path = require('path');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
const reportImagesDir = path.join(uploadsDir, 'report-images');

// Ensure directories exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
if (!fs.existsSync(reportImagesDir)) {
  fs.mkdirSync(reportImagesDir);
}

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

  try {
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
      // Update only the fields that are provided in the request
      if (req.body.header) {
        if (req.body.header.headerImage !== undefined) {
          settings.header.headerImage = req.body.header.headerImage;
        }
        if (req.body.header.headerImageType !== undefined) {
          settings.header.headerImageType = req.body.header.headerImageType;
        }
      }
      
      if (req.body.footer) {
        if (req.body.footer.verifiedBy !== undefined) {
          settings.footer.verifiedBy = req.body.footer.verifiedBy;
        }
        if (req.body.footer.designation !== undefined) {
          settings.footer.designation = req.body.footer.designation;
        }
        if (req.body.footer.signature !== undefined) {
          settings.footer.signature = req.body.footer.signature;
        }
        if (req.body.footer.signatureType !== undefined) {
          settings.footer.signatureType = req.body.footer.signatureType;
        }
        if (req.body.footer.footerImage !== undefined) {
          settings.footer.footerImage = req.body.footer.footerImage;
        }
        if (req.body.footer.footerImageType !== undefined) {
          settings.footer.footerImageType = req.body.footer.footerImageType;
        }
      }
      
      if (req.body.styling) {
        if (req.body.styling.primaryColor !== undefined) {
          settings.styling.primaryColor = req.body.styling.primaryColor;
        }
        if (req.body.styling.secondaryColor !== undefined) {
          settings.styling.secondaryColor = req.body.styling.secondaryColor;
        }
        if (req.body.styling.fontFamily !== undefined) {
          settings.styling.fontFamily = req.body.styling.fontFamily;
        }
        if (req.body.styling.fontSize !== undefined) {
          settings.styling.fontSize = req.body.styling.fontSize;
        }
      }
      
      await settings.save();
    }

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error updating lab report settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update lab report settings',
      error: error.message
    });
  }
});

// Helper function to save base64 image to file
const saveBase64Image = (base64Data, mimeType, labId, type) => {
  return new Promise((resolve, reject) => {
    try {
      // Create directory for this lab if it doesn't exist
      const labDir = path.join(reportImagesDir, labId.toString());
      if (!fs.existsSync(labDir)) {
        fs.mkdirSync(labDir);
      }

      // Generate a unique filename
      const timestamp = Date.now();
      const extension = mimeType === 'image/png' ? 'png' : 'jpg';
      const filename = `${type}_${timestamp}.${extension}`;
      const filePath = path.join(labDir, filename);

      // Convert base64 to buffer and save to file
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filePath, buffer);

      // Return the relative URL path
      const relativePath = `/uploads/report-images/${labId}/${filename}`;
      resolve(relativePath);
    } catch (error) {
      reject(error);
    }
  });
};

// @desc    Upload logo, header, footer, or signature
// @route   POST /api/labs/:labId/report-settings/upload
// @access  Private (Admin, Lab Owner)
exports.uploadImage = asyncHandler(async (req, res) => {
  const labId = req.params.labId || req.labId;
  const { type } = req.query; // 'logo', 'header', 'footer', or 'signature'
  const { imageData, mimeType } = req.body; // Base64 encoded image data and MIME type
  
  if (!type || !['logo', 'header', 'footer', 'signature'].includes(type)) {
    return res.status(400).json({
      success: false,
      message: 'Please specify a valid image type (logo, header, footer, or signature)'
    });
  }
  
  if (!imageData) {
    return res.status(400).json({
      success: false,
      message: 'Image data is required'
    });
  }
  
  if (!mimeType || !['image/png', 'image/jpeg', 'image/jpg'].includes(mimeType)) {
    return res.status(400).json({
      success: false,
      message: 'Valid image MIME type is required (image/png, image/jpeg, or image/jpg)'
    });
  }
  
  try {
    // Save the image to the file system
    const imageUrl = await saveBase64Image(imageData, mimeType, labId, type);
    
    // Update the settings with the new image URL and type
    let settings = await LabReportSettings.findOne({ lab: labId });
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Lab report settings not found'
      });
    }
    
    if (type === 'logo') {
      settings.header.logo = imageUrl;
    } else if (type === 'header') {
      settings.header.headerImage = imageUrl;
      settings.header.headerImageType = mimeType;
    } else if (type === 'footer') {
      settings.footer.footerImage = imageUrl;
      settings.footer.footerImageType = mimeType;
    } else if (type === 'signature') {
      settings.footer.signature = imageUrl;
      settings.footer.signatureType = mimeType;
    }
    
    await settings.save();
    
    // For the frontend, we need to return the full URL
    const fullUrl = `${req.protocol}://${req.get('host')}${imageUrl}`;
    
    res.status(200).json({
      success: true,
      data: {
        url: fullUrl,
        type,
        mimeType
      }
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message
    });
  }
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
