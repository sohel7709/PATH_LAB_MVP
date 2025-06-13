const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { checkSubscription } = require('../middleware/subscription'); // Import subscription check
const router = express.Router();
const User = require('../models/User');
const Report = require('../models/Report');
const Patient = require('../models/Patient'); // Import Patient model
const Lab = require('../models/Lab');
const Subscription = require('../models/Subscription'); // Import Subscription model
const Plan = require('../models/Plan'); // Import Plan model

// @desc    Get dashboard statistics for current user's lab
// @route   GET /api/dashboard/stats
// @access  Private
// Temporarily removed checkSubscription for debugging revenue calculation
router.get('/stats', protect, async (req, res) => { 
  try {
    // // Skip check for super-admin as they don't have a lab subscription tied directly
    // if (req.user.role !== 'super-admin' && !req.hasActiveSubscription) { // Check flag set by checkSubscription middleware
    //     return res.status(403).json({
    //         success: false,
    //         message: 'An active subscription is required to view dashboard statistics.'
    //     });
    // }

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
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayFilter = {
      ...labFilter,
      createdAt: { $gte: todayStart }
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

    // Get total patients for the lab
    const patientFilter = req.user.role === 'super-admin'
      ? (req.query.lab ? { labId: req.query.lab } : {})
      : { labId: req.user.lab };
    const totalPatients = await Patient.countDocuments(patientFilter);

    // Calculate revenue for the current month for the lab
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999); // End of the last day of the month

    const revenueFilter = {
      ...labFilter, // Use the same lab filter as for reports
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    };
    // Fetch reports within the date range and select only the price
    const reportsThisMonth = await Report.find(revenueFilter).select('testInfo.price createdAt'); // Also select createdAt for logging
    console.log(`[Dashboard Stats] Found ${reportsThisMonth.length} reports for revenue calculation this month.`); // Log count
    // Log details of reports being summed
    // reportsThisMonth.forEach(report => {
    //   console.log(`[Dashboard Stats] Report ID: ${report._id}, Price: ${report.testInfo?.price}, Created: ${report.createdAt}`);
    // });

    // Sum the prices, ensuring price exists and is a number
    const revenueThisMonth = reportsThisMonth.reduce((sum, report) => {
        const price = report.testInfo?.price;
        const validPrice = typeof price === 'number' ? price : 0;
        // console.log(`[Dashboard Stats] Summing report ${report._id}: current sum ${sum}, price ${price}, adding ${validPrice}`); // Detailed log per report
        return sum + validPrice;
    }, 0);
    console.log(`[Dashboard Stats] Calculated revenueThisMonth: ${revenueThisMonth}`); // Log final calculated value

    // Fetch lab name to include in response
    let labName = 'Your Lab';
    if (req.user.lab) {
      const lab = await Lab.findById(req.user.lab).select('name');
      if (lab) {
        labName = lab.name;
      }
    }

    // Send the final response with all calculated stats and lab name
    res.status(200).json({
      success: true,
      totalReports,
      totalPatients, // Include total patients
      revenueThisMonth, // Include monthly revenue
      activeUsers,
      reportsToday,
      completionRate: completionRate.toFixed(2), // Return as percentage
      pendingReports,
      completedReports,
      samplesCollected,
      assignedTasks,
      labName
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error); // Log the error
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard stats.', // More specific message
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

    // Get active subscriptions count directly from Subscription collection
    const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });

    // Calculate revenue from active subscriptions
    const activeSubsDetails = await Subscription.find({ status: 'active' }).populate('planId', 'price');
    const systemRevenueThisMonth = activeSubsDetails.reduce((total, sub) => { // Renamed variable
        return total + (sub.planId?.price || 0);
    }, 0);

    // Get recent labs with populated current subscription and plan details
    const recentLabs = await Lab.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({
          path: 'subscription.plan', // Populate the plan details within the subscription object
          select: 'planName' // Select plan name from Plan
      })
      .select('name subscription createdAt status'); // Select relevant Lab fields including the subscription object
    // Get recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('lab', 'name')
      .select('name email role lab');

    // Get labs by subscription type using the simplified structure based on Lab.subscription.plan
    const labsBySubscription = await Lab.aggregate([
        {
            $match: { 'subscription.plan': { $ne: null } } // Consider only labs where a plan is assigned in the subscription object
        },
        {
            $lookup: { // Join Lab directly with Plan using the plan ID stored in Lab.subscription.plan
                from: 'plans',
                localField: 'subscription.plan',
                foreignField: '_id',
                as: 'planDetails'
            }
        },
        {
            $unwind: { // Deconstruct the planDetails array (should be one plan per lab)
                path: '$planDetails',
                preserveNullAndEmptyArrays: true // Keep labs even if plan lookup fails (though $match should prevent this)
            }
        },
        {
            $group: { // Group by the plan name obtained from the joined Plan document
                _id: '$planDetails.planName', // Group by the actual plan name
                count: { $sum: 1 }
            }
        },
        {
             $project: { // Rename _id to planName for clearer output
                 _id: 0, // Exclude the default _id field
                 planName: '$_id', // Rename the grouping key (_id) to planName
                 count: 1 // Include the count
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
        revenueThisMonth: systemRevenueThisMonth, // Use renamed variable
        recentLabs,
        recentUsers,
        labsBySubscription,
        usersByRole,
        monthlyReports,
        monthlyNewLabs
      }
    });
  } catch (error) {
    console.error('Error in /api/dashboard/system-stats:', error);
    console.error('Stack Trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error fetching system statistics.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
