const mongoose = require('mongoose');

// Schema for an individual test parameter within a section
const testParameterSchema = new mongoose.Schema({
  name: { type: String, required: true },      // e.g., "SERUM CREATININE", "TOTAL", "Neutrophils"
  unit: { type: String, default: '' },         // e.g., "mg%", "U/L", "gms%"
  normalRange: { type: String, default: '' },  // e.g., "0.6 - 1.4 mg%", "M - 13.5 - 18.0"
  isSubparameter: { type: Boolean, default: false },
  notes: { type: String, default: '' },
  isHeader: { type: Boolean, default: false },      // <<< ADD isHeader
  inputType: { type: String, default: 'text' },     // <<< ADD inputType (default to text)
  options: { type: [String], default: undefined }, // <<< ADD options (array of strings)
  // Result field will be added when generating a report, not stored in the template itself
}, { _id: false });

// Schema for a section within a template (e.g., "Differential Count", "MICROSCOPIC")
const testSectionSchema = new mongoose.Schema({
  sectionTitle: { type: String, default: '' }, // Optional title like "PHYSICAL EXAM"
  parameters: [testParameterSchema],          // Array of parameters in this section
  displayFormat: {                            // Hint for frontend rendering
    type: String,
    enum: ['table', 'list', 'key-value', 'paragraph'], // Defines how to display this section
    default: 'table'
  },
  notes: { type: String, default: '' },        // Section-level notes
}, { _id: false });

// Main schema for the Test Template
const testTemplateSchema = new mongoose.Schema({
  templateName: {                             // Full name, e.g., "Kidney Function Test"
    type: String,
    required: true,
    // Consider adding unique constraint based on lab or globally for defaults
  },
  shortName: {                                // Short code, e.g., "KFT", "LFT"
    type: String,
    required: true,
    // Consider adding unique constraint
  },
  category: {                                 // Optional category for grouping
    type: String,
    default: 'General'
  },
  sections: [testSectionSchema],              // Array of sections making up the template
  lab: {                                      // Associated lab (optional for defaults)
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lab',
  },
  isDefault: {                                // Is this a default template?
    type: Boolean,
    default: false,
  },
  createdBy: {                                // User who created it
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,                           // Adds createdAt and updatedAt
});

// Indexing for faster queries (optional but recommended)
testTemplateSchema.index({ shortName: 1, lab: 1 });
testTemplateSchema.index({ templateName: 1, lab: 1 });
testTemplateSchema.index({ isDefault: 1, category: 1 });


module.exports = mongoose.model('TestTemplate', testTemplateSchema);
