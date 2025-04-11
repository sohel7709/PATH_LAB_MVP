const express = require('express');
const { 
  createTestTemplate, 
  getTestTemplates, 
  getTestTemplate, 
  updateTestTemplate, 
  deleteTestTemplate,
  createDefaultTemplates
} = require('../controllers/testTemplateController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Routes for super-admin
router.use('/super-admin/test-templates', protect, authorize('super-admin'));

// Define the create-defaults route first (more specific)
router.post('/super-admin/test-templates/create-defaults', createDefaultTemplates);

// Then define the general routes
router.route('/super-admin/test-templates')
  .post(createTestTemplate)
  .get(getTestTemplates);

router.route('/super-admin/test-templates/:id')
  .get(getTestTemplate)
  .put(updateTestTemplate)
  .delete(deleteTestTemplate);

// Routes for admin
router.use('/admin/test-templates', protect, authorize('admin', 'super-admin', 'technician'));
router.route('/admin/test-templates')
  .post(createTestTemplate)
  .get(getTestTemplates);

router.route('/admin/test-templates/:id')
  .get(getTestTemplate)
  .put(updateTestTemplate)
  .delete(deleteTestTemplate);

// Routes for technician (read-only)
router.use('/technician/test-templates', protect);

// Add a route for technicians to access all templates (including default ones)
// This specific route must come before the :id route
router.route('/technician/test-templates/all')
  .get(getTestTemplates);

router.route('/technician/test-templates')
  .get(getTestTemplates);

router.route('/technician/test-templates/:id')
  .get(getTestTemplate);

module.exports = router;
