const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getRevenueStats,
  getRevenueTransactions,
  getMonthlyRevenueChart,
  getPlanSalesChart,
} = require('../controllers/superAdminRevenueController');

const router = express.Router();

// All routes require super-admin access
router.use(protect);
router.use(authorize('super-admin'));

router.get('/', getRevenueStats);
router.get('/transactions', getRevenueTransactions);
router.get('/monthly-chart', getMonthlyRevenueChart);
router.get('/plan-chart', getPlanSalesChart);

module.exports = router;