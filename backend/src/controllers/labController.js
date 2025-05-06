const Lab = require('../models/Lab');
const User = require('../models/User');
const Report = require('../models/Report');
const Plan = require('../models/Plan'); // Import Plan model
const SubscriptionHistory = require('../models/SubscriptionHistory'); // Import SubscriptionHistory model
const mongoose = require('mongoose'); // Needed for ObjectId validation

// @desc    Create new lab
// @route   POST /api/super-admin/labs
// @access  Private/Super Admin
exports.createLab = async (req, res, next) => {
  try {
    // Add user as lab creator
    req.body.createdBy = req.user.id;

    // Set lab status to active by default
    req.body.status = 'active';

    // Check for duplicate lab name
    const existingLab = await Lab.findOne({ name: req.body.name });
    if (existingLab) {
      return res.status(400).json({
        success: false,
        message: 'A lab with this name already exists. Please choose a different name.'
      });
    }

    const lab = await Lab.create(req.body);

    res.status(201).json({
      success: true,
      data: lab
    });
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    // Handle duplicate key error (unique constraint)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Lab name must be unique. A lab with this name already exists.'
      });
    }
    next(error);
  }
};

// @desc    Get all labs
// @route   GET /api/super-admin/labs
// @access  Private/Super Admin
exports.getLabs = async (req, res, next) => {
  try {
    const labs = await Lab.find()
      .populate({
        path: 'createdBy',
        select: 'name email'
      })
      .populate({
        path: 'users',
        select: 'name email role'
      })
      .populate({ // Add population for the plan within the subscription
        path: 'subscription.plan',
        select: 'name' // Select only the name field of the plan
      });

    res.status(200).json({
      success: true,
      count: labs.length,
      data: labs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single lab
// @route   GET /api/super-admin/labs/:id
// @access  Private/Super Admin/Admin
exports.getLab = async (req, res, next) => {
  try {
    const lab = await Lab.findById(req.params.id)
      .populate({
        path: 'createdBy',
        select: 'name email'
      })
      .populate({
        path: 'users',
        select: 'name email role'
      });

    if (!lab) {
      return res.status(404).json({
        success: false,
        message: 'Lab not found'
      });
    }

    // Check if user has access to this lab
    if (req.user.role !== 'super-admin' && req.user.lab.toString() !== lab._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this lab'
      });
    }

    res.status(200).json({
      success: true,
      data: lab
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update lab
// @route   PUT /api/super-admin/labs/:id
// @access  Private/Super Admin/Admin
exports.updateLab = async (req, res, next) => {
  try {
    let lab = await Lab.findById(req.params.id);

    if (!lab) {
      return res.status(404).json({
        success: false,
        message: 'Lab not found'
      });
    }

    // Check if user has access to update this lab
    if (req.user.role !== 'super-admin' && req.user.lab.toString() !== lab._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this lab'
      });
    }

    // Prevent admin from updating certain fields
    if (req.user.role === 'admin') {
      const restrictedFields = ['subscription', 'createdBy', 'stats'];
      restrictedFields.forEach(field => {
        delete req.body[field];
      });
    }

    lab = await Lab.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: lab
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete lab
// @route   DELETE /api/super-admin/labs/:id
// @access  Private/Super Admin
exports.deleteLab = async (req, res, next) => {
  try {
    const lab = await Lab.findById(req.params.id);

    if (!lab) {
      return res.status(404).json({
        success: false,
        message: 'Lab not found'
      });
    }

    // Delete all associated users
    await User.deleteMany({ lab: lab._id });

    // Delete all associated reports
    await Report.deleteMany({ lab: lab._id });

    // Delete the lab using findByIdAndDelete instead of deprecated remove()
    await Lab.findByIdAndDelete(lab._id);

    res.status(200).json({
      success: true,
      message: 'Lab deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get lab statistics
// @route   GET /api/super-admin/labs/:id/stats
// @access  Private/Super Admin/Admin
exports.getLabStats = async (req, res, next) => {
  try {
    const lab = await Lab.findById(req.params.id);

    if (!lab) {
      return res.status(404).json({
        success: false,
        message: 'Lab not found'
      });
    }

    // Check if user has access to this lab
    if (req.user.role !== 'super-admin' && req.user.lab.toString() !== lab._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this lab stats'
      });
    }

    // Get total users count
    const totalUsers = await User.countDocuments({ lab: lab._id });
    
    // Get total patients count
    const Patient = require('../models/Patient');
    console.log('Counting patients for lab ID:', lab._id);
    
    // Debug: Check if there are any patients in the system
    const allPatients = await Patient.find({});
    console.log('Total patients in system:', allPatients.length);
    console.log('Sample patient data:', allPatients.length > 0 ? allPatients[0] : 'No patients');
    
    // Count patients for this lab
    const totalPatients = await Patient.countDocuments({ labId: lab._id });
    console.log('Patients found for this lab:', totalPatients);
    
    // Get total reports count
    const totalReports = await Report.countDocuments({ lab: lab._id });

    // Get reports statistics by status
    const reportsStats = await Report.aggregate([
      { $match: { lab: lab._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get users statistics by role
    const usersStats = await User.aggregate([
      { $match: { lab: lab._id } },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get monthly report trends
    const monthlyReports = await Report.aggregate([
      { $match: { lab: lab._id } },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    // Format the response with summary counts at the top level
    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalPatients,
        totalReports,
        reportsStats,
        usersStats,
        monthlyReports
      }
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Assign a subscription plan to a lab
// @route   POST /api/v1/labs/:id/assign-plan
// @access  Private (Super Admin)
exports.assignPlanToLab = async (req, res, next) => {
    const { planId } = req.body; // Expecting planId in the request body
    const labId = req.params.id;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(labId)) {
        return res.status(400).json({ success: false, message: 'Invalid Lab ID format' });
    }
    if (!mongoose.Types.ObjectId.isValid(planId)) {
        return res.status(400).json({ success: false, message: 'Invalid Plan ID format' });
    }

    try {
        const lab = await Lab.findById(labId);
        if (!lab) {
            return res.status(404).json({ success: false, message: 'Lab not found' });
        }

        const plan = await Plan.findById(planId);
        if (!plan) {
            return res.status(404).json({ success: false, message: 'Plan not found' });
        }
        if (!plan.isActive) {
             return res.status(400).json({ success: false, message: 'Cannot assign an inactive plan.' });
        }

        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + plan.duration); // Calculate end date based on plan duration

        // Update Lab's subscription details and status
        lab.subscription.plan = plan._id;
        lab.subscription.startDate = startDate;
        lab.subscription.endDate = endDate;
        lab.status = 'active'; // Activate the lab upon plan assignment

        // Create Subscription History record
        // Consider wrapping lab.save() and history creation in a transaction for atomicity if needed
        await SubscriptionHistory.create({
            lab: lab._id,
            plan: plan._id,
            startDate: startDate,
            endDate: endDate,
            status: 'active', // Initial status
            createdBy: req.user._id, // Log who assigned the plan
            paymentDetails: { // Optional: Add payment details if applicable from req.body
                amount: plan.price,
                currency: 'USD', // Or get from config/plan
                paymentDate: new Date(),
                paymentMethod: 'manual_assignment' // Indicate it was assigned by admin
            }
        });

        // Save the updated lab document
        const updatedLab = await lab.save();

        res.status(200).json({
            success: true,
            message: `Plan '${plan.name}' assigned successfully to lab '${lab.name}'. Subscription active until ${endDate.toLocaleDateString()}.`,
            data: updatedLab
        });

    } catch (error) {
        console.error(`Error assigning plan ${planId} to lab ${labId}:`, error);
        // Handle potential CastError if ID format is invalid (already handled above but good practice)
        if (error.name === 'CastError') {
             return res.status(400).json({ success: false, message: 'Invalid ID format provided' });
        }
        next(error); // Pass other errors to the global error handler
    }
};

// @desc    Get subscription history for a specific lab
// @route   GET /api/v1/labs/:id/subscription-history
// @access  Private (Super Admin, Admin of the lab)
exports.getSubscriptionHistoryForLab = async (req, res, next) => {
    const labId = req.params.id;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(labId)) {
        return res.status(400).json({ success: false, message: 'Invalid Lab ID format' });
    }

    try {
        // Verify lab exists (optional, but good practice)
        const labExists = await Lab.exists({ _id: labId });
        if (!labExists) {
            return res.status(404).json({ success: false, message: 'Lab not found' });
        }

        // Authorization check: Ensure user is Super Admin or Admin of this specific lab
        // The checkLabAccess middleware should already handle this if applied correctly in routes
        // if (req.user.role !== 'super-admin' && req.user.lab.toString() !== labId) {
        //     return res.status(403).json({ success: false, message: 'Not authorized to view this lab\'s subscription history' });
        // }

        const history = await SubscriptionHistory.find({ lab: labId })
            .populate({ path: 'plan', select: 'name price duration' }) // Populate plan details
            .populate({ path: 'createdBy', select: 'name email' }) // Populate who created the record
            .sort({ startDate: -1 }); // Sort by most recent start date

        res.status(200).json({
            success: true,
            count: history.length,
            data: history
        });

    } catch (error) {
        console.error(`Error fetching subscription history for lab ${labId}:`, error);
        next(error);
    }
};
