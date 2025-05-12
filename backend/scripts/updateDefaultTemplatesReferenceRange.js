const mongoose = require('mongoose');
const TestTemplate = require('../src/models/TestTemplate');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from backend/.env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function updateDefaultTemplates() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Load default templates from the JSON file
    const defaultTemplatesJSONPath = path.resolve(__dirname, '../src/utils/defaultTestTemplates.json');
    const defaultTemplatesFromJSON = JSON.parse(fs.readFileSync(defaultTemplatesJSONPath, 'utf-8'));
    console.log(`Loaded ${defaultTemplatesFromJSON.length} templates from defaultTestTemplates.json`);

    let updatedCount = 0;
    let notFoundCount = 0;

    for (const jsonTemplate of defaultTemplatesFromJSON) {
      const dbTemplate = await TestTemplate.findOne({ shortName: jsonTemplate.shortName, isDefault: true });

      if (dbTemplate) {
        let needsUpdate = false;
        // Compare sections and parameters to see if an update is needed.
        // This is a simplified check; a deep comparison might be more robust.
        if (JSON.stringify(dbTemplate.sections) !== JSON.stringify(jsonTemplate.sections)) {
          needsUpdate = true;
        }

        if (needsUpdate) {
          dbTemplate.sections = jsonTemplate.sections; // Update the sections from JSON
          dbTemplate.templateName = jsonTemplate.templateName; // Also update templateName
          dbTemplate.category = jsonTemplate.category; // Also update category
          // Ensure other fields like createdBy, lab, isDefault are handled if necessary
          // For this script, we primarily focus on sections.

          await dbTemplate.save();
          console.log(`Updated template: ${dbTemplate.templateName} (ID: ${dbTemplate._id}) with data from JSON.`);
          updatedCount++;
        } else {
          console.log(`No update needed for template: ${dbTemplate.templateName} (ID: ${dbTemplate._id}). Sections match JSON.`);
        }
      } else {
        console.warn(`Default template with shortName "${jsonTemplate.shortName}" not found in the database. Skipping.`);
        notFoundCount++;
      }
    }

    console.log('Update process complete.');
    console.log(`Successfully updated ${updatedCount} templates.`);
    if (notFoundCount > 0) {
      console.warn(`${notFoundCount} templates from JSON were not found in the database as default templates.`);
    }
    process.exit(0);
  } catch (error) {
    console.error('Error updating default templates:', error);
    process.exit(1);
  }
}

updateDefaultTemplates();
