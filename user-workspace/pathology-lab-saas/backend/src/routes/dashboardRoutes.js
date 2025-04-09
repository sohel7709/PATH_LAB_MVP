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
    // For super-admin, show all stats unless a lab is specified
    // For admin and technician, only show stats for their lab
    const labFilter = req.user.role === 'super-admin' 
      ? (req.query.lab ? { lab: req.query.lab } : {})
      : { lab: req.user.lab };
    
    // Get reports for the lab
    const totalReports = await Report.countDocuments(labFilter);
    
    // Get active users for the lab
    const userFilter = req.user.role === 'super-admin'
      ? (req.query.lab ? { lab: req.query.lab, isActive: true } : { isActive: true })
      : { lab: req.user.lab, isActive: true };
    const activeUsers = await User.countDocuments(userFilter);
    
    // Get reports created today for the lab
    const todayFilter = {
      ...labFilter,
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    };
    const reportsToday = await Report.countDocuments(todayFilter);
    
    // Calculate completion rate for the lab
    const completedFilter = {
      ...labFilter,
      status: 'completed'
    };
    const completedReports = await Report.countDocuments(completedFilter);
    const completionRate = (totalReports > 0) ? (completedReports / totalReports) * 100 : 0;

    // Get pending reports for the lab
    const pendingReports = await Report.countDocuments({
      ...labFilter,
      status: 'pending'
    });

    // Get samples collected for the lab
    const samplesCollected = await Report.countDocuments(labFilter);

    // Get assigned tasks for the technician
    const assignedTasks = req.user.role === 'technician'
      ? await Report.countDocuments({ technician: req.user.id, status: { $in: ['pending', 'in-progress'] } })
      : 0;

    res.status(200).json({
      success: true,
      totalReports,
      activeUsers,
      reportsToday,
      completionRate: completionRate.toFixed(2), // Return as percentage
      pendingReports,
      completedReports,
      samplesCollected,
      assignedTasks
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
