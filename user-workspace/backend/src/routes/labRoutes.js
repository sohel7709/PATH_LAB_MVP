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
  // updateLabSubscription, // Replaced by assignPlanToLab
  assignPlanToLab, // Import the new controller function
  getSubscriptionHistoryForLab // Import the history controller function
} = require('../controllers/labController');

// All routes require authentication
router.use(protect);

// Lab creation and listing routes
router.route('/')
  .post(authorize('super-admin'), createLab) // Only super-admin can create labs
  .get(authorize('super-admin'), getLabs);

// Lab-specific routes
router.route('/:id')
  .get(authorize('super-admin', 'admin'), checkLabAccess, getLab)
  .put(authorize('super-admin', 'admin'), checkLabAccess, updateLab)
  .delete(authorize('super-admin'), deleteLab);

// Lab statistics route
router.get('/:id/stats', authorize('super-admin', 'admin'), checkLabAccess, getLabStats);

// Assign plan to lab route (Super Admin only)
// Using :labId to be consistent with the controller function parameter name
router.post('/:labId/assign-plan', authorize('super-admin'), assignPlanToLab);

// Get subscription history for a specific lab (Super Admin or Lab Admin)
router.get('/:labId/subscription-history', authorize('super-admin', 'admin'), checkLabAccess, getSubscriptionHistoryForLab);


module.exports = router;
