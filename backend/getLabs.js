const mongoose = require('mongoose');
const Lab = require('./src/models/Lab');
const db = 'mongodb://localhost:27017/pathology-lab-saas'; // Update with your MongoDB connection string

const getLabs = async () => {
  try {
    await mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true });
    const labs = await Lab.find();
    console.log('Existing Labs:', labs);
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error fetching labs:', error);
    process.exit(1);
  }
};

getLabs();
