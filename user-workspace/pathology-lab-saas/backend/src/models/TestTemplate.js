const mongoose = require('mongoose');

const testTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide template name'],
    trim: true,
    unique: true
  },
  sampleType: {
    type: String,
    required: [true, 'Please provide sample type'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please provide test category'],
    enum: ['hematology', 'biochemistry', 'microbiology', 'immunology', 'pathology', 'endocrinology', 'serology', 'urinalysis', 'cardiology', 'gastroenterology']
  },
  description: {
    type: String,
    trim: true
  },
  fields: [{
    parameter: {
      type: String,
      required: true
    },
    unit: String,
    reference_range: String
  }],
  sections: {
    type: Map,
    of: [{
      parameter: {
        type: String,
        required: true
      },
      unit: String,
      reference_range: String
    }]
  },
  lab: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lab'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for faster queries
testTemplateSchema.index({ name: 1 });
testTemplateSchema.index({ category: 1 });
testTemplateSchema.index({ lab: 1 });
testTemplateSchema.index({ isDefault: 1 });

module.exports = mongoose.model('TestTemplate', testTemplateSchema);
