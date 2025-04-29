const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path'); // Import path module
const TestTemplate = require('./src/models/TestTemplate'); // Adjust path as needed

// Load environment variables from .env file located in the backend directory
dotenv.config({ path: path.resolve(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in the .env file.');
  process.exit(1);
}

const deleteAllTemplates = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    console.log('Attempting to delete all test templates...');
    const result = await TestTemplate.deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} test templates.`);

  } catch (error) {
    console.error('Error deleting test templates:', error);
  } finally {
    console.log('Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

deleteAllTemplates();
