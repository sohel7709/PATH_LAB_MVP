const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const TestTemplate = require('./src/models/TestTemplate');

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const PLACEHOLDER_USER_ID = '000000000000000000000001';

// Urine Examination Report template
const urineTemplate = {
  templateName: "URINE EXAMINATION REPORT",
  shortName: "URINE",
  createdBy: "system",
  category: "Pathology",
  isDefault: true,
  sections: [
    {
      sectionTitle: "PHYSICAL EXAM",
      displayFormat: "table",
      parameters: [
        { name: "Volume", unit: "", normalRange: "" },
        { name: "Colour", unit: "", normalRange: "" },
        { name: "Appearance", unit: "", normalRange: "" }
      ]
    },
    {
      sectionTitle: "CHEMICAL EXAM",
      displayFormat: "table",
      parameters: [
        { name: "Protein", unit: "", normalRange: "" },
        { name: "Sugar", unit: "", normalRange: "" },
        { name: "Ketone Bodies", unit: "", normalRange: "" },
        { name: "Bile Salt", unit: "", normalRange: "" },
        { name: "Bile Pigment", unit: "", normalRange: "" },
        { name: "Urobilinogen", unit: "", normalRange: "" },
        { name: "PH", unit: "", normalRange: "" }
      ]
    },
    {
      sectionTitle: "MICROSCOPIC",
      displayFormat: "table",
      parameters: [
        { name: "Red Blood cells", unit: "", normalRange: "" },
        { name: "Pus cells", unit: "/hpf", normalRange: "" },
        { name: "Epithelial cells", unit: "/hpf", normalRange: "" },
        { name: "Cast", unit: "", normalRange: "" },
        { name: "Crystals", unit: "", normalRange: "" },
        { name: "Bacteria", unit: "", normalRange: "" }
      ]
    }
  ]
};

const updateUrineTemplate = async () => {
  try {
    console.log('Connecting to MongoDB...');
    console.log('MongoDB URI:', MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB.');

    // Check if the template already exists
    const existingTemplate = await TestTemplate.findOne({ shortName: urineTemplate.shortName });

    if (existingTemplate) {
      // Update the existing template
      await TestTemplate.updateOne(
        { shortName: urineTemplate.shortName },
        {
          $set: {
            ...urineTemplate,
            updatedAt: new Date()
          }
        }
      );
      console.log(`Updated existing URINE EXAMINATION REPORT template.`);
    } else {
      // Create a new template
      await TestTemplate.create({
        ...urineTemplate,
        createdBy: PLACEHOLDER_USER_ID
      });
      console.log(`Created new URINE EXAMINATION REPORT template.`);
    }

    console.log('Operation completed successfully.');
  } catch (error) {
    console.error('Error updating URINE EXAMINATION REPORT template:', error);
    console.error('Error details:', error.stack);
  } finally {
    try {
      console.log('Disconnecting from MongoDB...');
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB.');
    } catch (err) {
      console.error('Error disconnecting from MongoDB:', err);
    }
  }
};

updateUrineTemplate();