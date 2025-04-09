const User = require('../models/User');
const Lab = require('../models/Lab');

// @desc    Create new user
// @route   POST /api/users
// @access  Private/Super Admin
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, labId } = req.body;

    // Validate role
    if (!['super-admin', 'admin', 'technician'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      lab: role !== 'super-admin' ? labId : undefined
    });

    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Super Admin
exports.getUsers = async (req, res, next) => {
  try {
    // Build query based on request parameters
    let query = {};
    
    // Filter by lab if lab parameter is provided
    if (req.query.lab) {
      query.lab = req.query.lab;
    }
    
    // Filter by role if role parameter is provided
    if (req.query.role) {
      query.role = req.query.role;
    }
    
    console.log('User query:', query);
    
    const users = await User.find(query).populate('lab', 'name');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Super Admin
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('lab', 'name');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Super Admin
exports.updateUser = async (req, res, next) => {
  try {
    // Get the existing user
    const existingUser = await User.findById(req.params.id);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If lab is already assigned and trying to change it, prevent it
    if (existingUser.lab && req.body.lab && existingUser.lab.toString() !== req.body.lab.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Lab assignment cannot be changed once set'
      });
    }

    // If labId is provided instead of lab, convert it
    if (req.body.labId && !req.body.lab) {
      req.body.lab = req.body.labId;
      delete req.body.labId;
    }

    // Update the user
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error updating user:', error);
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Super Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Use findByIdAndDelete instead of remove() which is deprecated
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    next(error);
  }
};
