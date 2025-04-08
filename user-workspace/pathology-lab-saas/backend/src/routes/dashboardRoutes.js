const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();
const User = require('../models/User');
const Report = require('../models/Report');
const Lab = require('../models/Lab');

// @desc    Get dashboard statistics for current user's lab
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

// @desc    Get system-wide statistics for super admin
// @route   GET /api/dashboard/system-stats
// @access  Private/Super Admin
router.get('/system-stats', protect, authorize('super-admin'), async (req, res) => {
  try {
    // Get total counts
    const totalLabs = await Lab.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalReports = await Report.countDocuments();
    
    // Get active subscriptions
    const activeSubscriptions = await Lab.countDocuments({
      'subscription.status': 'active'
    });
    
    // Calculate revenue (assuming subscription plans have fixed prices)
    const subscriptionPrices = {
      'basic': 100,
      'premium': 250,
      'enterprise': 500
    };
    
    const labsWithSubscriptions = await Lab.find({
      'subscription.status': 'active'
    }, 'subscription.plan');
    
    const revenueThisMonth = labsWithSubscriptions.reduce((total, lab) => {
      return total + (subscriptionPrices[lab.subscription.plan] || 0);
    }, 0);
    
    // Get recent labs
    const recentLabs = await Lab.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name subscription.plan subscription.status createdAt');
    
    // Get recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('lab', 'name')
      .select('name email role lab');
    
    // Get labs by subscription type
    const labsBySubscription = await Lab.aggregate([
      {
        $group: {
          _id: '$subscription.plan',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get users by role
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get monthly report trends
    const monthlyReports = await Report.aggregate([
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
    
    // Get monthly new labs
    const monthlyNewLabs = await Lab.aggregate([
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
        totalLabs,
        totalUsers,
        totalReports,
        activeSubscriptions,
        revenueThisMonth,
        recentLabs,
        recentUsers,
        labsBySubscription,
        usersByRole,
        monthlyReports,
        monthlyNewLabs
      }
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
