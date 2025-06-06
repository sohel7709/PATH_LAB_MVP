const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const TestTemplate = require('./src/models/TestTemplate');

// Load environment variables from .env file located in the backend directory
dotenv.config({ path: path.resolve(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const DEFAULT_TEMPLATES_PATH = path.resolve(__dirname, 'src/utils/defaultTestTemplates.json');

// Placeholder for createdBy - replace with a real super-admin user ID if available/necessary
const PLACEHOLDER_USER_ID = '000000000000000000000001';

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in the .env file.');
  process.exit(1);
}

if (!fs.existsSync(DEFAULT_TEMPLATES_PATH)) {
  console.error(`Error: Default templates file not found at ${DEFAULT_TEMPLATES_PATH}`);
  process.exit(1);
}

const loadDefaultTemplatesUpdate = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    console.log(`Reading default templates from ${DEFAULT_TEMPLATES_PATH}...`);
    const defaultTemplatesData = JSON.parse(fs.readFileSync(DEFAULT_TEMPLATES_PATH, 'utf-8'));

    if (!Array.isArray(defaultTemplatesData) || defaultTemplatesData.length === 0) {
      console.error('Error: No templates found or invalid format in the JSON file.');
      return;
    }

    let updatedCount = 0;
    for (const template of defaultTemplatesData) {
      // Check if a template with the same shortName already exists
      const exists = await TestTemplate.findOne({ shortName: template.shortName });
      if (!exists) {
        await TestTemplate.create({
          ...template,
          isDefault: true,
          createdBy: PLACEHOLDER_USER_ID
        });
        updatedCount++;
        console.log(`Added new template: ${template.templateName} (${template.shortName})`);
      } else {
        // Update existing template with new data
        // Prepare update data, excluding createdBy
        const updateData = { ...template };
        delete updateData.createdBy; // Ensure we don't try to update createdBy

        await TestTemplate.updateOne(
          { shortName: template.shortName },
          {
            $set: {
              ...updateData,
              isDefault: true,
              updatedAt: new Date()
            }
          }
        );
        updatedCount++;
        console.log(`Updated existing template: ${template.templateName} (${template.shortName})`);
      }
    }

    console.log(`Successfully added or updated ${updatedCount} test templates.`);
  } catch (error) {
    console.error('Error loading default test templates:', error);
  } finally {
    console.log('Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

loadDefaultTemplatesUpdate();
