const express = require('express');
const router = express.Router();
const { protect, authorize, checkLabAccess } = require('../middleware/auth');

// Import controller functions (to be implemented)
const {
  createPatient,
  getPatients,
  getPatient,
  updatePatient,
  deletePatient
} = require('../controllers/patientController');

// All routes require authentication
router.use(protect);

// Routes for patient management
router.route('/')
  .post(authorize('super-admin', 'admin', 'technician'), checkLabAccess, createPatient)
  .get(authorize('super-admin', 'admin', 'technician'), checkLabAccess, getPatients);

router.route('/:id')
  .get(authorize('super-admin', 'admin', 'technician'), checkLabAccess, getPatient)
  .put(authorize('super-admin', 'admin', 'technician'), checkLabAccess, updatePatient)
  .delete(authorize('super-admin', 'admin'), checkLabAccess, deletePatient);

module.exports = router;
