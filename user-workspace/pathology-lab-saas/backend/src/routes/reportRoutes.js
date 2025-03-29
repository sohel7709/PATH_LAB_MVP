const express = require('express');
const router = express.Router();
const { protect, authorize, checkLabAccess } = require('../middleware/auth');
const {
  createReport,
  getReports,
  getReport,
  updateReport,
  deleteReport,
  verifyReport,
  addComment
} = require('../controllers/reportController');

// All routes require authentication
router.use(protect);

// Routes for both Admin and Technician
router.route('/')
  .get(authorize('admin', 'technician'), getReports)
  .post(authorize('technician'), createReport);

router.route('/:id')
  .get(authorize('admin', 'technician'), getReport)
  .put(authorize('technician'), updateReport)
  .delete(authorize('admin'), deleteReport);

// Admin only routes
router.put('/:id/verify', authorize('admin'), verifyReport);

// Comment routes (both Admin and Technician)
router.post('/:id/comments', authorize('admin', 'technician'), addComment);

// Additional routes can be added here for features like:
// - Bulk report operations
// - Report templates
// - Report export/download
// - Report sharing/delivery

module.exports = router;