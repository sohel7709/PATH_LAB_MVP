const Patient = require('../models/Patient');
const Lab = require('../models/Lab');
const asyncHandler = require('express-async-handler');

// @desc    Create a new patient
// @route   POST /api/patients
// @access  Private (super-admin, admin, technician)
exports.createPatient = asyncHandler(async (req, res) => {
  // Add lab ID from user if not provided
  if (!req.body.labId && req.user.lab) {
    req.body.labId = req.user.lab;
  }

  // Validate lab ID
  if (!req.body.labId) {
    return res.status(400).json({ message: 'Lab ID is required' });
  }

  // Check if lab exists
  const lab = await Lab.findById(req.body.labId);
  if (!lab) {
    return res.status(404).json({ message: 'Lab not found' });
  }

  // Create patient
  const patient = await Patient.create(req.body);
  res.status(201).json(patient);
});

// @desc    Get all patients (filtered by lab if user is not super-admin)
// @route   GET /api/patients
// @access  Private (super-admin, admin, technician)
exports.getPatients = asyncHandler(async (req, res) => {
  let query = {};

  // If not super-admin, filter by lab
  if (req.user.role !== 'super-admin') {
    query.labId = req.user.lab;
  } 
  // If super-admin and lab query param is provided, filter by lab
  else if (req.query.lab) {
    query.labId = req.query.lab;
  }

  const patients = await Patient.find(query);
  res.json(patients);
});

// @desc    Get a single patient
// @route   GET /api/patients/:id
// @access  Private (super-admin, admin, technician)
exports.getPatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);

  if (!patient) {
    return res.status(404).json({ message: 'Patient not found' });
  }

  // Check if user has access to this patient's lab
  if (req.user.role !== 'super-admin' && patient.labId.toString() !== req.user.lab.toString()) {
    return res.status(403).json({ message: 'Not authorized to access this patient' });
  }

  res.json(patient);
});

// @desc    Update a patient
// @route   PUT /api/patients/:id
// @access  Private (super-admin, admin, technician)
exports.updatePatient = asyncHandler(async (req, res) => {
  let patient = await Patient.findById(req.params.id);

  if (!patient) {
    return res.status(404).json({ message: 'Patient not found' });
  }

  // Check if user has access to this patient's lab
  if (req.user.role !== 'super-admin' && patient.labId.toString() !== req.user.lab.toString()) {
    return res.status(403).json({ message: 'Not authorized to update this patient' });
  }

  // Don't allow changing the lab ID
  if (req.body.labId && req.body.labId.toString() !== patient.labId.toString()) {
    return res.status(400).json({ message: 'Cannot change patient lab assignment' });
  }

  patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.json(patient);
});

// @desc    Delete a patient
// @route   DELETE /api/patients/:id
// @access  Private (super-admin, admin)
exports.deletePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);

  if (!patient) {
    return res.status(404).json({ message: 'Patient not found' });
  }

  // Check if user has access to this patient's lab
  if (req.user.role !== 'super-admin' && patient.labId.toString() !== req.user.lab.toString()) {
    return res.status(403).json({ message: 'Not authorized to delete this patient' });
  }

  await Patient.deleteOne({ _id: req.params.id });
  res.json({ message: 'Patient removed' });
});
