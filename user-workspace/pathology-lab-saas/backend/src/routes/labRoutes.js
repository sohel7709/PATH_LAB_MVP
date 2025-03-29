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
  updateLabSubscription
} = require('../controllers/labController');

// All routes require authentication
router.use(protect);

// Super Admin only routes
router.route('/')
  .post(authorize('super-admin'), createLab)
  .get(authorize('super-admin'), getLabs);

router.route('/:id')
  .get(authorize('super-admin', 'admin'), checkLabAccess, getLab)
  .put(authorize('super-admin', 'admin'), checkLabAccess, updateLab)
  .delete(authorize('super-admin'), deleteLab);

// Lab statistics route
router.get('/:id/stats', authorize('super-admin', 'admin'), checkLabAccess, getLabStats);

// Subscription management route (Super Admin only)
router.put('/:id/subscription', authorize('super-admin'), updateLabSubscription);

module.exports = router;