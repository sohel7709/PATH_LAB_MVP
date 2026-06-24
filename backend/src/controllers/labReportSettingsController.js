const LabReportSettings = require("../models/LabReportSettings");
const Lab = require("../models/Lab");
const asyncHandler = require("express-async-handler");
const { createAuditLog } = require("../services/auditService");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../../uploads");
const reportImagesDir = path.join(uploadsDir, "report-images");

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
      message: "Lab not found",
    });
  }

  // Find settings or create default
  let settings = await LabReportSettings.findOne({ lab: labId });

  if (!settings) {
    // Create default settings
    settings = await LabReportSettings.create({
      lab: labId,
      header: {
        labName: lab.name || "Pathology Lab",
        doctorName: "Dr. Consultant",
        address: lab.address || "Lab Address",
        phone: lab.phone || "",
        email: lab.email || "",
      },
      footer: {
        verifiedBy: "Dr. Consultant",
        designation: "Consultant Pathologist",
      },
    });
  }

  res.status(200).json({
    success: true,
    data: settings,
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
        message: "Lab not found",
      });
    }

    // Find settings or create default
    let settings = await LabReportSettings.findOne({ lab: labId });

    if (!settings) {
      // Create with provided data
      settings = await LabReportSettings.create({
        lab: labId,
        ...req.body,
      });
    } else {
      // Update only the fields that are provided in the request
      if (req.body.header) {
        if (req.body.header.headerMode !== undefined) {
          settings.header.headerMode = req.body.header.headerMode;
        }

        if (req.body.header.labName !== undefined) {
          settings.header.labName = req.body.header.labName;
        }

        if (req.body.header.doctorName !== undefined) {
          settings.header.doctorName = req.body.header.doctorName;
        }

        if (req.body.header.registrationNo !== undefined) {
          settings.header.registrationNo = req.body.header.registrationNo;
        }

        if (req.body.header.technicianName !== undefined) {
          settings.header.technicianName = req.body.header.technicianName;
        }

        if (req.body.header.address !== undefined) {
          settings.header.address = req.body.header.address;
        }

        if (req.body.header.phone !== undefined) {
          settings.header.phone = req.body.header.phone;
        }

        if (req.body.header.email !== undefined) {
          settings.header.email = req.body.header.email;
        }

        if (req.body.header.headerImage !== undefined) {
          settings.header.headerImage = req.body.header.headerImage;
        }

        if (req.body.header.headerImageType !== undefined) {
          settings.header.headerImageType = req.body.header.headerImageType;
        }
      }

      if (req.body.footer) {
        if (req.body.footer.footerMode !== undefined) {
          settings.footer.footerMode = req.body.footer.footerMode;
        }

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

      if (req.body.watermark) {
        settings.watermark.image = req.body.watermark.image;

        settings.watermark.imageType = req.body.watermark.imageType;

        settings.watermark.enabled = req.body.watermark.enabled;
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

    // Audit Log
    const labName = lab.name || 'Lab';
    createAuditLog({
      user: req.user._id,
      role: req.user.role,
      module: 'SETTINGS',
      action: 'UPDATE',
      entityId: settings._id,
      entityType: 'LabReportSettings',
      description: `${req.user.name} updated report settings for ${labName}`,
      req,
    });

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update lab report settings",
      error: error.message,
    });
  }
});

// Helper function to validate image dimensions
const validateImageDimensions = async (buffer, type) => {
  try {
    const metadata = await sharp(buffer).metadata();

    if (type === "header") {
      // Header should be 2480x480 pixels @ 300 DPI
      if (metadata.width !== 2480 || metadata.height !== 480) {
        return {
          valid: false,
          message: `Header image must be exactly 2480x480 pixels. Uploaded image is ${metadata.width}x${metadata.height} pixels.`,
        };
      }
    } else if (type === "footer") {
      // Footer should be 2480x200 pixels @ 300 DPI
      if (metadata.width !== 2480 || metadata.height !== 200) {
        return {
          valid: false,
          message: `Footer image must be exactly 2480x200 pixels. Uploaded image is ${metadata.width}x${metadata.height} pixels.`,
        };
      }
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, message: "Error validating image dimensions" };
  }
};

// Verify real file type via magic bytes (not client-declared mimeType)
const verifyImageMagicBytes = (buffer) => {
  if (buffer.length < 4) return null;
  const hex = buffer.slice(0, 4).toString('hex');
  if (hex.startsWith('89504e47')) return 'image/png';
  if (hex.startsWith('ffd8ff')) return 'image/jpeg';
  return null;
};

// Helper function to save base64 image to file
const saveBase64Image = (base64Data, mimeType, labId, type) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Sanitize labId to prevent path traversal
      const safeLabId = labId.toString().replace(/[^a-zA-Z0-9]/g, '');

      // Create directory for this lab if it doesn't exist
      const labDir = path.join(reportImagesDir, safeLabId);
      if (!fs.existsSync(labDir)) {
        fs.mkdirSync(labDir);
      }

      // Convert base64 to buffer first so we can verify magic bytes
      const buffer = Buffer.from(base64Data, "base64");

      // Verify actual file type via magic bytes — client can lie about mimeType
      const actualType = verifyImageMagicBytes(buffer);
      if (!actualType) {
        reject(new Error('Invalid image file: not a recognized PNG or JPEG'));
        return;
      }

      // Generate a unique filename using verified extension
      const timestamp = Date.now();
      const extension = actualType === "image/png" ? "png" : "jpg";
      const filename = `${type}_${timestamp}.${extension}`;
      const filePath = path.join(labDir, filename);

      // Validate image dimensions for header and footer
      if (type === "header" || type === "footer") {
        const validation = await validateImageDimensions(buffer, type);
        if (!validation.valid) {
          reject(new Error(validation.message));
          return;
        }
      }

      // Save to file
      fs.writeFileSync(filePath, buffer);

      // Return the relative URL path
      const relativePath = `/uploads/report-images/${safeLabId}/${filename}`;
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

  if (!["logo", "header", "footer", "signature", "watermark"].includes(type)) {
    return next(
      new ErrorResponse(
        "Please specify a valid image type (logo, header, footer, signature, or watermark)",
        400,
      ),
    );
  }

  if (!imageData) {
    return res.status(400).json({
      success: false,
      message: "Image data is required",
    });
  }

  if (
    !mimeType ||
    !["image/png", "image/jpeg", "image/jpg"].includes(mimeType)
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Valid image MIME type is required (image/png, image/jpeg, or image/jpg)",
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
        message: "Lab report settings not found",
      });
    }

    if (type === "logo") {
      settings.header.logo = imageUrl;
    } else if (type === "header") {
      settings.header.headerImage = imageUrl;
      settings.header.headerImageType = mimeType;
    } else if (type === "footer") {
      settings.footer.footerImage = imageUrl;
      settings.footer.footerImageType = mimeType;
    } else if (type === "signature") {
      settings.footer.signature = imageUrl;
      settings.footer.signatureType = mimeType;
    } else if (type === "watermark") {
      settings.watermark.image = imageUrl;
      settings.watermark.imageType = mimeType;
    }


    await settings.save();

    // Audit Log
    const typeLabels = { logo: 'logo', header: 'report header image', footer: 'report footer image', signature: 'signature', watermark: 'watermark' };
    const typeLabel = typeLabels[type] || type;
    createAuditLog({
      user: req.user._id,
      role: req.user.role,
      module: 'SETTINGS',
      action: 'UPLOAD',
      entityId: settings._id,
      entityType: 'LabReportSettings',
      description: `${req.user.name} updated ${typeLabel} for report settings`,
      newData: { type, imageUrl },
      req,
    });

    // For the frontend, we need to return the full URL
    const fullUrl = `${req.protocol}://${req.get("host")}${imageUrl}`;

    res.status(200).json({
      success: true,
      data: {
        url: fullUrl,
        type,
        mimeType,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to upload image",
      error: error.message,
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
      message: "PDF report generated successfully",
    },
  });
});
