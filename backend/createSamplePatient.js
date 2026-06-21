const mongoose = require('mongoose');
const Patient = require('./src/models/Patient');
const Lab = require('./src/models/Lab');
require('dotenv').config();

async function createSamplePatient() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Get the first lab
    const labs = await Lab.find();
    if (labs.length === 0) {
      return;
    }
    
    const lab = labs[0];
    
    // Create a sample patient
    const patient = await Patient.create({
      fullName: 'Test Patient',
      age: 30,
      gender: 'male',
      phone: '1234567890',
      email: 'test@example.com',
      address: '123 Test St',
      labId: lab._id
    });
    
    
    // Count patients for this lab
    const count = await Patient.countDocuments({ labId: lab._id });
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

createSamplePatient();
