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
    connection = await mongoose.connect(MONGO_URI);

    const defaultTemplatesData = JSON.parse(fs.readFileSync(DEFAULT_TEMPLATES_PATH, 'utf-8'));

    if (!Array.isArray(defaultTemplatesData) || defaultTemplatesData.length === 0) {
      console.error('No templates found in the JSON file or file is invalid.');
      return;
    }

    // Find the admin user provided by the user to attribute creation/updates
    const adminEmail = 'superadmin_1744692753759@example.com'; // Use the provided email
    let systemUser = await User.findOne({ email: adminEmail });
    if (!systemUser) {
        console.error(`Cannot find admin user with email ${adminEmail}. Please ensure this user exists.`);
        return; // Stop if the specified user doesn't exist
    } // <<< Added missing closing brace here
    const systemUserId = systemUser._id;


    let updatedCount = 0;
    let createdCount = 0;
    let skippedCount = 0;


    for (const templateData of defaultTemplatesData) {
      if (!templateData.templateName || !templateData.shortName) {
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
        await TestTemplate.create(templateFromFile);
        createdCount++;
      }
    }


  } catch (error) {
    console.error('Error during default template synchronization:', error);
  } finally {
    if (connection) {
      await mongoose.disconnect();
    }
  }
}

// Execute the function
syncDefaultTemplates();
