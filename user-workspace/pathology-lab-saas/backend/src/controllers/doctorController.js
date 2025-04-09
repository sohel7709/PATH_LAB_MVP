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
