const Doctor = require('../models/Doctor');

// @desc    Create a new doctor
// @route   POST /api/doctors
// @access  Private (Admin)
exports.createDoctor = async (req, res) => {
  try {
    const { name, specialty, phone, email } = req.body; // Removed 'lab' from req.body destructuring

    // Ensure req.user and req.user.lab exist, as lab is a required field for a doctor
    if (!req.user || !req.user.lab) {
      console.error('Error creating doctor: User or user.lab is undefined. req.user:', req.user);
      return res.status(400).json({
        success: false,
        message: 'User not authenticated or not associated with a lab. Cannot create doctor.'
      });
    }

    const doctorData = {
      name,
      lab: req.user.lab // Associate the doctor with the lab of the admin
    };

    // Add optional fields. Convert empty strings to null for better handling with unique indexes.
    doctorData.specialty = (specialty === '' || specialty === undefined) ? null : specialty;
    doctorData.phone = (phone === '' || phone === undefined) ? null : phone;
    doctorData.email = (email === '' || email === undefined) ? null : email;

    const doctor = await Doctor.create(doctorData);

    res.status(201).json({
      success: true,
      data: doctor
    });
  } catch (error) {
    console.error('Detailed error creating doctor:', error); // Log the full error object
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating doctor', // Use Mongoose error message if available
      error: error.toString() // Send a string representation of the error
    });
  }
};

// @desc    Get all doctors
// @route   GET /api/doctors
// @access  Private (Admin)
exports.getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({ lab: req.user.lab }); // Retrieve doctors associated with the admin's lab

    res.status(200).json({
      success: true,
      data: doctors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching doctors',
      error: error.message
    });
  }
};

// @desc    Get a doctor by ID
// @route   GET /api/doctors/:id
// @access  Private (Admin)
exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ 
      _id: req.params.id,
      lab: req.user.lab // Ensure the doctor belongs to the admin's lab
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.status(200).json({
      success: true,
      data: doctor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching doctor',
      error: error.message
    });
  }
};

// @desc    Update a doctor
// @route   PUT /api/doctors/:id
// @access  Private (Admin)
exports.updateDoctor = async (req, res) => {
  try {
    const { name, specialty, phone, email } = req.body;

    // Find the doctor and ensure it belongs to the admin's lab
    let doctor = await Doctor.findOne({ 
      _id: req.params.id,
      lab: req.user.lab
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Update the doctor
    // Prepare update data, converting empty strings to null for optional fields
    const updateData = { name };
    updateData.specialty = (specialty === '' || specialty === undefined) ? null : specialty;
    updateData.phone = (phone === '' || phone === undefined) ? null : phone;
    updateData.email = (email === '' || email === undefined) ? null : email;

    doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: doctor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating doctor',
      error: error.message
    });
  }
};

// @desc    Delete a doctor
// @route   DELETE /api/doctors/:id
// @access  Private (Admin)
exports.deleteDoctor = async (req, res) => {
  try {
    // Find the doctor and ensure it belongs to the admin's lab
    const doctor = await Doctor.findOne({ 
      _id: req.params.id,
      lab: req.user.lab
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    await doctor.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting doctor',
      error: error.message
    });
  }
};
