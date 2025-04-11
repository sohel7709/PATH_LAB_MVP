require('dotenv').config();
const mongoose = require('mongoose');
const TestTemplate = require('./src/models/TestTemplate');

// Connect to MongoDB
console.log('Attempting to connect to MongoDB...');
console.log('MongoDB URI:', process.env.MONGODB_URI ? 'URI is defined' : 'URI is undefined');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Run the function after successful connection
    createTemplates();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Load default test templates from JSON file
const defaultTemplates = require('./src/utils/defaultTestTemplates.json');

// Function to create templates
const createTemplates = async () => {
  try {
    // Delete all existing templates
    console.log('Deleting all existing templates...');
    const deleteResult = await TestTemplate.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} existing templates`);
    
    console.log('Starting to process templates...');
    console.log(`Total templates to process: ${defaultTemplates.length}`);
    
    let createdCount = 0;
    
    // Create all templates
    for (const template of defaultTemplates) {
      console.log(`Processing template: ${template.name}`);
      
      // Add isDefault flag
      template.isDefault = true;
      
      try {
        // Create the template
        const createdTemplate = await TestTemplate.create(template);
        console.log(`Created template: ${template.name} with ID: ${createdTemplate._id}`);
        createdCount++;
      } catch (err) {
        console.error(`Error creating template ${template.name}:`, err.message);
      }
    }
    
    console.log(`Process completed. Created ${createdCount} templates.`);
    
    // List all templates to verify
    const finalTemplates = await TestTemplate.find({});
    console.log(`Final count: ${finalTemplates.length} templates in the database`);
    
    // Close the connection
    mongoose.connection.close();
  } catch (error) {
    console.error('Error creating default templates:', error);
    mongoose.connection.close();
  }
};

// The function will be called after successful connection to MongoDB
