const express = require('express');
const { protect } = require('../middleware/auth');
const router = express.Router();
const User = require('../models/User');
const Report = require('../models/Report');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const totalReports = await Report.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const reportsToday = await Report.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });
    const completionRate = (totalReports > 0) ? (await Report.countDocuments({ status: 'completed' }) / totalReports) * 100 : 0;

    res.status(200).json({
      success: true,
      totalReports,
      activeUsers,
      reportsToday,
      completionRate: completionRate.toFixed(2) // Return as percentage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
