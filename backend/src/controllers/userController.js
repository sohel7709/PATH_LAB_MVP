const User = require('../models/User');
const Lab = require('../models/Lab');
const { createAuditLog } = require('../services/auditService');

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

    // Audit Log
    const roleLabel = finalRole.charAt(0).toUpperCase() + finalRole.slice(1).replace('-', ' ');
    const labName = createdUser.lab?.name || '';
    createAuditLog({
      user: req.user._id,
      role: req.user.role,
      module: 'USERS',
      action: 'CREATE',
      entityId: user._id,
      entityType: 'User',
      description: `${req.user.name} created ${roleLabel} ${name}${labName ? ` for ${labName}` : ''}`,
      newData: { name, email, role: finalRole, labName },
      req,
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

    const oldData = {
      name: existingUser.name,
      email: existingUser.email,
      role: existingUser.role,
    };

    if (req.user.role === 'admin') {
      if (!existingUser.lab || existingUser.lab.toString() !== req.user.lab.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to update this user' });
      }
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
    }).populate('lab', 'name');

    // Audit Log
    let action = 'UPDATE';
    let description = `${req.user.name} updated user ${user.name}`;

    // Check if role changed
    if (req.body.role && req.body.role !== oldData.role) {
      action = 'ROLE_CHANGE';
      const oldRoleLabel = oldData.role.charAt(0).toUpperCase() + oldData.role.slice(1).replace('-', ' ');
      const newRoleLabel = req.body.role.charAt(0).toUpperCase() + req.body.role.slice(1).replace('-', ' ');
      description = `${req.user.name} changed user role: ${oldRoleLabel} → ${newRoleLabel} for ${user.name}`;
    }

    createAuditLog({
      user: req.user._id,
      role: req.user.role,
      module: 'USERS',
      action,
      entityId: user._id,
      entityType: 'User',
      description,
      oldData: action === 'ROLE_CHANGE' ? { role: oldData.role } : oldData,
      newData: { name: user.name, email: user.email, role: user.role },
      req,
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
    const user = await User.findById(req.params.id).populate('lab', 'name');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (req.user.role === 'admin') {
      if (!user.lab || user.lab.toString() !== req.user.lab.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete this user' });
      }
      if (user.role !== 'technician') {
        return res.status(403).json({ success: false, message: 'Admins can only delete technicians' });
      }
    }

    // Store data for audit before deletion
    const userData = {
      name: user.name,
      email: user.email,
      role: user.role,
      labName: user.lab?.name || '',
    };

    await User.findByIdAndDelete(req.params.id);

    // Audit Log
    const roleLabel = userData.role.charAt(0).toUpperCase() + userData.role.slice(1).replace('-', ' ');
    createAuditLog({
      user: req.user._id,
      role: req.user.role,
      module: 'USERS',
      action: 'DELETE',
      entityId: req.params.id,
      entityType: 'User',
      description: `${req.user.name} deleted ${roleLabel} ${userData.name}`,
      oldData: userData,
      req,
    });

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};