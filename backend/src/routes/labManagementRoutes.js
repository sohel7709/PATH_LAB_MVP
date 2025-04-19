const express = require('express');
const router = express.Router();
const { protect, authorize, checkLabAccess } = require('../middleware/auth');
const {
  createLab,
  getLabs,
  getLab,
  updateLab,
  deleteLab,
  getLabStats,
  assignPlanToLab,
  getSubscriptionHistoryForLab
} = require('../controllers/labController');

// All routes require authentication
router.use(protect);

// Super Admin routes
router.route('/')
  .post(authorize('super-admin'), createLab) // Create a new lab
  .get(authorize('super-admin'), getLabs); // Get all labs

router.route('/:id')
  .get(authorize('super-admin', 'admin', 'technician'), checkLabAccess, getLab) // Get a specific lab
  .put(authorize('super-admin', 'admin'), checkLabAccess, updateLab) // Update a specific lab
  .delete(authorize('super-admin'), deleteLab); // Delete a specific lab

// Lab statistics route
router.get('/:id/stats', authorize('super-admin', 'admin'), checkLabAccess, getLabStats); // Get lab statistics

// Subscription management routes (Super Admin only)
router.post('/:id/assign-plan', authorize('super-admin'), assignPlanToLab); // Assign plan to lab
router.get('/:id/subscription-history', authorize('super-admin', 'admin'), checkLabAccess, getSubscriptionHistoryForLab); // Get subscription history

module.exports = router;
