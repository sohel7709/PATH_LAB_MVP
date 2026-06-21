const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();
const Lab = require('../models/Lab');
const User = require('../models/User');
const Report = require('../models/Report');
const Patient = require('../models/Patient');

// @desc    Export data in CSV or PDF format
// @route   GET /api/export/:type
// @access  Private/Admin, Super Admin
router.get('/:type', protect, authorize('admin', 'super-admin'), async (req, res) => {
  try {
    const { type } = req.params;
    const { format } = req.query;
    
    if (!['labs', 'users', 'reports', 'patients', 'analytics', 'revenue'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid export type'
      });
    }
    
    if (!['csv', 'pdf'].includes(format)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid export format'
      });
    }
    
    let data;
    let fileName;
    
    // Get data based on type
    switch (type) {
      case 'labs':
        data = await Lab.find().select('-__v');
        fileName = 'labs-export';
        break;
      case 'users':
        data = await User.find().select('-password -__v').populate('lab', 'name');
        fileName = 'users-export';
        break;
      case 'reports':
        data = await Report.find().select('-__v').populate('patient', 'name');
        fileName = 'reports-export';
        break;
      case 'patients':
        data = await Patient.find().select('-__v');
        fileName = 'patients-export';
        break;
      case 'analytics':
        const totalLabs = await Lab.countDocuments();
        const totalUsers = await User.countDocuments();
        const totalReports = await Report.countDocuments();
        const totalPatients = await Patient.countDocuments();
        
        const labsBySubscription = await Lab.aggregate([
          { $group: { _id: '$subscription.plan', count: { $sum: 1 } } }
        ]);
        
        const usersByRole = await User.aggregate([
          { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);
        
        data = {
          summary: { totalLabs, totalUsers, totalReports, totalPatients },
          labsBySubscription,
          usersByRole
        };
        fileName = 'analytics-export';
        break;
      case 'revenue':
        const RevenueTransaction = require('../models/RevenueTransaction');
        data = await RevenueTransaction.find({ status: 'active' })
          .populate('lab', 'name')
          .populate('admin', 'name email')
          .populate('subscriptionPlan', 'name price')
          .populate('activatedBy', 'name')
          .sort({ activatedAt: -1 })
          .lean();
        fileName = 'revenue-export';
        break;
    }
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}.json`);
      return res.status(200).json({ success: true, data });
    } else if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}.json`);
      return res.status(200).json({ success: true, data });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;