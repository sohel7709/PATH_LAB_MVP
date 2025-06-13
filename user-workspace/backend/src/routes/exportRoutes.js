const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();
const Lab = require('../models/Lab');
const User = require('../models/User');
const Report = require('../models/Report');
const Patient = require('../models/Patient');

// @desc    Export data in CSV or PDF format
// @route   GET /api/export/:type
// @access  Private/Super Admin
router.get('/:type', protect, authorize('super-admin'), async (req, res) => {
  try {
    const { type } = req.params;
    const { format } = req.query;
    
    if (!['labs', 'users', 'reports', 'patients', 'analytics'].includes(type)) {
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
        // Get system-wide analytics
        const totalLabs = await Lab.countDocuments();
        const totalUsers = await User.countDocuments();
        const totalReports = await Report.countDocuments();
        const totalPatients = await Patient.countDocuments();
        
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
        
        data = {
          summary: {
            totalLabs,
            totalUsers,
            totalReports,
            totalPatients
          },
          labsBySubscription,
          usersByRole
        };
        
        fileName = 'analytics-export';
        break;
    }
    
    // Format data based on requested format
    if (format === 'csv') {
      // In a real implementation, we would use a library like json2csv
      // For this example, we'll just send the JSON with a note
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}.json`);
      
      return res.status(200).json({
        success: true,
        message: 'In a production environment, this would be a CSV file',
        data
      });
    } else if (format === 'pdf') {
      // In a real implementation, we would use a library like PDFKit
      // For this example, we'll just send the JSON with a note
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}.json`);
      
      return res.status(200).json({
        success: true,
        message: 'In a production environment, this would be a PDF file',
        data
      });
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
