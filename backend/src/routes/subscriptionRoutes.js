const express = require('express');
const {
  getActivePlans,
  requestSubscription,
  getCurrentSubscription,
  getAllLabSubscriptions,
  activateSubscription,
  cancelSubscription,
  extendSubscription,
  changePlan,
  getSubscriptionHistory,
  checkSubscriptionStatus,
} = require('../controllers/subscriptionController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// --- User Routes (Admin / Technician) ---

// Get active plans for viewing
router.get('/plans', protect, getActivePlans);

// Request a subscription plan (Admin only)
router.post('/request', protect, authorize('admin'), requestSubscription);

// Get current lab's subscription
router.get('/current', protect, getCurrentSubscription);

// Check subscription status (lightweight)
router.get('/status', protect, checkSubscriptionStatus);

// --- Super Admin Routes ---

// Get all lab subscriptions
router.get('/admin/all', protect, authorize('super-admin'), getAllLabSubscriptions);

// Activate subscription for a lab
router.post('/admin/activate', protect, authorize('super-admin'), activateSubscription);

// Cancel subscription
router.post('/admin/cancel', protect, authorize('super-admin'), cancelSubscription);

// Extend subscription
router.post('/admin/extend', protect, authorize('super-admin'), extendSubscription);

// Change plan
router.post('/admin/change-plan', protect, authorize('super-admin'), changePlan);

// Subscription history for a lab
router.get('/admin/history/:labId', protect, authorize('super-admin'), getSubscriptionHistory);

module.exports = router;