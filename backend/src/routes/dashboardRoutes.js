const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { checkSubscription } = require('../middleware/subscription');
const router = express.Router();
const User = require('../models/User');
const Report = require('../models/Report');
const Patient = require('../models/Patient');
const Lab = require('../models/Lab');
const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');
const RevenueTransaction = require('../models/RevenueTransaction');

// @desc    Get dashboard statistics for current user's lab
// @route   GET /api/dashboard/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const labFilter = req.user.role === 'super-admin'
      ? (req.query.lab ? { lab: req.query.lab } : {})
      : { lab: req.user.lab };

    const totalReports = await Report.countDocuments(labFilter);

    const userFilter = req.user.role === 'super-admin'
      ? (req.query.lab ? { lab: req.query.lab, isActive: true } : { isActive: true })
      : { lab: req.user.lab, isActive: true };
    const activeUsers = await User.countDocuments(userFilter);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayFilter = {
      ...labFilter,
      createdAt: { $gte: todayStart }
    };
    const reportsToday = await Report.countDocuments(todayFilter);

    const completedFilter = {
      ...labFilter,
      status: 'completed'
    };
    const completedReports = await Report.countDocuments(completedFilter);
    const completionRate = (totalReports > 0) ? (completedReports / totalReports) * 100 : 0;

    const pendingReports = await Report.countDocuments({
      ...labFilter,
      status: 'pending'
    });

    const samplesCollected = await Report.countDocuments(labFilter);

    const assignedTasks = req.user.role === 'technician'
      ? await Report.countDocuments({ technician: req.user.id, status: { $in: ['pending', 'in-progress'] } })
      : 0;

    const patientFilter = req.user.role === 'super-admin'
      ? (req.query.lab ? { labId: req.query.lab } : {})
      : { labId: req.user.lab };
    const totalPatients = await Patient.countDocuments(patientFilter);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const revenueFilter = {
      ...labFilter,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    };
    const reportsThisMonth = await Report.find(revenueFilter).select('testInfo.price createdAt');
    const revenueThisMonth = reportsThisMonth.reduce((sum, report) => {
        const price = report.testInfo?.price;
        const validPrice = typeof price === 'number' ? price : 0;
        return sum + validPrice;
    }, 0);

    let labName = 'Your Lab';
    if (req.user.lab) {
      const lab = await Lab.findById(req.user.lab).select('name');
      if (lab) {
        labName = lab.name;
      }
    }

    res.status(200).json({
      success: true,
      totalReports,
      totalPatients,
      revenueThisMonth,
      activeUsers,
      reportsToday,
      completionRate: completionRate.toFixed(2),
      pendingReports,
      completedReports,
      samplesCollected,
      assignedTasks,
      labName
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard stats.',
      error: error.message
    });
  }
});

// @desc    Get system-wide statistics for super admin
// @route   GET /api/dashboard/system-stats
// @access  Private/Super Admin
let _statsCache = null;
let _statsCacheTime = 0;
const STATS_CACHE_TTL = 60 * 1000;

router.get('/system-stats', protect, authorize('super-admin'), async (req, res) => {
  if (_statsCache && Date.now() - _statsCacheTime < STATS_CACHE_TTL) {
    return res.status(200).json({ success: true, data: _statsCache, cached: true });
  }

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalLabs,
      totalUsers,
      totalReports,
      activeSubscriptions,
      revenueThisMonthResult,
      recentLabs,
      recentUsers,
      labsBySubscription,
      usersByRole,
      monthlyReports,
      monthlyNewLabs,
    ] = await Promise.all([
      Lab.countDocuments(),
      User.countDocuments(),
      Report.countDocuments(),
      Subscription.countDocuments({ status: 'active' }),
      RevenueTransaction.aggregate([
        { $match: { status: 'active', activatedAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Lab.find().sort({ createdAt: -1 }).limit(5)
        .populate({ path: 'subscription.plan', select: 'planName' })
        .select('name subscription createdAt status'),
      User.find().sort({ createdAt: -1 }).limit(5)
        .populate('lab', 'name')
        .select('name email role lab'),
      Lab.aggregate([
        { $match: { 'subscription.plan': { $ne: null } } },
        { $lookup: { from: 'plans', localField: 'subscription.plan', foreignField: '_id', as: 'planDetails' } },
        { $unwind: { path: '$planDetails', preserveNullAndEmptyArrays: true } },
        { $group: { _id: '$planDetails.planName', count: { $sum: 1 } } },
        { $project: { _id: 0, planName: '$_id', count: 1 } },
      ]),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      Report.aggregate([
        { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 },
      ]),
      Lab.aggregate([
        { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 },
      ]),
    ]);

    const systemRevenueThisMonth = revenueThisMonthResult.length > 0 ? revenueThisMonthResult[0].total : 0;

    const data = {
      totalLabs,
      totalUsers,
      totalReports,
      activeSubscriptions,
      revenueThisMonth: systemRevenueThisMonth,
      recentLabs,
      recentUsers,
      labsBySubscription,
      usersByRole,
      monthlyReports,
      monthlyNewLabs
    };

    _statsCache = data;
    _statsCacheTime = Date.now();

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching system statistics.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
