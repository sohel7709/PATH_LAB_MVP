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

// Allow all roles to create a lab
router.route('/')
  .post(createLab) // Removed authorization check for lab creation
  .get(authorize('super-admin'), getLabs);

router.route('/:id')
  .get(authorize('super-admin', 'admin'), getLab)
  .put(authorize('super-admin', 'admin'), updateLab)
  .delete(authorize('super-admin'), deleteLab);

// Lab statistics route
router.get('/:id/stats', authorize('super-admin', 'admin'), getLabStats);

// Subscription management route (Super Admin only)
router.put('/:id/subscription', authorize('super-admin'), updateLabSubscription);

module.exports = router;
