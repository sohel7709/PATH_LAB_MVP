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

    // If user is admin or technician, check if they have a lab assigned
    if (user.role !== 'super-admin') {
      // Log the user's lab information for debugging
      console.log('User lab information:', {
        userId: user._id,
        userEmail: user.email,
        userRole: user.role,
        userLab: user.lab
      });
      
      if (!user.lab) {
        return res.status(403).json({
          success: false,
          message: 'User has no lab assigned. Please contact administrator.'
        });
      }

      // Check if their lab is active
      try {
        const lab = await Lab.findById(user.lab);
        console.log('Found lab:', lab ? { id: lab._id, name: lab.name, status: lab.subscription.status } : 'No lab found');
        
        if (!lab) {
          return res.status(403).json({
            success: false,
            message: 'Assigned lab not found. Please contact administrator.'
          });
        }
        
        if (lab.subscription.status !== 'active') {
          return res.status(403).json({
            success: false,
            message: 'Lab account is inactive or suspended'
          });
        }
      } catch (labError) {
        console.error('Error finding lab:', labError);
        return res.status(500).json({
          success: false,
          message: 'Error verifying lab information. Please contact administrator.'
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

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // For non-super-admin users, verify lab exists and is properly populated
    if (user.role !== 'super-admin' && !user.lab) {
      // Try to find the lab directly
      const userWithLab = await User.findById(req.user.id);
      
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
    // Get user with populated lab information
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate({
        path: 'lab',
        select: 'name subscription.status'
      });

    console.log('Verifying token for user:', user);

    if (!user) {
      console.log('User not found for token verification');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // For non-super-admin users, verify lab exists and is properly populated
    if (user.role !== 'super-admin' && !user.lab) {
      // Try to find the lab directly
      const userWithLab = await User.findById(req.user.id);
      
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
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with that email'
      });
    }

    // Generate reset token
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token and set to resetPasswordToken field
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set token expiry (15 minutes)
    const resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    // Update user with token and expiry
    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpire = resetPasswordExpire;
    await user.save();

    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;

    // Create email message
    const message = `
      <h3>Password Reset</h3>
      <p>You are receiving this email because you (or someone else) has requested the reset of a password.</p>
      <p>Please click the link below to reset your password:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>This link will expire in 15 minutes.</p>
      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
    `;

    try {
      // Send email using nodemailer
      const nodemailer = require('nodemailer');
      
      // Check if email credentials are set
      if (!process.env.EMAIL_FROM || process.env.EMAIL_FROM === 'your-email@gmail.com' ||
          !process.env.EMAIL_PASSWORD || process.env.EMAIL_PASSWORD === 'your-email-password') {
        console.log('Email credentials not properly configured. Using development mode.');
        
        // In development mode, just log the reset URL and return success
        console.log('Reset URL:', resetUrl);
        
        return res.status(200).json({
          success: true,
          message: 'Password reset link generated (email not sent in development mode)',
          resetUrl // Only include this in development mode
        });
      }
      
      // Create a transporter
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_FROM,
          pass: process.env.EMAIL_PASSWORD
        }
      });
      
      // Email options
      const mailOptions = {
        from: `"Pathology Lab" <${process.env.EMAIL_FROM}>`,
        to: user.email,
        subject: 'Reset Your Password',
        html: message
      };
      
      try {
        // Send the email
        await transporter.sendMail(mailOptions);
      } catch (emailError) {
        console.error('Email sending error details:', emailError);
        
        // Check for authentication errors
        if (emailError.message.includes('Authentication')) {
          return res.status(500).json({
            success: false,
            message: 'Email authentication failed. Please check your email credentials.',
            details: 'For Gmail, you may need to use an App Password instead of your regular password.'
          });
        }
        
        throw emailError; // Re-throw for general error handling
      }
      
      // Log the reset URL for development purposes
      console.log('Reset URL:', resetUrl);
      
      res.status(200).json({
        success: true,
        message: 'Password reset email sent'
      });
    } catch (err) {
      console.error('Email sending error:', err);
      
      // If email fails, reset the token and expiry
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      
      return res.status(500).json({
        success: false,
        message: 'Email could not be sent'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Validate password
    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet requirements'
      });
    }

    // Hash the token from the URL
    const crypto = require('crypto');
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user by token and check if token is still valid
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Set new password and clear reset token fields
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Return success message
    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    next(error);
  }
};
