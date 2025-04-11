const express = require('express');
const { 
  createDoctor, 
  getDoctors, 
  getDoctorById, 
  updateDoctor, 
  deleteDoctor 
} = require('../controllers/doctorController');
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

// @desc    Get a doctor by ID
// @route   GET /api/doctors/:id
// @access  Private (Admin)
router.get('/:id', protect, getDoctorById);

// @desc    Update a doctor
// @route   PUT /api/doctors/:id
// @access  Private (Admin)
router.put('/:id', protect, updateDoctor);

// @desc    Delete a doctor
// @route   DELETE /api/doctors/:id
// @access  Private (Admin)
router.delete('/:id', protect, deleteDoctor);

module.exports = router;
