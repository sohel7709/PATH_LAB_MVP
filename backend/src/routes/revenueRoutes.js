const express = require('express');
const { getRevenueData } = require('../controllers/revenueController');
const { protect, authorize } = require('../middleware/auth'); // Assuming auth middleware exists

const router = express.Router();

// Route to get revenue data
// Accessible by Admin and SuperAdmin
router.route('/')
  .get(protect, authorize('admin', 'super-admin'), getRevenueData);

module.exports = router;
