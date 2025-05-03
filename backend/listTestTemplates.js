const mongoose = require('mongoose');
const TestTemplate = require('./src/models/TestTemplate');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/labdb';

async function listTemplates() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const templates = await TestTemplate.find({});
    console.log('Templates in database:', templates.map(t => ({
      id: t._id,
      name: t.name,
      category: t.category,
      isDefault: t.isDefault,
      sampleType: t.sampleType
    })));
    process.exit(0);
  } catch (err) {
    console.error('Error listing templates:', err);
    process.exit(1);
  }
}

listTemplates();
