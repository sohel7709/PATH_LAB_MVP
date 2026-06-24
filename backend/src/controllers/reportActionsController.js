const Report = require('../models/Report');
const User = require('../models/User');
const { createAuditLog } = require('../services/auditService');

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

    if (report.lab.toString() !== req.user.lab.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to verify this report'
      });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Only Admins can verify reports.'
        });
    }

    const oldStatus = report.status;
    report.status = 'verified';
    report.verifiedBy = req.user.id;
    report.reportMeta = report.reportMeta || {};
    report.reportMeta.lastModifiedAt = Date.now();
    report.reportMeta.lastModifiedBy = req.user.id;
    report.reportMeta.verifiedAt = Date.now();

    await report.save();

    // Audit Log
    createAuditLog({
      user: req.user._id,
      role: req.user.role,
      module: 'REPORTS',
      action: 'VERIFY',
      entityId: report._id,
      entityType: 'Report',
      description: `${req.user.name} verified report for ${report.patientInfo?.name || 'Unknown'}`,
      oldData: { status: oldStatus },
      newData: { status: 'verified' },
      req,
    });

    const populatedReport = await Report.findById(report._id).populate('verifiedBy', 'name email');

    res.status(200).json({
      success: true,
      data: populatedReport
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

    if (report.lab.toString() !== req.user.lab.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to comment on this report'
      });
    }

    const comment = {
      user: req.user.id,
      text: req.body.text,
      createdAt: Date.now()
    };

    report.comments = report.comments || [];
    report.comments.push(comment);

    report.reportMeta = report.reportMeta || {};
    report.reportMeta.lastModifiedAt = Date.now();
    report.reportMeta.lastModifiedBy = req.user.id;

    await report.save();

    const populatedReport = await Report.findById(report._id)
        .populate('comments.user', 'name email role');

    res.status(200).json({
      success: true,
      data: populatedReport
    });
  } catch (error) {
    next(error);
  }
};