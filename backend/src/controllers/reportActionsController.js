const Report = require('../models/Report');
const User = require('../models/User'); // Potentially needed for populating user info in comments

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

    // Check if the user performing the action is an Admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Only Admins can verify reports.'
        });
    }

    report.status = 'verified';
    report.verifiedBy = req.user.id;
    // Ensure reportMeta exists before updating
    report.reportMeta = report.reportMeta || {};
    report.reportMeta.lastModifiedAt = Date.now();
    report.reportMeta.lastModifiedBy = req.user.id;
    report.reportMeta.verifiedAt = Date.now(); // Add verification timestamp

    await report.save();

    // Populate verifiedBy before sending response
    const populatedReport = await Report.findById(report._id).populate('verifiedBy', 'name email');

    res.status(200).json({
      success: true,
      data: populatedReport // Send populated report
    });
  } catch (error) {
    console.error('Error verifying report:', error);
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
      text: req.body.text,
      createdAt: Date.now() // Add timestamp to comment
    };

    // Ensure comments array exists
    report.comments = report.comments || [];
    report.comments.push(comment);

    // Update report metadata for modification tracking
    report.reportMeta = report.reportMeta || {};
    report.reportMeta.lastModifiedAt = Date.now();
    report.reportMeta.lastModifiedBy = req.user.id;

    await report.save();

    // Populate user details in the comments before sending response
    const populatedReport = await Report.findById(report._id)
        .populate('comments.user', 'name email role'); // Populate user details in comments

    res.status(200).json({
      success: true,
      data: populatedReport // Send report with populated comments
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    next(error);
  }
};
