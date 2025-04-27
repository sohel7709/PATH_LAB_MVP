const Report = require('../models/Report');
const Lab = require('../models/Lab');
const mongoose = require('mongoose');
const moment = require('moment'); // Using moment for easier date manipulation

// @desc    Get revenue data for a lab or all labs
// @route   GET /api/revenue
// @access  Private/Admin/SuperAdmin
exports.getRevenueData = async (req, res, next) => {
  try {
    const { labId, range, from, to } = req.query;
    const user = req.user; // Assuming auth middleware adds user to req

    let startDate, endDate;
    const now = moment();

    // Determine date range based on query parameter
    switch (range) {
      case 'daily':
        startDate = now.startOf('day').toDate();
        endDate = now.endOf('day').toDate();
        break;
      case 'weekly':
        startDate = now.subtract(6, 'days').startOf('day').toDate(); // Last 7 days including today
        endDate = moment().endOf('day').toDate();
        break;
      case 'monthly':
        startDate = now.startOf('month').toDate();
        endDate = now.endOf('month').toDate();
        break;
      case 'custom':
        if (!from || !to) {
          return res.status(400).json({ success: false, message: 'Please provide both "from" and "to" dates for custom range' });
        }
        startDate = moment(from).startOf('day').toDate();
        endDate = moment(to).endOf('day').toDate();
        break;
      default:
        // Default to monthly if range is not specified or invalid
        startDate = moment().startOf('month').toDate();
        endDate = moment().endOf('month').toDate();
    }

    // --- Security Check ---
    let queryLabId;
    if (user.role === 'super-admin') {
      // Super admin can view all labs or a specific lab if labId is provided
      queryLabId = labId ? new mongoose.Types.ObjectId(labId) : null;
    } else if (user.role === 'admin') {
      // Admin can only view their own lab's revenue
      // If labId is provided, it must match the admin's lab
      if (labId && labId !== user.lab.toString()) {
        return res.status(403).json({ success: false, message: 'Admin can only view revenue for their own lab' });
      }
      queryLabId = user.lab; // Force query to user's lab
    } else {
      // Other roles (e.g., technician) are not authorized
      return res.status(403).json({ success: false, message: 'Not authorized to view revenue data' });
    }

    // --- Build Aggregation Pipeline ---
    const matchStage = {
      createdAt: { $gte: startDate, $lte: endDate },
      'testInfo.price': { $exists: true, $ne: null } // Ensure price exists
    };

    if (queryLabId) {
      matchStage.lab = queryLabId; // Filter by specific lab if applicable
    }

    const aggregationPipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, // Group by date
          dailyRevenue: { $sum: '$testInfo.price' },
          reportCount: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 } // Sort by date ascending
      },
      {
        $group: {
          _id: null, // Group all results together
          totalRevenue: { $sum: '$dailyRevenue' },
          totalReportCount: { $sum: '$reportCount' },
          revenueByDate: {
            $push: {
              date: '$_id',
              revenue: '$dailyRevenue',
              count: '$reportCount'
            }
          }
        }
      },
      {
        $project: {
          _id: 0, // Exclude the _id field
          totalRevenue: 1,
          totalReportCount: 1,
          revenueByDate: 1
        }
      }
    ];

    console.log("Aggregation Pipeline:", JSON.stringify(aggregationPipeline, null, 2));
    console.log("Query Lab ID:", queryLabId);
    console.log("Date Range:", startDate, "to", endDate);

    const results = await Report.aggregate(aggregationPipeline);

    // Handle case where no reports are found in the range
    const responseData = results[0] || {
      totalRevenue: 0,
      totalReportCount: 0,
      revenueByDate: []
    };

    res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) { // Added missing closing brace for try block above
    console.error('Error fetching revenue data:', error);
    next(error);
  }
};
