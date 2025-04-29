const mongoose = require('mongoose');
const TestTemplate = require('./src/models/TestTemplate');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/labdb';

const newTemplates = [
  {
    name: "HIV TEST",
    category: "serology",
    sampleType: "Serum/Whole Blood/Urine",
    description: "Comprehensive HIV and related screening panel.",
    isDefault: true,
    fields: [
      {
        parameter: "Blood Group",
        unit: "",
        reference_range: "N/A"
      },
      {
        parameter: "HIV I",
        unit: "",
        reference_range: "Non-Reactive"
      },
      {
        parameter: "HIV II",
        unit: "",
        reference_range: "Non-Reactive"
      },
      {
        parameter: "HBsAg",
        unit: "",
        reference_range: "Negative"
      },
      {
        parameter: "Random Blood Sugar",
        unit: "mg%",
        reference_range: "Up to 140 mg%"
      }
    ]
  }
];

async function replaceTemplates() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    
    // Delete all existing templates
    console.log('Deleting all existing templates...');
    await TestTemplate.deleteMany({});
    
    // Insert new template
    console.log('Inserting HIV TEST template...');
    await TestTemplate.insertMany(newTemplates);
    
    console.log('All previous test templates deleted and new HIV TEST template inserted.');
    process.exit(0);
  } catch (err) {
    console.error('Error replacing test templates:', err);
    process.exit(1);
  }
}

replaceTemplates();
