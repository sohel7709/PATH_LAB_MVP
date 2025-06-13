const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const TestTemplate = require('../src/models/TestTemplate'); // Adjust path as needed
const User = require('../src/models/User'); // Assuming a default system user or admin exists

// --- Configuration ---
// Replace with your actual MongoDB connection string
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lab_management';
// Path to your default templates JSON file
const DEFAULT_TEMPLATES_PATH = path.join(__dirname, '../src/utils/defaultTestTemplates.json');
// --- End Configuration ---

async function syncDefaultTemplates() {
  let connection;
  try {
    console.log('Connecting to MongoDB...');
    connection = await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected.');

    console.log(`Reading default templates from: ${DEFAULT_TEMPLATES_PATH}`);
    const defaultTemplatesData = JSON.parse(fs.readFileSync(DEFAULT_TEMPLATES_PATH, 'utf-8'));

    if (!Array.isArray(defaultTemplatesData) || defaultTemplatesData.length === 0) {
      console.error('No templates found in the JSON file or file is invalid.');
      return;
    }

    // Find the admin user provided by the user to attribute creation/updates
    const adminEmail = 'superadmin_1744692753759@example.com'; // Use the provided email
    console.log(`Attempting to find admin user with email: ${adminEmail}`);
    let systemUser = await User.findOne({ email: adminEmail });
    if (!systemUser) {
        console.error(`Cannot find admin user with email ${adminEmail}. Please ensure this user exists.`);
        return; // Stop if the specified user doesn't exist
    } // <<< Added missing closing brace here
    const systemUserId = systemUser._id;
    console.log(`Using user ID ${systemUserId} for createdBy field.`);


    let updatedCount = 0;
    let createdCount = 0;
    let skippedCount = 0;

    console.log(`Processing ${defaultTemplatesData.length} templates from JSON file...`);

    for (const templateData of defaultTemplatesData) {
      if (!templateData.templateName || !templateData.shortName) {
        console.warn('Skipping template due to missing templateName or shortName:', templateData);
        skippedCount++;
        continue;
      }

      // Prepare data from JSON
      const templateFromFile = {
        ...templateData,
        isDefault: true, // Ensure it's marked as default
        createdBy: systemUserId, // Assign system user
        sections: templateData.sections.map(section => ({
            ...section,
            parameters: section.parameters.map(param => ({
                name: param.name,
                unit: param.unit || '',
                // Use normalRange from JSON as referenceRange in DB
                referenceRange: param.normalRange || param.referenceRange || '',
                isSubparameter: param.isSubparameter || false,
                notes: param.notes || '',
                isHeader: param.isHeader || false,
                inputType: param.inputType || 'text',
                options: param.options // Keep options if they exist
            }))
        }))
      };
      // Remove normalRange if it exists at the parameter level after mapping
      templateFromFile.sections.forEach(s => s.parameters.forEach(p => delete p.normalRange));


      // Find existing default template in DB
      const existingTemplate = await TestTemplate.findOne({
        shortName: templateFromFile.shortName, // Match primarily by shortName for defaults
        isDefault: true
      });

      if (existingTemplate) {
        // Update existing template
        console.log(`Updating existing default template: ${templateFromFile.templateName} (${templateFromFile.shortName})`);
        // Overwrite sections completely to ensure sync
        existingTemplate.templateName = templateFromFile.templateName;
        existingTemplate.category = templateFromFile.category;
        existingTemplate.sections = templateFromFile.sections;
        existingTemplate.createdBy = templateFromFile.createdBy; // Ensure creator is updated if needed
        // Add any other fields from templateFromFile you want to sync

        await existingTemplate.save();
        updatedCount++;
      } else {
        // Create new default template if it doesn't exist
        console.log(`Creating new default template: ${templateFromFile.templateName} (${templateFromFile.shortName})`);
        await TestTemplate.create(templateFromFile);
        createdCount++;
      }
    }

    console.log('\n--- Sync Summary ---');
    console.log(`Templates Processed from JSON: ${defaultTemplatesData.length}`);
    console.log(`Templates Updated in DB: ${updatedCount}`);
    console.log(`Templates Created in DB: ${createdCount}`);
    console.log(`Templates Skipped (Missing Name/ShortName): ${skippedCount}`);
    console.log('--------------------\n');
    console.log('Default template synchronization complete.');

  } catch (error) {
    console.error('Error during default template synchronization:', error);
  } finally {
    if (connection) {
      await mongoose.disconnect();
      console.log('MongoDB Disconnected.');
    }
  }
}

// Execute the function
syncDefaultTemplates();
