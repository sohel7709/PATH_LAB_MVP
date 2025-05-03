const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file located in the backend directory
dotenv.config({ path: path.resolve(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const INDEX_TO_DROP = 'name_1'; // The index name from the error message

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in the .env file.');
  process.exit(1);
}

const dropIndex = async () => {
  let connection;
  try {
    console.log('Connecting to MongoDB...');
    // Connect using mongoose to easily access the native driver's db object
    connection = await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    const db = connection.connection.db;
    const collection = db.collection('testtemplates'); // Get the native collection object

    console.log(`Checking if index "${INDEX_TO_DROP}" exists...`);
    const indexExists = await collection.indexExists(INDEX_TO_DROP);

    if (indexExists) {
      console.log(`Attempting to drop index "${INDEX_TO_DROP}"...`);
      await collection.dropIndex(INDEX_TO_DROP);
      console.log(`Successfully dropped index "${INDEX_TO_DROP}".`);
    } else {
      console.log(`Index "${INDEX_TO_DROP}" does not exist or was already dropped.`);
    }

  } catch (error) {
    console.error(`Error dropping index "${INDEX_TO_DROP}":`, error);
  } finally {
    if (connection) {
      console.log('Disconnecting from MongoDB...');
      await connection.disconnect();
      console.log('Disconnected from MongoDB.');
    }
  }
};

dropIndex();
