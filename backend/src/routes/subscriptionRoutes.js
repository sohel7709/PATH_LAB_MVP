// backend/src/routes/subscriptionRoutes.js
const express = require('express');
const {
    getCurrentSubscription,
    initiateUpgrade,
    handlePaymentWebhook,
    modifySubscriptionBySuperAdmin, // Import Super Admin function
    getAllSubscriptions // Import Super Admin function
} = require('../controllers/subscriptionController');
// Explicitly import middleware functions
const authMiddleware = require('../middleware/auth');
const protect = authMiddleware.protect;
const authorize = authMiddleware.authorize;

const router = express.Router();

// --- DEBUG LOGS ---
console.log('[subscriptionRoutes] Type of protect:', typeof protect);
console.log('[subscriptionRoutes] Type of authorize:', typeof authorize);
console.log('[subscriptionRoutes] Type of getCurrentSubscription:', typeof getCurrentSubscription);
console.log('[subscriptionRoutes] Type of initiateUpgrade:', typeof initiateUpgrade);
console.log('[subscriptionRoutes] Type of handlePaymentWebhook:', typeof handlePaymentWebhook);
console.log('[subscriptionRoutes] Type of getAllSubscriptions:', typeof getAllSubscriptions);
console.log('[subscriptionRoutes] Type of modifySubscriptionBySuperAdmin:', typeof modifySubscriptionBySuperAdmin);
// --- END DEBUG LOGS ---


// Note: The base path for these routes will likely be /api/subscriptions

// @route   GET /api/subscriptions/current
// @desc    Get the current subscription details for the logged-in user's lab
// @access  Private (Requires authenticated user - checkSubscription middleware runs via app.js)
router.get('/current', protect, getCurrentSubscription); // Use protect middleware

// @route   POST /api/subscriptions/upgrade
// @desc    Initiate the plan upgrade process (placeholder)
// @access  Private (Requires Lab Admin role)
router.post('/upgrade', protect, authorize('admin'), initiateUpgrade); // Use protect middleware

// @route   POST /api/subscriptions/webhook/razorpay (Example)
// @desc    Handle incoming webhook from Razorpay (placeholder)
// @access  Public (Needs signature verification within the controller)
router.post('/webhook/razorpay', handlePaymentWebhook);

// Add other webhook endpoints if supporting multiple providers (e.g., /webhook/stripe)


// --- Super Admin Routes ---

// @route   GET /api/subscriptions/all
// @desc    Get all subscriptions (Super Admin only)
// @access  Private (Super Admin)
router.get('/all', protect, authorize('superadmin'), getAllSubscriptions); // Use protect middleware

// @route   PUT /api/subscriptions/:subscriptionId/modify
// @desc    Modify a specific subscription (Super Admin only)
// @access  Private (Super Admin)
router.put('/:subscriptionId/modify', protect, authorize('superadmin'), modifySubscriptionBySuperAdmin); // Use protect middleware


module.exports = router;
