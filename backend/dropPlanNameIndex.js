require('dotenv').config({ path: 'backend/.env' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in the .env file.');
  process.exit(1);
}

const dropIndex = async () => {
  let connection;
  try {
    // Use createConnection to get more control, especially for admin tasks like dropping indexes
    connection = await mongoose.createConnection(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).asPromise();

    console.log('MongoDB Connected for index drop...');

    // Get the native MongoDB collection object
    const plansCollection = connection.collection('plans');

    // Check if the index exists before attempting to drop it
    const indexes = await plansCollection.indexes();
    const indexExists = indexes.some(index => index.name === 'name_1');

    if (indexExists) {
      console.log('Index "name_1" found on "plans" collection. Attempting to drop...');
      await plansCollection.dropIndex('name_1');
      console.log('Index "name_1" dropped successfully from "plans" collection.');
    } else {
      console.log('Index "name_1" does not exist on the "plans" collection. No action needed.');
    }

  } catch (err) {
    // Log the error, but don't necessarily fail if index drop fails (e.g., index didn't exist)
    console.error('Error during index drop operation:', err.message);
  } finally {
    // Ensure the connection is closed
    if (connection) {
      await connection.close();
      console.log('MongoDB connection closed.');
    }
  }
};

dropIndex();
