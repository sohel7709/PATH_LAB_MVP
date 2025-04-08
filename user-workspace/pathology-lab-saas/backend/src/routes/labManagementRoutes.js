const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createLab,
  getLabs,
  getLab,
  updateLab,
  deleteLab,
  getLabStats,
  updateLabSubscription
} = require('../controllers/labController');

// All routes require authentication
router.use(protect);

// Super Admin routes
router.route('/')
  .post(authorize('super-admin'), createLab) // Create a new lab
  .get(authorize('super-admin'), getLabs); // Get all labs

router.route('/:id')
  .get(authorize('super-admin', 'admin'), getLab) // Get a specific lab
  .put(authorize('super-admin', 'admin'), updateLab) // Update a specific lab
  .delete(authorize('super-admin'), deleteLab); // Delete a specific lab

// Lab statistics route
router.get('/:id/stats', authorize('super-admin', 'admin'), getLabStats); // Get lab statistics

// Subscription management route (Super Admin only)
router.put('/:id/subscription', authorize('super-admin'), updateLabSubscription); // Update lab subscription

module.exports = router;
