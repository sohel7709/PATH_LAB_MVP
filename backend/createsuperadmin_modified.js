const mongoose = require('mongoose');
const User = require('./src/models/User');
const Lab = require('./src/models/Lab');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pathology-lab-saas';

// Generate unique email with timestamp
const timestamp = new Date().getTime();
const superAdminEmail = `superadmin_${timestamp}@example.com`;
const adminEmail = `admin_${timestamp}@example.com`;
const technicianEmail = `technician_${timestamp}@example.com`;

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const sampleUser = {
      name: 'Sample Super Admin',
      email: superAdminEmail,
      password: 'SuperAdmin@2025!',
      role: 'super-admin',
      lab: null // No lab ID required for super-admin
    };

    const adminUser = {
      name: 'Sample Admin',
      email: adminEmail,
      password: 'Admin@2025!',
      role: 'admin',
      lab: null // Assign a lab ID if needed
    };

    const technicianUser = {
      name: 'Sample Technician',
      email: technicianEmail,
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

    console.log('Super Admin created with email:', superAdminEmail);
    console.log('Admin created with email:', adminEmail);
    console.log('Technician created with email:', technicianEmail);
    console.log('Sample Lab created');
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });
