require('dotenv').config();
const mongoose = require('mongoose');
const TestTemplate = require('./src/models/TestTemplate');

// Connect to MongoDB

const dotenv = require('dotenv');
dotenv.config({ path: './backend/.env' });

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
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
    const deleteResult = await TestTemplate.deleteMany({});
    
    
    let createdCount = 0;
    
    // Create all templates
    for (const template of defaultTemplates) {
      
      // Add isDefault flag
      template.isDefault = true;
      
      try {
        // Create the template
        const createdTemplate = await TestTemplate.create(template);
        createdCount++;
      } catch (err) {
        console.error(`Error creating template ${template.name}:`, err.message);
      }
    }
    
    
    // List all templates to verify
    const finalTemplates = await TestTemplate.find({});
    
    // Close the connection
    mongoose.connection.close();
  } catch (error) {
    console.error('Error creating default templates:', error);
    mongoose.connection.close();
  }
};

// The function will be called after successful connection to MongoDB
