/**
 * Amylase/Lipase Report Routes
 * 
 * These routes handle the generation of specialized Amylase/Lipase reports
 * with all text in black color and important points highlighted without using color.
 */

const express = require('express');
const router = express.Router();
const { protect, authorize, checkLabAccess } = require('../middleware/auth');
const {
  generateAmylaseLipaseHtml,
  generateAmylaseLipasePdf,
  generateSampleReport
} = require('../controllers/amylaseLipaseReportController');

// All routes require authentication
router.use(protect);

// Routes for both Admin and Technician
router.route('/html')
  .post(authorize('admin', 'technician'), checkLabAccess, generateAmylaseLipaseHtml);

router.route('/pdf')
  .post(authorize('admin', 'technician'), checkLabAccess, generateAmylaseLipasePdf);

// Sample report route for testing
router.route('/sample')
  .get(authorize('admin', 'technician'), checkLabAccess, generateSampleReport);

module.exports = router;
