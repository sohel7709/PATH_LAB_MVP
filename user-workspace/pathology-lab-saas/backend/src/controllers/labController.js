const Lab = require('../models/Lab');
const User = require('../models/User');
const Report = require('../models/Report');

// @desc    Create new lab
// @route   POST /api/super-admin/labs
// @access  Private/Super Admin
exports.createLab = async (req, res, next) => {
  try {
    // Add user as lab creator
    req.body.createdBy = req.user.id;

    const lab = await Lab.create(req.body);

    res.status(201).json({
      success: true,
      data: lab
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all labs
// @route   GET /api/super-admin/labs
// @access  Private/Super Admin
exports.getLabs = async (req, res, next) => {
  try {
    const labs = await Lab.find()
      .populate({
        path: 'createdBy',
        select: 'name email'
      })
      .populate({
        path: 'users',
        select: 'name email role'
      });

    res.status(200).json({
      success: true,
      count: labs.length,
      data: labs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single lab
// @route   GET /api/super-admin/labs/:id
// @access  Private/Super Admin/Admin
exports.getLab = async (req, res, next) => {
  try {
    const lab = await Lab.findById(req.params.id)
      .populate({
        path: 'createdBy',
        select: 'name email'
      })
      .populate({
        path: 'users',
        select: 'name email role'
      });

    if (!lab) {
      return res.status(404).json({
        success: false,
        message: 'Lab not found'
      });
    }

    // Check if user has access to this lab
    if (req.user.role !== 'super-admin' && req.user.lab.toString() !== lab._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this lab'
      });
    }

    res.status(200).json({
      success: true,
      data: lab
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update lab
// @route   PUT /api/super-admin/labs/:id
// @access  Private/Super Admin/Admin
exports.updateLab = async (req, res, next) => {
  try {
    let lab = await Lab.findById(req.params.id);

    if (!lab) {
      return res.status(404).json({
        success: false,
        message: 'Lab not found'
      });
    }

    // Check if user has access to update this lab
    if (req.user.role !== 'super-admin' && req.user.lab.toString() !== lab._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this lab'
      });
    }

    // Prevent admin from updating certain fields
    if (req.user.role === 'admin') {
      const restrictedFields = ['subscription', 'createdBy', 'stats'];
      restrictedFields.forEach(field => {
        delete req.body[field];
      });
    }

    lab = await Lab.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: lab
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete lab
// @route   DELETE /api/super-admin/labs/:id
// @access  Private/Super Admin
exports.deleteLab = async (req, res, next) => {
  try {
    const lab = await Lab.findById(req.params.id);

    if (!lab) {
      return res.status(404).json({
        success: false,
        message: 'Lab not found'
      });
    }

    // Delete all associated users
    await User.deleteMany({ lab: lab._id });

    // Delete all associated reports
    await Report.deleteMany({ lab: lab._id });

    // Delete the lab
    await lab.remove();

    res.status(200).json({
      success: true,
      message: 'Lab deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get lab statistics
// @route   GET /api/super-admin/labs/:id/stats
// @access  Private/Super Admin/Admin
exports.getLabStats = async (req, res, next) => {
  try {
    const lab = await Lab.findById(req.params.id);

    if (!lab) {
      return res.status(404).json({
        success: false,
        message: 'Lab not found'
      });
    }

    // Check if user has access to this lab
    if (req.user.role !== 'super-admin' && req.user.lab.toString() !== lab._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this lab stats'
      });
    }

    // Get reports statistics
    const reportsStats = await Report.aggregate([
      { $match: { lab: lab._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get users statistics
    const usersStats = await User.aggregate([
      { $match: { lab: lab._id } },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get monthly report trends
    const monthlyReports = await Report.aggregate([
      { $match: { lab: lab._id } },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        reportsStats,
        usersStats,
        monthlyReports
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update lab subscription
// @route   PUT /api/super-admin/labs/:id/subscription
// @access  Private/Super Admin
exports.updateLabSubscription = async (req, res, next) => {
  try {
    const { plan, status, endDate } = req.body;

    const lab = await Lab.findById(req.params.id);

    if (!lab) {
      return res.status(404).json({
        success: false,
        message: 'Lab not found'
      });
    }

    lab.subscription.plan = plan || lab.subscription.plan;
    lab.subscription.status = status || lab.subscription.status;
    lab.subscription.endDate = endDate || lab.subscription.endDate;

    await lab.save();

    res.status(200).json({
      success: true,
      data: lab
    });
  } catch (error) {
    next(error);
  }
};