const mongoose = require('mongoose');

const testParameterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  unit: { type: String, default: '' },
  referenceRange: { type: String, default: '' },
  isSubparameter: { type: Boolean, default: false },
  notes: { type: String, default: '' },
  isHeader: { type: Boolean, default: false },
  inputType: { type: String, default: 'text' },
  options: { type: [String], default: undefined },
}, { _id: false });

const testSectionSchema = new mongoose.Schema({
  sectionTitle: { type: String, default: '' },
  parameters: [testParameterSchema],
  displayFormat: {
    type: String,
    enum: ['table', 'list', 'key-value', 'paragraph'],
    default: 'table'
  },
  notes: { type: String, default: '' },
}, { _id: false });

const testTemplateSchema = new mongoose.Schema({
  templateName: {
    type: String,
    required: true,
  },
  shortName: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    default: 'General'
  },
  description: {
    type: String,
    default: ''
  },
  sampleType: {
    type: String,
    default: ''
  },
  sections: [testSectionSchema],
  lab: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lab',
    default: null,
  },
  templateType: {
    type: String,
    enum: ['default', 'global', 'local'],
    default: 'global',
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdByRole: {
    type: String,
    enum: ['super-admin', 'admin', 'technician'],
  },
}, {
  timestamps: true,
});

testTemplateSchema.index({ shortName: 1, lab: 1 });
testTemplateSchema.index({ templateName: 1, lab: 1 });
testTemplateSchema.index({ isDefault: 1, category: 1 });
testTemplateSchema.index({ templateType: 1, lab: 1 });

module.exports = mongoose.model('TestTemplate', testTemplateSchema);