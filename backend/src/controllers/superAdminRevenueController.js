const RevenueTransaction = require('../models/RevenueTransaction');
const Subscription = require('../models/Subscription');

// @desc    Get revenue statistics for Super Admin
// @route   GET /api/super-admin/revenue
// @access  Private (Super Admin)
exports.getRevenueStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const totalRevenueResult = await RevenueTransaction.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

    const monthlyRevenueResult = await RevenueTransaction.aggregate([
      { $match: { status: 'active', activatedAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const monthlyRevenue = monthlyRevenueResult.length > 0 ? monthlyRevenueResult[0].total : 0;

    const yearlyRevenueResult = await RevenueTransaction.aggregate([
      { $match: { status: 'active', activatedAt: { $gte: startOfYear } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const yearlyRevenue = yearlyRevenueResult.length > 0 ? yearlyRevenueResult[0].total : 0;

    const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });
    const subscribedLabs = await Subscription.distinct('lab', { status: 'active' });
    const totalLabsSubscribed = subscribedLabs.length;

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        monthlyRevenue,
        yearlyRevenue,
        activeSubscriptions,
        totalLabsSubscribed,
      },
    });
  } catch (error) {
    console.error('Error fetching revenue stats:', error);
    res.status(500).json({ success: false, message: 'Error fetching revenue stats', error: error.message });
  }
};

// @desc    Get all revenue transactions
// @route   GET /api/super-admin/revenue/transactions
// @access  Private (Super Admin)
exports.getRevenueTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const transactions = await RevenueTransaction.find({ status: 'active' })
      .populate('lab', 'name')
      .populate('admin', 'name email')
      .populate('subscriptionPlan', 'name price')
      .populate('activatedBy', 'name')
      .sort({ activatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await RevenueTransaction.countDocuments({ status: 'active' });

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: transactions,
    });
  } catch (error) {
    console.error('Error fetching revenue transactions:', error);
    res.status(500).json({ success: false, message: 'Error fetching transactions', error: error.message });
  }
};

// @desc    Get monthly revenue data for charts
// @route   GET /api/super-admin/revenue/monthly-chart
// @access  Private (Super Admin)
exports.getMonthlyRevenueChart = async (req, res) => {
  try {
    const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();

    const monthlyData = await RevenueTransaction.aggregate([
      {
        $match: {
          status: 'active',
          activatedAt: {
            $gte: new Date(year, 0, 1),
            $lt: new Date(year + 1, 0, 1),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$activatedAt' },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chartData = monthNames.map((month, index) => {
      const found = monthlyData.find(d => d._id === index + 1);
      return {
        month,
        revenue: found ? found.revenue : 0,
        subscriptions: found ? found.count : 0,
      };
    });

    res.status(200).json({
      success: true,
      data: chartData,
    });
  } catch (error) {
    console.error('Error fetching monthly chart:', error);
    res.status(500).json({ success: false, message: 'Error fetching chart data', error: error.message });
  }
};

// @desc    Get subscriptions by plan (for chart)
// @route   GET /api/super-admin/revenue/plan-chart
// @access  Private (Super Admin)
exports.getPlanSalesChart = async (req, res) => {
  try {
    const planData = await RevenueTransaction.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$subscriptionPlan',
          subscriptions: { $sum: 1 },
          revenue: { $sum: '$amount' },
        },
      },
      {
        $lookup: {
          from: 'plans',
          localField: '_id',
          foreignField: '_id',
          as: 'plan',
        },
      },
      { $unwind: '$plan' },
      {
        $project: {
          planName: '$plan.name',
          subscriptions: 1,
          revenue: 1,
        },
      },
      { $sort: { subscriptions: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: planData,
    });
  } catch (error) {
    console.error('Error fetching plan chart:', error);
    res.status(500).json({ success: false, message: 'Error fetching chart data', error: error.message });
  }
};