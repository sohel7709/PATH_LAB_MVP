const mongoose = require('mongoose');
const User = require('./src/models/User');
const Lab = require('./src/models/Lab');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pathology-lab-saas';

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const sampleUser = {
      name: 'Sample Super Admin',
      email: 'superadmin_new@example.com',
      password: 'SuperAdmin@2025!',
      role: 'super-admin',
      lab: null // No lab ID required for super-admin
    };

    const adminUser = {
      name: 'Sample Admin',
      email: 'admin_new@example.com',
      password: 'Admin@2025!',
      role: 'admin',
      lab: null // Assign a lab ID if needed
    };

    const technicianUser = {
      name: 'Sample Technician',
      email: 'technician_new@example.com',
      password: 'Technician@2025!',
      role: 'technician',
      lab: null // Assign a lab ID if needed
    };

    // Create super admin user first
    const superAdminUser = await User.create(sampleUser);

    // Create the lab with the super admin's ID as createdBy
    const sampleLab = await Lab.create({
      name: 'Sample Lab',
      address: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'Anystate',
        zipCode: '12345',
        country: 'Country'
      },
      contact: {
        phone: '123-456-7890',
        email: 'contact@samplelab.com'
      },
      createdBy: superAdminUser._id
    });

    // Update admin and technician users with the lab ID
    adminUser.lab = sampleLab._id;
    technicianUser.lab = sampleLab._id;

    // Create admin and technician users
    await User.create([adminUser, technicianUser]);

    console.log('Super Admin, Admin, Technician users, and Sample Lab created');
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });
