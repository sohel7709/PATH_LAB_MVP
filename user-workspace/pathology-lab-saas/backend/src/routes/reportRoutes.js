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
  .get(authorize('admin', 'technician'), checkLabAccess, getReports)
  .post(authorize('admin', 'technician'), checkLabAccess, createReport);

router.route('/:id')
  .get(authorize('admin', 'technician'), checkLabAccess, getReport)
  .put(authorize('admin', 'technician'), checkLabAccess, updateReport)
  .delete(authorize('admin'), checkLabAccess, deleteReport);

// Admin only routes
router.put('/:id/verify', authorize('admin'), checkLabAccess, verifyReport);

// Comment routes (both Admin and Technician)
router.post('/:id/comments', authorize('admin', 'technician'), checkLabAccess, addComment);

// Additional routes can be added here for features like:
// - Bulk report operations
// - Report templates
// - Report export/download
// - Report sharing/delivery

module.exports = router;
