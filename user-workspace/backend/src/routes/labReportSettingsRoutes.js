const express = require('express');
const {
  getLabReportSettings,
  updateLabReportSettings,
  uploadImage,
  generatePdfReport
} = require('../controllers/labReportSettingsController');
const { protect, authorize, checkLabAccess } = require('../middleware/auth');

const router = express.Router();

// Lab report settings routes
router.route('/labs/:labId/report-settings')
  .get(protect, checkLabAccess, getLabReportSettings)
  .put(protect, checkLabAccess, updateLabReportSettings);

router.route('/labs/:labId/report-settings/upload')
  .post(protect, checkLabAccess, uploadImage);

// PDF generation route
router.route('/reports/:reportId/generate-pdf')
  .post(protect, generatePdfReport);

module.exports = router;
