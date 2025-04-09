const User = require('../models/User');
const Lab = require('../models/Lab');
const { validateEmail, validatePassword } = require('../utils/validators');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, labId } = req.body;

    // Validate email and password
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet requirements'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // If role is admin or technician, verify lab exists
    if (role !== 'super-admin') {
      if (!labId) {
        return res.status(400).json({
          success: false,
          message: 'Lab ID is required for admin and technician roles'
        });
      }

      const lab = await Lab.findById(labId);
      if (!lab) {
        return res.status(400).json({
          success: false,
          message: 'Lab not found'
        });
      }
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      lab: role !== 'super-admin' ? labId : undefined
    });

    // Generate token
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lab: user.lab
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!validateEmail(email) || !validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password format'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // If user is admin or technician, check if their lab is active
    if (user.role !== 'super-admin' && user.lab) {
      const lab = await Lab.findById(user.lab);
      if (!lab || lab.subscription.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'Lab account is inactive or suspended'
        });
      }
    }

    // Generate token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lab: user.lab
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'lab',
      select: 'name subscription.status'
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res, next) => {
  try {
    // Get the current user
    const currentUser = await User.findById(req.user.id);
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Prepare fields to update
    const fieldsToUpdate = {
      name: req.body.name,
      phone: req.body.phone
    };
    
    // Only super-admin can update email
    if (currentUser.role === 'super-admin') {
      fieldsToUpdate.email = req.body.email;
    }

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    // Generate new token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Successfully logged out'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify token and return user data
// @route   GET /api/auth/verify
// @access  Private
exports.verifyToken = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    console.log('Verifying token for user:', user); // Log the user being verified

    console.log('Verifying token for user:', user); // Log the user being verified


    if (!user) {
      console.log('User not found for token verification'); // Log if user is not found
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });


    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};
