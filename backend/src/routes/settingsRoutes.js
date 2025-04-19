const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { getWhatsAppSettings, updateWhatsAppSettings } = require('../controllers/whatsappSettingsController');

const router = express.Router();

// Protect all routes
router.use(protect);

// WhatsApp notification settings routes
router.route('/whatsapp')
  .get(authorize('admin', 'super-admin'), getWhatsAppSettings)
  .post(authorize('admin', 'super-admin'), updateWhatsAppSettings);

module.exports = router;
