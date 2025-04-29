const Patient = require('../models/Patient');
const Lab = require('../models/Lab');
const asyncHandler = require('express-async-handler');

// Helper function to generate patient ID (2 characters + dash + 6 digits)
const generatePatientId = async (labId) => {
  // Get the lab code (first 2 characters)
  const lab = await Lab.findById(labId);
  let labCode = lab.name.substring(0, 2).toUpperCase();
  
  // Find the highest existing patient ID for this lab
  const highestPatient = await Patient.find({ patientId: new RegExp(`^${labCode}-\\d{6}$`) })
    .sort({ patientId: -1 })
    .limit(1);
  
  let nextNumber = 1;
  if (highestPatient.length > 0) {
    // Extract the number part and increment
    const lastId = highestPatient[0].patientId;
    const lastNumber = parseInt(lastId.split('-')[1]);
    nextNumber = lastNumber + 1;
  }
  
  // Format with leading zeros to ensure 6 digits
  const numberPart = nextNumber.toString().padStart(6, '0');
  return `${labCode}-${numberPart}`;
};

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

  try {
    // Check for duplicate patient
    let { fullName, phone, age, gender, email } = req.body; // Use let for fullName

    // Format fullName: Capitalize the first letter
    if (fullName && typeof fullName === 'string' && fullName.length > 0) {
      fullName = fullName.charAt(0).toUpperCase() + fullName.slice(1);
      req.body.fullName = fullName; // Update req.body as well for the create call
    }
    
    // Build query to check for duplicate
    const duplicateQuery = {
      fullName: fullName,
      phone: phone,
      labId: req.body.labId
    };
    
    // Add additional fields to query if they exist
    if (age) duplicateQuery.age = parseInt(age);
    if (gender) duplicateQuery.gender = gender;
    if (email) duplicateQuery.email = email;
    
    console.log('Checking for duplicate patient with query:', duplicateQuery);
    
    const existingPatient = await Patient.findOne(duplicateQuery);
    
    if (existingPatient) {
      console.log('Duplicate patient found:', existingPatient);
      return res.status(400).json({ 
        message: 'Patient already exists',
        duplicate: true,
        patient: existingPatient
      });
    }
  } catch (error) {
    console.error('Error checking for duplicate patient:', error);
    return res.status(500).json({ message: 'Error checking for duplicate patient' });
  }

  try {
    // Generate patient ID
    const patientId = await generatePatientId(req.body.labId);
    req.body.patientId = patientId;
    
    // Create patient
    const patient = await Patient.create(req.body);
    res.status(201).json(patient);
  } catch (error) {
    console.error('Error creating patient:', error);
    return res.status(500).json({ message: 'Error creating patient' });
  }
});

// @desc    Get all patients (filtered by lab if user is not super-admin)
// @route   GET /api/patients
// @access  Private (super-admin, admin, technician)
exports.getPatients = asyncHandler(async (req, res) => {
  let query = {};

  // For non-super-admins (admin/technician), filter by their associated lab
  if (req.user.role !== 'super-admin') {
    query.labId = req.user.lab;
  } 
  // For super-admins, check if lab query param is provided
  else if (req.query.lab) {
    query.labId = req.query.lab;
  }

  try {
    // Sort by creation date in descending order to show recent patients first
    const patients = await Patient.find(query).sort({ createdAt: -1 }); 
    res.json(patients);
  } catch (err) {
    console.error('Error fetching patients:', err);
    res.status(500).json({ message: 'Error fetching patients' });
  }
});

// @desc    Get a single patient
// @route   GET /api/patients/:id
// @access  Private (super-admin, admin, technician)
exports.getPatient = asyncHandler(async (req, res) => {
  console.log('Fetching patient with ID:', req.params.id);
  console.log('User details:', req.user);

  try {
    const patient = await Patient.findById(req.params.id);
    console.log('Patient found:', patient);
    console.log('Patient labId:', patient.labId ? patient.labId.toString() : 'undefined');
    console.log('User lab:', req.user.lab ? req.user.lab.toString() : 'undefined');
    console.log('User role:', req.user.role);

    if (!patient) {
      console.log('Patient not found');
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Check if user has access to this patient's lab
    if (req.user.role !== 'super-admin' && 
        (!patient.labId || !req.user.lab || patient.labId.toString() !== req.user.lab.toString())) {
      console.log('User not authorized to access patient\'s lab. Expected:', req.user.lab ? req.user.lab.toString() : 'undefined', 'Got:', patient.labId ? patient.labId.toString() : 'undefined');
      return res.status(403).json({ message: 'Not authorized to access this patient' });
    }

    res.json(patient);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ message: 'Error fetching patient details' });
  }
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
  try {
    console.log('Delete patient request received for ID:', req.params.id);
    console.log('User details:', req.user);
    
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      console.log('Patient not found');
      return res.status(404).json({ message: 'Patient not found' });
    }

    console.log('Patient found:', patient);
    console.log('Patient labId:', patient.labId?.toString());
    console.log('User lab:', req.user.lab?.toString());
    console.log('User role:', req.user.role);

    // Check if user has access to this patient's lab
    // Allow super-admin or admin of the same lab to delete
    if (req.user.role === 'super-admin' || 
        (req.user.role === 'admin' && patient.labId?.toString() === req.user.lab?.toString())) {
      console.log('User authorized to delete patient');
      await Patient.deleteOne({ _id: req.params.id });
      console.log('Patient deleted successfully');
      return res.json({ message: 'Patient removed' });
    } else {
      console.log('User not authorized to delete patient');
      return res.status(403).json({ message: 'Not authorized to delete this patient' });
    }
  } catch (error) {
    console.error('Error in deletePatient:', error);
    return res.status(500).json({ message: 'Server error while deleting patient' });
  }
});
