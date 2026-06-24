const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createFeedback,
  getMyFeedback,
  getFeedback,
  updateFeedback,
  deleteFeedback,
  uploadFeedbackImage,
  getFeedbackStats,
} = require('../controllers/feedbackController');

// All routes require authentication
router.use(protect);

// Admin routes
router.post('/', authorize('admin', 'super-admin'), createFeedback);
router.get('/', authorize('admin', 'super-admin'), getMyFeedback);

// Image upload route
router.post('/upload-image', authorize('admin', 'super-admin'), uploadFeedbackImage);

// Stats route (super admin only)
router.get('/stats', authorize('super-admin'), getFeedbackStats);

// Single feedback operations
router.get('/:id', authorize('admin', 'super-admin'), getFeedback);
router.put('/:id', authorize('super-admin'), updateFeedback);
router.delete('/:id', authorize('super-admin'), deleteFeedback);

module.exports = router;