require('dotenv').config();
const mongoose = require('mongoose');
const TestTemplate = require('./src/models/TestTemplate');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Default test templates
const defaultTemplates = [
  {
    name: "Complete Blood Count (CBC)",
    sampleType: "Blood",
    category: "hematology",
    description: "Test to evaluate overall health and detect a wide range of disorders including anemia, infection, and leukemia.",
    isDefault: true,
    fields: [
      { parameter: "Hemoglobin (Hb)", unit: "g/dL", reference_range: "13.5 - 17.5 (Male), 12.0 - 15.5 (Female)" },
      { parameter: "Red Blood Cells (RBC)", unit: "million/μL", reference_range: "4.5 - 5.9 (Male), 4.1 - 5.1 (Female)" },
      { parameter: "White Blood Cells (WBC)", unit: "thousand/μL", reference_range: "4.5 - 11.0" },
      { parameter: "Platelets", unit: "thousand/μL", reference_range: "150 - 450" },
      { parameter: "Hematocrit (Hct)", unit: "%", reference_range: "41 - 50 (Male), 36 - 44 (Female)" },
      { parameter: "Mean Corpuscular Volume (MCV)", unit: "fL", reference_range: "80 - 96" },
      { parameter: "Mean Corpuscular Hemoglobin (MCH)", unit: "pg", reference_range: "27 - 33" },
      { parameter: "Mean Corpuscular Hemoglobin Concentration (MCHC)", unit: "g/dL", reference_range: "33 - 36" },
      { parameter: "Red Cell Distribution Width (RDW)", unit: "%", reference_range: "11.5 - 14.5" },
      { parameter: "Neutrophils", unit: "%", reference_range: "40 - 60" },
      { parameter: "Lymphocytes", unit: "%", reference_range: "20 - 40" },
      { parameter: "Monocytes", unit: "%", reference_range: "2 - 8" },
      { parameter: "Eosinophils", unit: "%", reference_range: "1 - 4" },
      { parameter: "Basophils", unit: "%", reference_range: "0.5 - 1" }
    ]
  },
  {
    name: "C-Reactive Protein (CRP)",
    sampleType: "Blood",
    category: "biochemistry",
    description: "Test to measure the level of C-reactive protein in the blood, which is a marker of inflammation.",
    isDefault: true,
    fields: [
      { parameter: "C-Reactive Protein (CRP)", unit: "mg/L", reference_range: "0 - 10" }
    ]
  },
  {
    name: "Blood Sugar Level",
    sampleType: "Blood",
    category: "biochemistry",
    description: "Test to measure the amount of glucose in the blood.",
    isDefault: true,
    fields: [
      { parameter: "Fasting Blood Sugar", unit: "mg/dL", reference_range: "70 - 99" },
      { parameter: "Postprandial Blood Sugar", unit: "mg/dL", reference_range: "< 140" },
      { parameter: "Random Blood Sugar", unit: "mg/dL", reference_range: "< 200" }
    ]
  },
  {
    name: "Kidney Function Test (KFT)",
    sampleType: "Blood",
    category: "biochemistry",
    description: "Test to evaluate how well the kidneys are functioning.",
    isDefault: true,
    fields: [
      { parameter: "Urea", unit: "mg/dL", reference_range: "10 - 45" },
      { parameter: "Creatinine", unit: "mg/dL", reference_range: "0.6 - 1.3" },
      { parameter: "Uric Acid", unit: "mg/dL", reference_range: "2.6 - 6.0" },
      { parameter: "Blood Urea Nitrogen", unit: "mg/dL", reference_range: "7 - 20" },
      { parameter: "eGFR", unit: "mL/min", reference_range: "> 60" }
    ]
  },
  {
    name: "Liver Function Test (LFT)",
    sampleType: "Blood",
    category: "biochemistry",
    description: "Test to evaluate how well the liver is functioning.",
    isDefault: true,
    fields: [
      { parameter: "Total Bilirubin", unit: "mg/dL", reference_range: "0.1 - 1.2" },
      { parameter: "Direct Bilirubin", unit: "mg/dL", reference_range: "0.0 - 0.3" },
      { parameter: "SGPT (ALT)", unit: "U/L", reference_range: "7 - 56" },
      { parameter: "SGOT (AST)", unit: "U/L", reference_range: "10 - 40" },
      { parameter: "ALP", unit: "U/L", reference_range: "44 - 147" },
      { parameter: "Total Protein", unit: "g/dL", reference_range: "6.0 - 8.3" },
      { parameter: "Albumin", unit: "g/dL", reference_range: "3.5 - 5.0" },
      { parameter: "A/G Ratio", unit: "-", reference_range: "1.0 - 2.2" }
    ]
  },
  {
    name: "Electrolyte Level",
    sampleType: "Blood",
    category: "biochemistry",
    description: "Test to measure the levels of electrolytes in the blood.",
    isDefault: true,
    fields: [
      { parameter: "Sodium (Na⁺)", unit: "mmol/L", reference_range: "135 - 145" },
      { parameter: "Potassium (K⁺)", unit: "mmol/L", reference_range: "3.5 - 5.1" },
      { parameter: "Chloride (Cl⁻)", unit: "mmol/L", reference_range: "96 - 106" },
      { parameter: "Bicarbonate (HCO₃⁻)", unit: "mmol/L", reference_range: "22 - 29" }
    ]
  },
  {
    name: "Antenatal Care Profile",
    sampleType: "Blood/Urine",
    category: "pathology",
    description: "Test profile for pregnant women to monitor their health during pregnancy.",
    isDefault: true,
    fields: [
      { parameter: "Hemoglobin", unit: "g/dL", reference_range: "11.0 - 14.0" },
      { parameter: "Blood Group & Rh", unit: "-", reference_range: "-" },
      { parameter: "VDRL", unit: "-", reference_range: "Non-reactive" },
      { parameter: "HBsAg", unit: "-", reference_range: "Negative" },
      { parameter: "HIV I & II", unit: "-", reference_range: "Non-reactive" },
      { parameter: "Fasting Blood Sugar", unit: "mg/dL", reference_range: "< 95" },
      { parameter: "Urine Albumin", unit: "-", reference_range: "Negative" },
      { parameter: "Urine Sugar", unit: "-", reference_range: "Negative" }
    ]
  },
  {
    name: "Preoperative Profile",
    sampleType: "Blood/Urine",
    category: "pathology",
    description: "Test profile for patients before surgery to assess their health status.",
    isDefault: true,
    fields: [
      { parameter: "Hemoglobin", unit: "g/dL", reference_range: "13.0 - 17.0 (Male)" },
      { parameter: "Fasting Blood Sugar", unit: "mg/dL", reference_range: "70 - 99" },
      { parameter: "Blood Urea", unit: "mg/dL", reference_range: "10 - 45" },
      { parameter: "Serum Creatinine", unit: "mg/dL", reference_range: "0.6 - 1.3" },
      { parameter: "SGPT (LFT)", unit: "U/L", reference_range: "7 - 56" },
      { parameter: "PT/INR", unit: "INR", reference_range: "0.8 - 1.2" },
      { parameter: "ECG", unit: "-", reference_range: "Normal" },
      { parameter: "Chest X-Ray", unit: "-", reference_range: "Normal" }
    ]
  },
  {
    name: "Urine Examination",
    sampleType: "Urine",
    category: "pathology",
    description: "Test to analyze the physical, chemical, and microscopic properties of urine.",
    isDefault: true,
    fields: [],
    sections: {
      "Physical Examination": [
        { parameter: "Color", unit: "-", reference_range: "Pale Yellow" },
        { parameter: "Appearance", unit: "-", reference_range: "Clear" },
        { parameter: "Volume", unit: "-", reference_range: "Adequate" },
        { parameter: "pH", unit: "-", reference_range: "4.6 - 8.0" },
        { parameter: "Specific Gravity", unit: "-", reference_range: "1.005 - 1.030" }
      ],
      "Chemical Examination": [
        { parameter: "Albumin", unit: "-", reference_range: "Negative" },
        { parameter: "Sugar", unit: "-", reference_range: "Negative" },
        { parameter: "Ketones", unit: "-", reference_range: "Negative" },
        { parameter: "Bilirubin", unit: "-", reference_range: "Negative" },
        { parameter: "Urobilinogen", unit: "-", reference_range: "Normal" }
      ],
      "Microscopic Examination": [
        { parameter: "Pus Cells", unit: "/HPF", reference_range: "0 - 5" },
        { parameter: "RBCs", unit: "/HPF", reference_range: "0 - 2" },
        { parameter: "Epithelial Cells", unit: "-", reference_range: "Few" },
        { parameter: "Crystals", unit: "-", reference_range: "Nil" },
        { parameter: "Casts", unit: "-", reference_range: "Nil" }
      ]
    }
  }
];

// Function to create templates
const createTemplates = async () => {
  try {
    // Delete existing default templates
    await TestTemplate.deleteMany({ isDefault: true });
    console.log('Deleted existing default templates');

    // Create new default templates
    const result = await TestTemplate.insertMany(defaultTemplates);
    console.log(`Created ${result.length} default test templates`);
    
    // Close the connection
    mongoose.connection.close();
  } catch (error) {
    console.error('Error creating default templates:', error);
    mongoose.connection.close();
  }
};

// Run the function
createTemplates();
