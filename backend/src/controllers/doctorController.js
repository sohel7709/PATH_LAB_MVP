const Doctor = require('../models/Doctor');

// @desc    Create a new doctor
// @route   POST /api/doctors
// @access  Private (Admin)
exports.createDoctor = async (req, res) => {
  try {
    const { name, specialty, phone, email, lab } = req.body;

    const doctor = await Doctor.create({
      name,
      specialty,
      phone,
      email,
      lab: req.user.lab // Associate the doctor with the lab of the admin
    });

    res.status(201).json({
      success: true,
      data: doctor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating doctor',
      error: error.message
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
    doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      {
        name,
        specialty,
        phone,
        email
      },
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
