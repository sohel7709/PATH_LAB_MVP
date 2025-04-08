const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

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
  .post(authorize('super-admin', 'admin', 'technician'), createPatient)
  .get(authorize('super-admin', 'admin', 'technician'), getPatients);

router.route('/:id')
  .get(authorize('super-admin', 'admin', 'technician'), getPatient)
  .put(authorize('super-admin', 'admin', 'technician'), updatePatient)
  .delete(authorize('super-admin', 'admin'), deletePatient);

module.exports = router;
