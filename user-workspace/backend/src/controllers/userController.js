const User = require('../models/User');
const Lab = require('../models/Lab');

// @desc    Create new user
// @route   POST /api/users
// @access  Private/Super Admin
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, labId } = req.body;

    console.log('Creating user with data:', { name, email, role, labId });

    // Validate role
    if (!['super-admin', 'admin', 'technician'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    // Validate lab assignment for non-super-admin roles
    if (role !== 'super-admin') {
      if (!labId) {
        return res.status(400).json({
          success: false,
          message: 'Lab ID is required for admin and technician roles'
        });
      }

      // Verify the lab exists
      try {
        const lab = await Lab.findById(labId);
        console.log('Found lab for assignment:', lab ? { id: lab._id, name: lab.name } : 'No lab found');
        
        if (!lab) {
          return res.status(400).json({
            success: false,
            message: 'Lab not found'
          });
        }
      } catch (labError) {
        console.error('Error finding lab:', labError);
        return res.status(500).json({
          success: false,
          message: 'Error verifying lab information'
        });
      }
    }

    // Create user
    const userData = {
      name,
      email,
      password,
      role,
      lab: role !== 'super-admin' ? labId : undefined
    };
    
    console.log('Creating user with final data:', userData);
    const user = await User.create(userData);
    
    // Verify the user was created with the lab assigned
    const createdUser = await User.findById(user._id).populate('lab', 'name');
    console.log('Created user:', {
      id: createdUser._id,
      name: createdUser.name,
      email: createdUser.email,
      role: createdUser.role,
      lab: createdUser.lab ? { id: createdUser.lab._id, name: createdUser.lab.name } : 'No lab'
    });

    res.status(201).json({
      success: true,
      data: createdUser
    });
  } catch (error) {
    console.error('Error creating user:', error);
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
    
    // Populate lab information with name and subscription status
    const users = await User.find(query).populate({
      path: 'lab',
      select: 'name subscription.status'
    });

    // Log the populated users for debugging
    console.log('Users with populated lab:', users.map(u => ({
      id: u._id,
      name: u.name,
      role: u.role,
      lab: u.lab ? u.lab.name : 'No lab'
    })));

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error getting users:', error);
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Super Admin
exports.getUser = async (req, res, next) => {
  try {
    // Populate lab information with name and subscription status
    const user = await User.findById(req.params.id).populate({
      path: 'lab',
      select: 'name subscription.status'
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // For non-super-admin users, verify lab exists and is properly populated
    if (user.role !== 'super-admin' && !user.lab) {
      // Try to find the lab directly
      const userWithLab = await User.findById(req.params.id);
      
      if (userWithLab.lab) {
        // Lab ID exists but wasn't populated, try to get lab details
        const lab = await Lab.findById(userWithLab.lab);
        if (lab) {
          user.lab = lab;
        } else {
          console.error(`Lab with ID ${userWithLab.lab} not found for user ${user._id}`);
        }
      } else {
        console.error(`User ${user._id} has no lab assigned`);
      }
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error getting user:', error);
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

    // Handle password update separately to ensure proper hashing
    if (req.body.password) {
      // Get the user with the password field
      const userWithPassword = await User.findById(req.params.id).select('+password');
      userWithPassword.password = req.body.password;
      await userWithPassword.save();
      
      // Remove password from req.body to avoid overwriting the hashed password
      delete req.body.password;
    }

    // Update the user with the remaining fields
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
