const TestTemplate = require('../models/TestTemplate');

exports.createTestTemplate = async (req, res, next) => {
  try {
    req.body.createdBy = req.user.id;
    req.body.createdByRole = req.user.role;
    
    if (req.body.name && !req.body.templateName) req.body.templateName = req.body.name;
    if (!req.body.shortName) req.body.shortName = (req.body.templateName || req.body.name || 'TEMPLATE').toUpperCase().replace(/\s+/g, '_');
    if (req.body.fields && !req.body.sections) {
      req.body.sections = [{ sectionTitle: 'Parameters', parameters: req.body.fields.map(f => ({ name: f.parameter || f.name || '', unit: f.unit || '', referenceRange: f.reference_range || f.referenceRange || '' })), displayFormat: 'table' }];
      delete req.body.fields;
    }
    
    if (req.user.role === 'super-admin') {
      req.body.templateType = req.body.templateType || 'global';
      req.body.lab = null;
      if (req.body.templateType === 'default') req.body.isDefault = true;
    } else if (req.user.role === 'admin') {
      req.body.templateType = 'local';
      req.body.lab = req.user.lab;
      if (!req.user.lab) return res.status(400).json({ success: false, message: 'Admin has no lab assigned' });
    }
    const template = await TestTemplate.create(req.body);
    res.status(201).json({ success: true, data: template });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: Object.values(error.errors).map(e => e.message).join(', ') });
    }
    next(error);
  }
};

exports.getTestTemplates = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role !== 'super-admin') {
      query = { $or: [{ templateType: 'default' }, { templateType: 'global' }, { isDefault: true }, { templateType: 'local', lab: req.user.lab }, { templateType: { $exists: false }, lab: null }, { templateType: { $exists: false }, isDefault: true }] };
    }
    if (req.query.category) query.category = req.query.category;
    if (req.query.name) query.templateName = new RegExp(req.query.name, 'i');
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const total = await TestTemplate.countDocuments(query);
    const templates = await TestTemplate.find(query).populate({ path: 'createdBy', select: 'name email' }).populate({ path: 'lab', select: 'name' }).skip((page - 1) * limit).limit(limit).sort({ templateName: 1 });
    const pagination = {};
    if (page * limit < total) pagination.next = { page: page + 1, limit };
    if (page > 1) pagination.prev = { page: page - 1, limit };
    res.status(200).json({ success: true, count: templates.length, pagination, data: templates });
  } catch (error) { next(error); }
};

exports.getTestTemplate = async (req, res, next) => {
  try {
    const template = await TestTemplate.findById(req.params.id).populate({ path: 'createdBy', select: 'name email' }).populate({ path: 'lab', select: 'name' });
    if (!template) return res.status(404).json({ success: false, message: 'Test template not found' });

    if (req.user.role !== 'super-admin') {
      const isPublic = template.templateType === 'default' || template.templateType === 'global' || template.isDefault || (!template.lab && !template.templateType);
      if (!isPublic) {
        // .populate makes template.lab an object { _id, name }, extract the _id
        const templateLabId = template.lab?._id?.toString() || template.lab?.toString();
        const userLabId = req.user.lab?.toString();
        if (!templateLabId || templateLabId !== userLabId) {
          return res.status(403).json({ success: false, message: 'Not authorized to access this test template' });
        }
      }
    }
    res.status(200).json({ success: true, data: template });
  } catch (error) { next(error); }
};

exports.updateTestTemplate = async (req, res, next) => {
  try {
    let template = await TestTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ success: false, message: 'Test template not found' });
    if (req.user.role !== 'super-admin') {
      if (template.templateType === 'default' || template.templateType === 'global' || template.isDefault) return res.status(403).json({ success: false, message: 'Cannot modify default or global templates' });
      const templateLabId = template.lab?._id?.toString() || template.lab?.toString();
      if (templateLabId && templateLabId !== req.user.lab?.toString()) return res.status(403).json({ success: false, message: 'Not authorized to update this template' });
    }
    if (req.body.fields && !req.body.sections) { req.body.sections = [{ sectionTitle: 'Parameters', parameters: req.body.fields.map(f => ({ name: f.parameter || f.name || '', unit: f.unit || '', referenceRange: f.reference_range || f.referenceRange || '' })), displayFormat: 'table' }]; delete req.body.fields; }
    if (req.body.name && !req.body.templateName) req.body.templateName = req.body.name;
    const updateData = { ...req.body };
    if (req.user.role !== 'super-admin') { updateData.templateType = template.templateType; updateData.lab = template.lab; updateData.isDefault = template.isDefault; updateData.createdBy = template.createdBy; }
    template = await TestTemplate.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: template });
  } catch (error) { next(error); }
};

exports.deleteTestTemplate = async (req, res, next) => {
  try {
    const template = await TestTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ success: false, message: 'Test template not found' });
    if (req.user.role !== 'super-admin') {
      if (template.templateType === 'default' || template.templateType === 'global' || template.isDefault) return res.status(403).json({ success: false, message: 'Cannot delete default or global templates' });
      const templateLabId = template.lab?._id?.toString() || template.lab?.toString();
      if (templateLabId && templateLabId !== req.user.lab?.toString()) return res.status(403).json({ success: false, message: 'Not authorized to delete this template' });
    }
    await TestTemplate.findByIdAndDelete(template._id);
    res.status(200).json({ success: true, message: 'Template deleted' });
  } catch (error) { next(error); }
};

exports.createDefaultTemplates = async (req, res, next) => {
  try {
    const existingDefaults = await TestTemplate.find({ isDefault: true });
    if (existingDefaults.length > 0) return res.status(400).json({ success: false, message: 'Default templates already exist' });
    const defaultTemplates = require('../utils/defaultTestTemplates.json');
    if (!defaultTemplates || !Array.isArray(defaultTemplates) || defaultTemplates.length === 0) return res.status(400).json({ success: false, message: 'No templates found' });
    const templatesWithDefaults = defaultTemplates.map(t => ({ ...t, templateType: 'default', isDefault: true, createdBy: req.user.id, createdByRole: 'super-admin' }));
    const createdTemplates = await TestTemplate.create(templatesWithDefaults);
    res.status(201).json({ success: true, count: createdTemplates.length, data: createdTemplates });
  } catch (error) { next(error); }
};