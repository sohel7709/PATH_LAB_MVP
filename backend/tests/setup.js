const mongoose = require('mongoose');

// Set env vars (globalSetup runs in a separate context; re-set them here)
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.JWT_EXPIRE = '1d';
process.env.NODE_ENV = 'test';

beforeAll(async () => {
  // MONGODB_URI was set by globalSetup; connect here
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
