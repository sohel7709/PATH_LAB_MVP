const User = require('../models/User');
const Lab = require('../models/Lab');

// @desc    Create new user
// @route   POST /api/users
// @access  Private/Admin, Super Admin
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, labId } = req.body;
    const isAdmin = req.user.role === 'admin';

    let finalRole = role;
    let finalLabId = labId;

    if (isAdmin) {
      // ADMIN CAN ONLY CREATE TECHNICIANS FOR THEIR OWN LAB
      if (role && role !== 'technician') {
        return res.status(403).json({
          success: false,
          message: 'Admins can only create technician accounts.'
        });
      }
      finalRole = 'technician';
      finalLabId = req.user.lab;
      if (!finalLabId) {
        return res.status(400).json({
          success: false,
          message: 'Admin has no lab assigned.'
        });
      }
      const adminLab = await Lab.findById(finalLabId);
      if (!adminLab) {
        return res.status(400).json({
          success: false,
          message: 'Your assigned lab was not found.'
        });
      }
    } else {
      // SUPER ADMIN FLOW

      if (!['super-admin', 'admin', 'technician'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role' });
      }

      if (role !== 'super-admin') {
        if (!labId) {
          return res.status(400).json({
            success: false,
            message: 'Lab ID is required for admin and technician roles'
          });
        }

        const lab = await Lab.findById(labId);
        if (!lab) {
          return res.status(400).json({ success: false, message: 'Lab not found' });
        }

        // Enforce: ONE LAB = ONE ADMIN
        if (role === 'admin') {
          const existingAdmin = await User.findOne({ role: 'admin', lab: labId });
          if (existingAdmin) {
            return res.status(400).json({
              success: false,
              message: 'This lab already has an assigned admin.'
            });
          }
        }
      }
    }

    const userData = {
      name,
      email,
      password,
      role: finalRole,
      lab: finalRole !== 'super-admin' ? finalLabId : undefined
    };
    
    const user = await User.create(userData);
    
    const createdUser = await User.findById(user._id).populate('lab', 'name');
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
    next(error);
  }
};

// @desc    Get all users (scoped to lab for admins)
// @route   GET /api/users
// @access  Private/Admin, Super Admin
exports.getUsers = async (req, res, next) => {
  try {
    let query = {};
    
    // Admin sees only their own lab's users; super-admin sees all
    if (req.user.role === 'admin') {
      query.lab = req.user.lab;
    } else if (req.query.lab) {
      query.lab = req.query.lab;
    }
    
    if (req.query.role) {
      query.role = req.query.role;
    }
    
    
    const users = await User.find(query).populate({
      path: 'lab',
      select: 'name subscription.status'
    });

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
// @access  Private/Admin, Super Admin
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate({
      path: 'lab',
      select: 'name subscription.status'
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Admin can only view users from their own lab
    if (req.user.role === 'admin' && user.lab && user.lab._id.toString() !== req.user.lab.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this user' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin, Super Admin
exports.updateUser = async (req, res, next) => {
  try {
    const existingUser = await User.findById(req.params.id);

    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Admin can only update users from their own lab
    if (req.user.role === 'admin') {
      if (!existingUser.lab || existingUser.lab.toString() !== req.user.lab.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to update this user' });
      }
      // Admin cannot change role
      delete req.body.role;
    }

    if (existingUser.lab && req.body.lab && existingUser.lab.toString() !== req.body.lab.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Lab assignment cannot be changed once set'
      });
    }

    if (req.body.labId && !req.body.lab) {
      req.body.lab = req.body.labId;
      delete req.body.labId;
    }

    const targetRole = req.body.role || existingUser.role;
    const targetLab = req.body.lab || existingUser.lab?.toString();
    
    if (targetRole === 'admin' && targetLab) {
      const existingAdmin = await User.findOne({
        role: 'admin',
        lab: targetLab,
        _id: { $ne: existingUser._id }
      });
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: 'This lab already has an assigned admin.'
        });
      }
    }

    if (req.body.password) {
      const userWithPassword = await User.findById(req.params.id).select('+password');
      userWithPassword.password = req.body.password;
      await userWithPassword.save();
      delete req.body.password;
    }

    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin, Super Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Admin can only delete users from their own lab
    if (req.user.role === 'admin') {
      if (!user.lab || user.lab.toString() !== req.user.lab.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete this user' });
      }
      // Admin cannot delete other admins or super-admins
      if (user.role !== 'technician') {
        return res.status(403).json({ success: false, message: 'Admins can only delete technicians' });
      }
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};
