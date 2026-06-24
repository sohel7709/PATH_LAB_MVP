const Patient = require('../models/Patient');
const Lab = require('../models/Lab');
const asyncHandler = require('express-async-handler');
const { createAuditLog } = require('../services/auditService');

// Helper function to generate patient ID (2 characters + dash + 6 digits)
const generatePatientId = async (labCodePrefix) => {
  let labCode = labCodePrefix;
  
  const highestPatient = await Patient.find({ patientId: new RegExp(`^${labCode}-\\d{6}$`) })
    .sort({ patientId: -1 })
    .limit(1);
  
  let nextNumber = 1;
  if (highestPatient.length > 0) {
    const lastId = highestPatient[0].patientId;
    const lastNumber = parseInt(lastId.split('-')[1]);
    nextNumber = lastNumber + 1;
  }
  
  const numberPart = nextNumber.toString().padStart(6, '0');
  return `${labCode}-${numberPart}`;
};

// @desc    Create a new patient
// @route   POST /api/patients
// @access  Private (super-admin, admin, technician)
exports.createPatient = asyncHandler(async (req, res) => {
  if (!req.body.labId && req.user.lab) {
    req.body.labId = req.user.lab;
  }

  if (!req.body.labId) {
    return res.status(400).json({ message: 'Lab ID is required' });
  }

  const labInstance = await Lab.findById(req.body.labId);
  if (!labInstance) {
    return res.status(404).json({ message: 'Lab not found' });
  }
  const labCodePrefix = labInstance.name.substring(0, 2).toUpperCase();

  let { fullName: originalFullName, phone, age, gender, email, designation, address, lastTestType, whatsappNotificationEnabled } = req.body;
  let processedFullName = originalFullName;

  if (processedFullName && typeof processedFullName === 'string' && processedFullName.length > 0) {
    processedFullName = processedFullName.charAt(0).toUpperCase() + processedFullName.slice(1);
  }

  try {
    const duplicateQuery = {
      fullName: processedFullName,
      labId: req.body.labId
    };
    if (phone && phone.trim() !== "") { 
        duplicateQuery.phone = phone.trim();
    }
    if (age) duplicateQuery.age = parseInt(age);
    if (gender) duplicateQuery.gender = gender;
    if (email && email.trim() !== "") duplicateQuery.email = email.trim().toLowerCase();
    
    if (fullName) {
        const existingPatient = await Patient.findOne(duplicateQuery);
        if (existingPatient) {
            return res.status(400).json({ 
                message: 'A patient with similar details (name, and phone if provided) already exists in this lab.',
                duplicate: true,
                patient: existingPatient
            });
        }
    }
  } catch (error) {
    // Don't stop creation for an error in duplicate check
  }

  try {
    const patientId = await generatePatientId(labCodePrefix);
    
    const patientDataForCreation = {
        patientId, 
        designation: designation,
        fullName: processedFullName,
        age: age,
        gender: gender,
        labId: req.body.labId, 
        phone: (phone && phone.trim() !== "") ? phone.trim() : null,
        email: (email && email.trim() !== "") ? email.trim().toLowerCase() : null,
        address: (address && address.trim() !== "") ? address.trim() : null,
        lastTestType: (lastTestType && lastTestType.trim() !== "") ? lastTestType.trim() : null,
        whatsappNotificationEnabled: whatsappNotificationEnabled === true || whatsappNotificationEnabled === 'true',
    };
    
    const patient = await Patient.create(patientDataForCreation);

    await Lab.findByIdAndUpdate(req.body.labId, {
      $inc: { 'totalPatientsCreated': 1, 'stats.totalPatients': 1 }
    });

    // Audit Log
    createAuditLog({
      user: req.user._id,
      role: req.user.role,
      module: 'PATIENTS',
      action: 'CREATE',
      entityId: patient._id,
      entityType: 'Patient',
      description: `${req.user.name} created patient ${patient.patientId} (${processedFullName})`,
      newData: { patientId, fullName: processedFullName, age, gender, phone },
      req,
    });

    res.status(201).json(patient);
  } catch (error) {
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ success: false, message: messages.join(', '), details: error.errors });
    }
    return res.status(500).json({ success: false, message: 'Server error occurred while creating patient.', error: error.message });
  }
});

// @desc    Get all patients (filtered by lab if user is not super-admin)
// @route   GET /api/patients
// @access  Private (super-admin, admin, technician)
exports.getPatients = asyncHandler(async (req, res) => {
  let query = {};

  if (req.user.role !== 'super-admin') {
    query.labId = req.user.lab;
  } 
  else if (req.query.lab) {
    query.labId = req.query.lab;
  }

  try {
    const patients = await Patient.find(query).sort({ createdAt: -1 }); 
    res.json(patients);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching patients' });
  }
});

// @desc    Get a single patient
// @route   GET /api/patients/:id
// @access  Private (super-admin, admin, technician)
exports.getPatient = asyncHandler(async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (req.user.role !== 'super-admin' && 
        (!patient.labId || !req.user.lab || patient.labId.toString() !== req.user.lab.toString())) {
      return res.status(403).json({ message: 'Not authorized to access this patient' });
    }

    res.json(patient);
  } catch (error) {
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

  if (req.user.role !== 'super-admin' && patient.labId.toString() !== req.user.lab.toString()) {
    return res.status(403).json({ message: 'Not authorized to update this patient' });
  }

  if (req.body.labId && req.body.labId.toString() !== patient.labId.toString()) {
    return res.status(400).json({ message: 'Cannot change patient lab assignment' });
  }

  const oldData = {
    fullName: patient.fullName,
    phone: patient.phone,
    age: patient.age,
    gender: patient.gender,
    email: patient.email,
  };

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

  // Determine what changed for audit description
  const changes = [];
  if (updateData.phone !== undefined && updateData.phone !== oldData.phone) changes.push('phone');
  if (updateData.email !== undefined && updateData.email !== oldData.email) changes.push('email');
  if (updateData.address !== undefined && updateData.address !== oldData.address) changes.push('address');
  if (updateData.fullName !== undefined && updateData.fullName !== oldData.fullName) changes.push('name');
  if (updateData.age !== undefined && updateData.age !== oldData.age) changes.push('age');
  if (updateData.gender !== undefined && updateData.gender !== oldData.gender) changes.push('gender');

  const changeDesc = changes.length > 0 ? `Updated: ${changes.join(', ')}` : 'Updated patient details';

  // Audit Log
  createAuditLog({
    user: req.user._id,
    role: req.user.role,
    module: 'PATIENTS',
    action: 'UPDATE',
    entityId: patient._id,
    entityType: 'Patient',
    description: `${req.user.name} updated patient ${patient.patientId} — ${changeDesc}`,
    oldData,
    newData: { fullName: patient.fullName, phone: patient.phone, email: patient.email, age: patient.age, gender: patient.gender },
    req,
  });

  res.json(patient);
});

// @desc    Delete a patient
// @route   DELETE /api/patients/:id
// @access  Private (super-admin, admin)
exports.deletePatient = asyncHandler(async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (req.user.role === 'super-admin' || 
        (req.user.role === 'admin' && patient.labId?.toString() === req.user.lab?.toString())) {
      
      const patientData = {
        patientId: patient.patientId,
        fullName: patient.fullName,
      };

      await Patient.deleteOne({ _id: req.params.id });

      // Audit Log
      createAuditLog({
        user: req.user._id,
        role: req.user.role,
        module: 'PATIENTS',
        action: 'DELETE',
        entityId: req.params.id,
        entityType: 'Patient',
        description: `${req.user.name} deleted patient ${patientData.patientId} (${patientData.fullName})`,
        oldData: patientData,
        req,
      });

      return res.json({ message: 'Patient removed' });
    } else {
      return res.status(403).json({ message: 'Not authorized to delete this patient' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Server error while deleting patient' });
  }
});