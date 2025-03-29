const Report = require('../models/Report');
const Lab = require('../models/Lab');
const User = require('../models/User');

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

    // If technician, only show their reports
    if (req.user.role === 'technician') {
      query.technician = req.user.id;
    }

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
    if (
      report.lab.toString() !== req.user.lab.toString() ||
      (req.user.role === 'technician' && report.technician.toString() !== req.user.id)
    ) {
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
    if (
      report.lab.toString() !== req.user.lab.toString() ||
      (req.user.role === 'technician' && report.technician.toString() !== req.user.id)
    ) {
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

    // Update report metadata
    req.body.reportMeta = {
      ...report.reportMeta,
      lastModifiedAt: Date.now(),
      lastModifiedBy: req.user.id,
      version: (report.reportMeta.version || 1) + 1
    };

    report = await Report.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: report
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

    await report.remove();

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
    if (
      report.lab.toString() !== req.user.lab.toString() ||
      (req.user.role === 'technician' && report.technician.toString() !== req.user.id)
    ) {
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