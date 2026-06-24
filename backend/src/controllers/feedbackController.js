const Feedback = require('../models/Feedback');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { createAuditLog } = require('../services/auditService');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/feedback');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// @desc    Submit new feedback (Admin)
// @route   POST /api/feedback
// @access  Private (admin)
exports.submitFeedback = async (req, res, next) => {
  try {
    const { subject, type, description, priority } = req.body;

    if (!subject || !type || !description || !priority) {
      return res.status(400).json({
        success: false,
        message: 'Please provide subject, type, description, and priority',
      });
    }

    // Handle image uploads
    const imagePaths = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        imagePaths.push(`/uploads/feedback/${file.filename}`);
      }
    }

    const feedback = await Feedback.create({
      subject,
      type,
      description,
      priority,
      images: imagePaths,
      admin: req.user.id,
      lab: req.user.lab,
    });

    // Audit Log
    createAuditLog({
      user: req.user._id,
      role: req.user.role,
      module: 'FEEDBACK',
      action: 'SUBMIT',
      entityId: feedback._id,
      entityType: 'Feedback',
      description: `${req.user.name} submitted feedback: ${subject}`,
      newData: { subject, type, priority },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    next(error);
  }
};

// @desc    Get all feedback for current admin's lab
// @route   GET /api/feedback
// @access  Private (admin)
exports.getMyFeedback = async (req, res, next) => {
  try {
    const query = { lab: req.user.lab };

    // Filters
    if (req.query.status) query.status = req.query.status;
    if (req.query.type) query.type = req.query.type;
    if (req.query.priority) query.priority = req.query.priority;

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    const total = await Feedback.countDocuments(query);
    const feedbacks = await Feedback.find(query)
      .populate('admin', 'name email')
      .populate('lab', 'name')
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });

    const pagination = {};
    if (startIndex + limit < total) pagination.next = { page: page + 1, limit };
    if (startIndex > 0) pagination.prev = { page: page - 1, limit };

    res.status(200).json({
      success: true,
      count: feedbacks.length,
      pagination,
      total,
      data: feedbacks,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single feedback by ID (Admin - own lab only, Super Admin - any)
// @route   GET /api/feedback/:id
// @access  Private (admin, super-admin)
exports.getFeedbackById = async (req, res, next) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate('admin', 'name email phone')
      .populate('lab', 'name');

    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    // Super admin can view any feedback
    if (req.user.role !== 'super-admin') {
      // After populate, feedback.lab is { _id, name } — extract the ObjectId
      const feedbackLabId = feedback.lab._id
        ? feedback.lab._id.toString()
        : feedback.lab.toString();
      if (!req.user.lab || feedbackLabId !== req.user.lab.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }

    res.status(200).json({ success: true, data: feedback });
  } catch (error) {
    next(error);
  }
};

// =========== SUPER ADMIN ENDPOINTS ===========

// @desc    Get ALL feedback from ALL labs (Super Admin)
// @route   GET /api/feedback/super-admin/all
// @access  Private (super-admin)
exports.getAllFeedback = async (req, res, next) => {
  try {
    const query = {};

    // Filters
    if (req.query.status) query.status = req.query.status;
    if (req.query.type) query.type = req.query.type;
    if (req.query.priority) query.priority = req.query.priority;
    if (req.query.lab) query.lab = req.query.lab;

    // Date range filter
    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    const total = await Feedback.countDocuments(query);
    const feedbacks = await Feedback.find(query)
      .populate('admin', 'name email phone')
      .populate('lab', 'name')
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });

    const pagination = {};
    if (startIndex + limit < total) pagination.next = { page: page + 1, limit };
    if (startIndex > 0) pagination.prev = { page: page - 1, limit };

    res.status(200).json({
      success: true,
      count: feedbacks.length,
      pagination,
      total,
      data: feedbacks,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update feedback status (Super Admin)
// @route   PUT /api/feedback/super-admin/:id/status
// @access  Private (super-admin)
exports.updateFeedbackStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;

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

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
    }

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    const oldStatus = feedback.status;
    feedback.status = status;
    feedback.statusHistory.push({
      status,
      changedBy: req.user.id,
      changedAt: new Date(),
      note: note || '',
    });
    feedback.updatedAt = Date.now();

    await feedback.save();

    // Audit Log
    createAuditLog({
      user: req.user._id,
      role: req.user.role,
      module: 'FEEDBACK',
      action: 'STATUS_CHANGE',
      entityId: feedback._id,
      entityType: 'Feedback',
      description: `${req.user.name} changed feedback status: ${oldStatus} → ${status} for ${feedback.subject}`,
      oldData: { status: oldStatus },
      newData: { status, note: note || '' },
      req,
    });

    const populated = await Feedback.findById(feedback._id)
      .populate('admin', 'name email')
      .populate('lab', 'name');

    res.status(200).json({
      success: true,
      message: 'Feedback status updated successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add internal notes (Super Admin only)
// @route   PUT /api/feedback/super-admin/:id/notes
// @access  Private (super-admin)
exports.addInternalNote = async (req, res, next) => {
  try {
    const { notes } = req.body;

    if (!notes) {
      return res.status(400).json({
        success: false,
        message: 'Notes are required',
      });
    }

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    feedback.internalNotes = notes;
    feedback.updatedAt = Date.now();
    await feedback.save();

    const populated = await Feedback.findById(feedback._id)
      .populate('admin', 'name email')
      .populate('lab', 'name');

    res.status(200).json({
      success: true,
      message: 'Internal notes updated successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload feedback images
// @route   POST /api/feedback/upload
// @access  Private (admin)
exports.uploadFeedbackImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const imagePaths = req.files.map(
      (file) => `/uploads/feedback/${file.filename}`
    );

    res.status(200).json({
      success: true,
      data: { images: imagePaths },
    });
  } catch (error) {
    next(error);
  }
};