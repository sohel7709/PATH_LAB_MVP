const Patient = require('../models/Patient');
const Lab = require('../models/Lab');
const asyncHandler = require('express-async-handler');

// Helper function to generate patient ID (2 characters + dash + 6 digits)
const generatePatientId = async (labCodePrefix) => {
  // labCodePrefix is already derived and passed in
  let labCode = labCodePrefix;
  
  // Find the highest existing patient ID for this lab prefix
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
  const labInstance = await Lab.findById(req.body.labId); // Renamed variable
  if (!labInstance) {
    return res.status(404).json({ message: 'Lab not found' });
  }
  // Derive labCodePrefix from the fetched labInstance
  const labCodePrefix = labInstance.name.substring(0, 2).toUpperCase();

  // Destructure all necessary fields from req.body at a higher scope
  // Renamed 'fullName' from destructuring to 'originalFullName' to avoid confusion
  let { fullName: originalFullName, phone, age, gender, email, designation, address, lastTestType } = req.body;
  let processedFullName = originalFullName; // Initialize processedFullName

  // Format fullName: Capitalize the first letter (if it exists)
  if (processedFullName && typeof processedFullName === 'string' && processedFullName.length > 0) {
    processedFullName = processedFullName.charAt(0).toUpperCase() + processedFullName.slice(1);
  }

  try {
    // Check for duplicate patient
    const duplicateQuery = {
      fullName: processedFullName, // Use the processed (capitalized) fullName
      labId: req.body.labId
    };
    // Use variables from the higher scope (phone, age, gender, email)
    if (phone && phone.trim() !== "") { 
        duplicateQuery.phone = phone.trim();
    } else {
        // If phone is not provided, we might want to be more careful about declaring duplicates
        // For now, if phone is not provided, we won't use it in the duplicate check.
        // This means two patients with same name, age, gender, email but different/no phone will not be caught as duplicates by this logic.
        // Consider if this is the desired behavior.
    }
    
    // Add additional fields to query if they exist
    if (age) duplicateQuery.age = parseInt(age);
    if (gender) duplicateQuery.gender = gender;
    // Email is optional, so only add to duplicate check if provided
    if (email && email.trim() !== "") duplicateQuery.email = email.trim().toLowerCase();
    
    // Only perform duplicate check if essential fields for it are present
    // (e.g., fullName and labId are always there based on prior checks)
    if (fullName) { // fullName is required by schema, so it should be present
        console.log('Checking for duplicate patient with query:', duplicateQuery);
        const existingPatient = await Patient.findOne(duplicateQuery);
        if (existingPatient) {
            console.log('Duplicate patient found:', existingPatient);
            return res.status(400).json({ 
                message: 'A patient with similar details (name, and phone if provided) already exists in this lab.',
                duplicate: true,
                patient: existingPatient
            });
        }
    }
  } catch (error) {
    console.error('Error checking for duplicate patient:', error);
    // Don't stop creation for an error in duplicate check, but log it.
    // Proceed to attempt creation.
  }

  try {
    // Generate patient ID using the derived labCodePrefix
    const patientId = await generatePatientId(labCodePrefix);
    
    const patientDataForCreation = {
        patientId, 
        designation: designation, // Use destructured designation from higher scope
        fullName: processedFullName, // Use the processed fullName from higher scope
        age: age, // Use destructured age from higher scope
        gender: gender, // Use destructured gender from higher scope
        labId: req.body.labId, 
        
        // Optional fields - use destructured variables from higher scope
        phone: (phone && phone.trim() !== "") ? phone.trim() : null,
        email: (email && email.trim() !== "") ? email.trim().toLowerCase() : null,
        address: (address && address.trim() !== "") ? address.trim() : null,
        lastTestType: (lastTestType && lastTestType.trim() !== "") ? lastTestType.trim() : null,
    };
    
    // Create patient
    const patient = await Patient.create(patientDataForCreation);
    res.status(201).json(patient);
  } catch (error) {
    console.error('Detailed error creating patient:', error); // Log the full error
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ success: false, message: messages.join(', '), details: error.errors });
    }
    // For other types of errors, provide a more generic server error message but log details
    return res.status(500).json({ success: false, message: 'Server error occurred while creating patient.', error: error.message });
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

  // Prepare update data, ensuring optional fields are handled (empty string to null)
  const updateData = { ...req.body };
  if (updateData.phone !== undefined) {
    updateData.phone = (updateData.phone && updateData.phone.trim() !== "") ? updateData.phone.trim() : null;
  }
  if (updateData.email !== undefined) {
    updateData.email = (updateData.email && updateData.email.trim() !== "") ? updateData.email.trim().toLowerCase() : null;
  }
  if (updateData.address !== undefined) {
    updateData.address = (updateData.address && updateData.address.trim() !== "") ? updateData.address.trim() : null;
  }
   if (updateData.lastTestType !== undefined) {
    updateData.lastTestType = (updateData.lastTestType && updateData.lastTestType.trim() !== "") ? updateData.lastTestType.trim() : null;
  }


  patient = await Patient.findByIdAndUpdate(req.params.id, updateData, {
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
