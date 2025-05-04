const mongoose = require('mongoose');
const User = require('./src/models/User');
const Lab = require('./src/models/Lab');
const seedDefaultTemplates = require('./backend/loadDefaultTemplatesUpdate');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pathology-lab-saas';

async function createDefaultUsers() {
  try {
    const existingSuperAdmin = await User.findOne({ email: 'sohelsp9730@gmail.com' });
    if (existingSuperAdmin) {
      console.log('Default super admin user already exists.');
      return existingSuperAdmin;
    }

    const superAdminUser = await User.create({
      name: 'Default Super Admin',
      email: 'sohelsp9730@gmail.com',
      password: 'Sonu@9730',
      role: 'super-admin',
      lab: null
    });

    console.log('Default super admin user created.');
    return superAdminUser;
  } catch (error) {
    console.error('Error creating default super admin user:', error);
    throw error;
  }
}

async function run() {
  try {
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    // Create default super admin user
    const superAdminUser = await createDefaultUsers();

    // Load default templates
    await seedDefaultTemplates();

    console.log('Default setup completed successfully.');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error during default setup:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

run();
