const mongoose = require('mongoose');
const TestTemplate = require('./src/models/TestTemplate');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/labdb';

async function markAllDefault() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    await TestTemplate.updateMany({}, { $set: { isDefault: true } });
    console.log('All test templates marked as default.');
    process.exit(0);
  } catch (err) {
    console.error('Error updating templates:', err);
    process.exit(1);
  }
}

markAllDefault();
