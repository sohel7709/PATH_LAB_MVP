const Feedback = require('../models/Feedback');
const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/feedback');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Helper: Generate unique filename
const generateFilename = (labId, originalName) => {
  const timestamp = Date.now();
  const safeLabId = labId.toString().replace(/[^a-zA-Z0-9]/g, '');
  const ext = path.extname(originalName).toLowerCase();
  const unique = Math.random().toString(36).substring(2, 8);
  return `${safeLabId}_${timestamp}_${unique}${ext}`;
};

// Helper: Verify image magic bytes
const verifyImageMagicBytes = (buffer) => {
  if (buffer.length < 4) return false;
  const hex = buffer.slice(0, 4).toString('hex');
  if (hex.startsWith('89504e47')) return true; // PNG
  if (hex.startsWith('ffd8ff')) return true; // JPEG
  if (hex.startsWith('52494646')) {
    // Check for WEBP (RIFF....WEBP)
    const webpCheck = buffer.slice(8, 12).toString();
    return webpCheck === 'WEBP';
  }
  return false;
};

// @desc    Create feedback (Admin only)
// @route   POST /api/feedback
// @access  Private (Admin)
exports.createFeedback = async (req, res, next) => {
  try {
    const { subject, type, description, priority, images } = req.body;

    if (!req.user.lab) {
      return res.status(400).json({
        success: false,
        message: 'You must be associated with a lab to submit feedback.',
      });
    }

    // Process uploaded images (base64 or existing URLs)
    let imagePaths = [];
    if (images && Array.isArray(images)) {
      for (const img of images) {
        if (img && typeof img === 'string') {
          if (img.startsWith('data:')) {
            // Base64 image - save to disk
            try {
              const matches = img.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
              if (!matches) continue;
              const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
              const buffer = Buffer.from(matches[2], 'base64');

              if (!verifyImageMagicBytes(buffer)) continue;

              const filename = `${req.user.lab.toString().replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
              const filePath = path.join(uploadsDir, filename);
              fs.writeFileSync(filePath, buffer);
              imagePaths.push(`/uploads/feedback/${filename}`);
            } catch (err) {
              // Skip invalid images
            }
          } else if (img.startsWith('/uploads/')) {
            // Already uploaded path
            imagePaths.push(img);
          }
        }
      }
    }

    const feedback = await Feedback.create({
      subject,
      type,
      description,
      priority: priority || 'Medium',
      images: imagePaths,
      admin: req.user.id,
      lab: req.user.lab,
    });

    const populated = await Feedback.findById(feedback._id)
      .populate('admin', 'name email phone')
      .populate('lab', 'name');

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    next(error);
  }
};

// @desc    Upload feedback image
// @route   POST /api/feedback/upload-image
// @access  Private (Admin)
exports.uploadFeedbackImage = async (req, res, next) => {
  try {
    const { imageData } = req.body;
    if (!imageData) {
      return res.status(400).json({ success: false, message: 'Image data is required' });
    }

    const matches = imageData.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ success: false, message: 'Invalid image format. Allowed: PNG, JPG, JPEG, WEBP' });
    }

    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const buffer = Buffer.from(matches[2], 'base64');

    if (!verifyImageMagicBytes(buffer)) {
      return res.status(400).json({ success: false, message: 'Invalid image file content' });
    }

    // Size limit: 5MB
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'Image size must be under 5MB' });
    }

    const labId = (req.user.lab || 'unknown').toString().replace(/[^a-zA-Z0-9]/g, '');
    const filename = `${labId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, buffer);

    const imageUrl = `/uploads/feedback/${filename}`;
    const fullUrl = `${req.protocol}://${req.get('host')}${imageUrl}`;

    res.status(200).json({
      success: true,
      data: { url: fullUrl, path: imageUrl },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all feedback for the admin's lab
// @route   GET /api/feedback
// @access  Private (Admin)
exports.getMyFeedback = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'super-admin') {
      // Super admin sees all; filters applied below
    } else if (req.user.role === 'admin') {
      query.lab = req.user.lab;
    } else {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Apply filters
    if (req.query.status) query.status = req.query.status;
    if (req.query.priority) query.priority = req.query.priority;
    if (req.query.type) query.type = req.query.type;
    if (req.query.lab && req.user.role === 'super-admin') query.lab = req.query.lab;
    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const total = await Feedback.countDocuments(query);

    const feedback = await Feedback.find(query)
      .populate('admin', 'name email phone')
      .populate('lab', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const pagination = {};
    if (page * limit < total) pagination.next = { page: page + 1, limit };
    if (page > 1) pagination.prev = { page: page - 1, limit };

    res.status(200).json({
      success: true,
      count: feedback.length,
      total,
      pagination,
      data: feedback,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single feedback
// @route   GET /api/feedback/:id
// @access  Private (Admin, Super Admin)
exports.getFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate('admin', 'name email phone')
      .populate('lab', 'name address phone email');

    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    // Admin can only view their own lab's feedback
    if (req.user.role !== 'super-admin') {
      if (!feedback.lab || feedback.lab._id.toString() !== req.user.lab?.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }

    res.status(200).json({ success: true, data: feedback });
  } catch (error) {
    next(error);
  }
};

// @desc    Update feedback status (Super Admin only)
// @route   PUT /api/feedback/:id
// @access  Private (Super Admin)
exports.updateFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    const { status, internalNotes } = req.body;
    const updateData = {};

    if (status) {
      const validStatuses = [
        'Pending',
        'Read',
        'Working On It',
        'Completed',
        'Rejected',
        'Need More Information',
        'Duplicate Request',
        'Planned For Future Release',
      ];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }
      updateData.status = status;
    }

    if (internalNotes !== undefined) {
      updateData.internalNotes = internalNotes;
    }

    const updated = await Feedback.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('admin', 'name email phone')
      .populate('lab', 'name');

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete feedback (Super Admin only)
// @route   DELETE /api/feedback/:id
// @access  Private (Super Admin)
exports.deleteFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    // Delete associated image files
    if (feedback.images && feedback.images.length > 0) {
      for (const imgPath of feedback.images) {
        try {
          const fullPath = path.join(__dirname, '../../', imgPath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        } catch (err) {
          // Ignore file deletion errors
        }
      }
    }

    await Feedback.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Feedback deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get feedback statistics for Super Admin dashboard
// @route   GET /api/feedback/stats
// @access  Private (Super Admin)
exports.getFeedbackStats = async (req, res, next) => {
  try {
    const total = await Feedback.countDocuments();
    const pending = await Feedback.countDocuments({ status: 'Pending' });
    const inProgress = await Feedback.countDocuments({ status: 'Working On It' });
    const completed = await Feedback.countDocuments({ status: 'Completed' });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await Feedback.countDocuments({ createdAt: { $gte: today } });

    res.status(200).json({
      success: true,
      data: {
        total,
        pending,
        inProgress,
        completed,
        todayCount,
      },
    });
  } catch (error) {
    next(error);
  }
};