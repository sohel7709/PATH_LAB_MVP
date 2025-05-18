const Template = require('../models/Template');
const User = require('../models/User'); // Assuming User model is needed for createdBy

// @desc    Create a template
// @route   POST /api/templates
// @access  Super Admin
exports.createTemplate = async (req, res) => {
  try {
    const { name, jsonSchema, isSystemTemplate = false } = req.body;

    // Check if a template with the same name already exists
    const existingTemplate = await Template.findOne({ name });
    if (existingTemplate) {
      return res.status(400).json({
        success: false,
        message: 'Template with this name already exists',
      });
    }

    const template = await Template.create({
      name,
      jsonSchema,
      createdBy: req.user._id, // Assuming req.user is populated by auth middleware
      isSystemTemplate,
    });

    res.status(201).json({
      success: true,
      data: template,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

// @desc    Toggle isSystemTemplate status of a template
// @route   PUT /api/templates/:id/toggle-system
// @access  Super Admin
exports.toggleSystemTemplate = async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    template.isSystemTemplate = !template.isSystemTemplate;
    await template.save();

    res.status(200).json({
      success: true,
      data: template,
      message: `Template '${template.name}' system status toggled to ${template.isSystemTemplate}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

// @desc    List all templates
// @route   GET /api/templates
// @access  Super Admin
exports.getTemplates = async (req, res) => {
  try {
    const { name } = req.query;
    let query = {};

    if (name) {
      query.name = { $regex: name, $options: 'i' }; // Case-insensitive search
    }

    const templates = await Template.find(query).populate('createdBy', 'name email'); // Populate createdBy user details

    res.status(200).json({
      success: true,
      count: templates.length,
      data: templates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

// @desc    Get a single template
// @route   GET /api/templates/:id
// @access  Super Admin
exports.getTemplate = async (req, res) => {
  try {
    const template = await Template.findById(req.params.id).populate('createdBy', 'name email');

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

// @desc    Update a template
// @route   PUT /api/templates/:id
// @access  Super Admin
exports.updateTemplate = async (req, res) => {
  try {
    let template = await Template.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    // Prevent changing isSystemTemplate via update route
    if (req.body.isSystemTemplate !== undefined && req.body.isSystemTemplate !== template.isSystemTemplate) {
       return res.status(400).json({
         success: false,
         message: 'Cannot change isSystemTemplate status via this route',
       });
    }

    template = await Template.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

// @desc    Delete a template
// @route   DELETE /api/templates/:id
// @access  Super Admin
exports.deleteTemplate = async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    // Allow deletion of system templates only if explicitly confirmed (e.g., via a query parameter)
    const forceDelete = req.query.force === 'true';
    if (template.isSystemTemplate && !forceDelete) {
       return res.status(400).json({
         success: false,
         message: 'This is a system template. Add ?force=true to the query string to confirm deletion.',
       });
    }


    await template.deleteOne();

    res.status(200).json({
      success: true,
      data: {}, // Return empty object for successful deletion
      message: 'Template removed',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};
