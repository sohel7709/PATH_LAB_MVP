const express = require('express');
const router = express.Router();
const { protect, authorize, checkLabAccess } = require('../middleware/auth');
const {
  createReport,
  getReports,
  getReport,
  updateReport,
  deleteReport,
  servePublicReportPdf
} = require('../controllers/reportCrudController'); // Import CRUD functions
const {
  verifyReport,
  addComment
} = require('../controllers/reportActionsController'); // Import action functions
const {
  generateHtmlReport,
  generatePdfReport,
  testTemplate
} = require('../controllers/reportGenerationController'); // Import generation functions

// Public route for PDF - This should be defined BEFORE router.use(protect)
router.get('/public/:id/pdf', servePublicReportPdf);

// All subsequent routes require authentication
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

// Report generation routes (both Admin and Technician)
router.get('/:id/html', authorize('admin', 'technician'), checkLabAccess, generateHtmlReport);
router.get('/:id/pdf', authorize('admin', 'technician'), checkLabAccess, generatePdfReport);

// Test route for debugging Handlebars templates
router.get('/test-template', authorize('admin', 'technician'), testTemplate);

// Additional routes can be added here for features like:
// - Bulk report operations
// - Report templates
// - Report sharing/delivery

module.exports = router;
