const TestTemplate = require('../models/TestTemplate');

// @desc    Create new test template
// @route   POST /api/admin/test-templates
// @access  Private/Admin
exports.createTestTemplate = async (req, res, next) => {
  try {
    // Add creator info to template
    req.body.createdBy = req.user.id;
    
    // Handle lab association based on user role
    if (req.user.role === 'super-admin') {
      // For super-admin, templates can be created without a lab association
      // or they can specify a lab if they want to associate it with a specific lab
      if (!req.body.lab) {
        // If no lab is specified, mark it as a default template
        req.body.isDefault = true;
      }
    } else {
      // For non-super-admin users, associate with their lab
      req.body.lab = req.user.lab;
    }

    const template = await TestTemplate.create(req.body);

    res.status(201).json({
      success: true,
      data: template
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all test templates for a lab
// @route   GET /api/admin/test-templates or /api/technician/test-templates
// @access  Private/Admin/Technician
exports.getTestTemplates = async (req, res, next) => {
  try {
    let query = {};
    
    // Super admins can see all templates
    if (req.user.role !== 'super-admin') {
      // Non-super-admin users can only see templates from their lab and default templates
      query = { $or: [{ lab: req.user.lab }, { isDefault: true }] };
    }

    // Add filters from query parameters
    if (req.query.category) {
      query.category = req.query.category;
    }
    if (req.query.name) {
      query.name = new RegExp(req.query.name, 'i');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await TestTemplate.countDocuments(query);

    const templates = await TestTemplate.find(query)
      .populate({
        path: 'createdBy',
        select: 'name email'
      })
      .populate({
        path: 'lab',
        select: 'name'
      })
      .skip(startIndex)
      .limit(limit)
      .sort({ name: 1 });

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: templates.length,
      pagination,
      data: templates
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single test template
// @route   GET /api/admin/test-templates/:id or /api/technician/test-templates/:id
// @access  Private/Admin/Technician
exports.getTestTemplate = async (req, res, next) => {
  try {
    console.log('Getting template with ID:', req.params.id);
    
    const template = await TestTemplate.findById(req.params.id)
      .populate({
        path: 'createdBy',
        select: 'name email'
      })
      .populate({
        path: 'lab',
        select: 'name'
      });

    if (!template) {
      console.log('Template not found');
      return res.status(404).json({
        success: false,
        message: 'Test template not found'
      });
    }

    console.log('Template found:', template.name);
    console.log('User role:', req.user.role);
    
    // Super admins can access any template
    if (req.user.role !== 'super-admin') {
      console.log('User is not super-admin, checking access');
      console.log('Template isDefault:', template.isDefault);
      console.log('Template lab:', template.lab);
      console.log('User lab:', req.user.lab);
      
      // For non-super-admin users, check if they have access to this template
      if (!template.isDefault && template.lab) {
        if (template.lab.toString() !== req.user.lab.toString()) {
          console.log('Access denied: lab mismatch');
          return res.status(403).json({
            success: false,
            message: 'Not authorized to access this test template'
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error in getTestTemplate:', error);
    next(error);
  }
};

// @desc    Update test template
// @route   PUT /api/admin/test-templates/:id
// @access  Private/Admin
exports.updateTestTemplate = async (req, res, next) => {
  try {
    let template = await TestTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Test template not found'
      });
    }

    // Check if user has access to update this template
    if (req.user.role !== 'super-admin') {
      // Regular admins cannot modify default templates
      if (template.isDefault) {
        return res.status(403).json({
          success: false,
          message: 'Default templates cannot be modified by regular admins'
        });
      }

      // Regular admins can only modify templates from their lab
      if (template.lab && template.lab.toString() !== req.user.lab.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this test template'
        });
      }
    }

    // Preserve existing data that shouldn't be overwritten
    const updateData = {
      ...req.body,
      createdBy: template.createdBy, // Ensure creator cannot be changed
    };
    
    // Only super-admin can change isDefault status
    if (req.user.role !== 'super-admin') {
      updateData.isDefault = template.isDefault;
      updateData.lab = template.lab; // Regular admins cannot change lab
    }

    template = await TestTemplate.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete test template
// @route   DELETE /api/admin/test-templates/:id
// @access  Private/Admin
exports.deleteTestTemplate = async (req, res, next) => {
  try {
    const template = await TestTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Test template not found'
      });
    }

    // Check if user has access to delete this template
    if (req.user.role !== 'super-admin') {
      // Regular admins cannot delete default templates
      if (template.isDefault) {
        return res.status(403).json({
          success: false,
          message: 'Default templates cannot be deleted by regular admins'
        });
      }

      // Regular admins can only delete templates from their lab
      if (template.lab && template.lab.toString() !== req.user.lab.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this test template'
        });
      }
    }

    await TestTemplate.findByIdAndDelete(template._id);

    res.status(200).json({
      success: true,
      message: 'Test template deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create default test templates
// @route   POST /api/super-admin/test-templates/create-defaults
// @access  Private/Super-Admin
exports.createDefaultTemplates = async (req, res, next) => {
  try {
    // Check if default templates already exist
    const existingDefaults = await TestTemplate.find({ isDefault: true });

    if (existingDefaults.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Default templates already exist',
      });
    }

    // Read default templates from JSON file
    const defaultTemplates = require('../utils/defaultTestTemplates.json');

    if (!defaultTemplates || !Array.isArray(defaultTemplates) || defaultTemplates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No templates found in defaultTestTemplates.json',
      });
    }

    // Mark all templates as default and add createdBy
    const templatesWithDefaults = defaultTemplates.map((template) => ({
      ...template,
      isDefault: true,
      createdBy: req.user.id,
    }));

    const createdTemplates = await TestTemplate.create(templatesWithDefaults);

    res.status(201).json({
      success: true,
      count: createdTemplates.length,
      data: createdTemplates,
    });
  } catch (error) {
    next(error);
  }
};
