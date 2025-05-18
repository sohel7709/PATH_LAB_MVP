const express = require('express');
const {
  createTemplate,
  getTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  toggleSystemTemplate, // Import the new controller function
} = require('../controllers/templateController');
const { protect, verifySuperAdmin } = require('../middleware/auth');

const router = express.Router();

// Protect all template routes with protect and verifySuperAdmin middleware
router.use(protect);
router.use(verifySuperAdmin);

router.route('/')
  .post(createTemplate)
  .get(getTemplates);

router.route('/:id')
  .get(getTemplate)
  .put(updateTemplate)
  .delete(deleteTemplate);

router.route('/:id/toggle-system').put(toggleSystemTemplate); // Add the new route

module.exports = router;
