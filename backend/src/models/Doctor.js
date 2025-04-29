const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  specialty: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
     required: true, // Made optional
  },
  email: {
    type: String,
    // required: true, // Made optional
    // unique: true, // Removed unique constraint as email is optional
  },
  lab: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lab',
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Doctor', doctorSchema);
