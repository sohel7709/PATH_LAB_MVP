const express = require('express');
const { createDoctor, getDoctors } = require('../controllers/doctorController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Create a new doctor
// @route   POST /api/doctors
// @access  Private (Admin)
router.post('/', protect, createDoctor);

// @desc    Get all doctors
// @route   GET /api/doctors
// @access  Private (Admin)
router.get('/', protect, getDoctors);

module.exports = router;
