const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const User = require('./src/models/User');
const TestTemplate = require('./src/models/TestTemplate');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI environment variable is not set.');
  process.exit(1);
}

const superAdminCredentials = {
  name: 'Super Admin', // Default name, can be changed later
  email: 'sohel9730@gmail.com',
  password: 'Sonu@9730',
  role: 'super-admin',
  lab: null // Super admin is not tied to a specific lab
};

const defaultTemplatesPath = path.join(__dirname, 'src', 'utils', 'defaultTestTemplates.json');

const setup = async () => {
  try {
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    // 1. Create Super Admin (if doesn't exist)
    const existingSuperAdmin = await User.findOne({ email: superAdminCredentials.email });
    if (!existingSuperAdmin) {
      await User.create(superAdminCredentials);
      console.log(`Super Admin user created successfully: ${superAdminCredentials.email}`);
    } else {
      console.log(`Super Admin user already exists: ${superAdminCredentials.email}`);
    }

    // 2. Load Default Test Templates (if none exist)
    // Assuming templates in the JSON are marked as default or should be treated as such.
    // A simple check could be based on count, or a specific flag like 'isDefault'.
    // Let's check if *any* templates exist first as a basic guard. A more robust check
    // might be needed depending on how 'default' templates are identified.
    const existingTemplateCount = await TestTemplate.countDocuments(); // Basic check
    // const existingDefaultTemplateCount = await TestTemplate.countDocuments({ isDefault: true }); // More specific check if 'isDefault' flag exists

    if (existingTemplateCount === 0) { // Or use existingDefaultTemplateCount === 0
      console.log('No existing test templates found. Loading default templates...');
      if (fs.existsSync(defaultTemplatesPath)) {
        const templatesData = JSON.parse(fs.readFileSync(defaultTemplatesPath, 'utf-8'));
        if (templatesData && templatesData.length > 0) {
          // Ensure templates are marked as default if the flag isn't in the JSON
          const templatesToInsert = templatesData.map(t => ({ ...t, isDefault: true })); // Assuming we add/overwrite isDefault
          await TestTemplate.insertMany(templatesToInsert, { ordered: false });
          console.log(`Successfully loaded ${templatesToInsert.length} default test templates.`);
        } else {
          console.log('Default templates file is empty or invalid.');
        }
      } else {
        console.error(`Error: Default templates file not found at ${defaultTemplatesPath}`);
      }
    } else {
      console.log('Existing test templates found. Skipping loading of default templates.');
    }

    console.log('Setup script finished successfully.');

  } catch (error) {
    console.error('Error during setup script execution:', error);
    process.exit(1); // Exit with error code
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
};

setup();
