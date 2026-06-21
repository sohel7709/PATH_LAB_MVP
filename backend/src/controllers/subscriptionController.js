const Plan = require('../models/Plan');
const Lab = require('../models/Lab');
const Subscription = require('../models/Subscription');
const SubscriptionHistory = require('../models/SubscriptionHistory');
const RevenueTransaction = require('../models/RevenueTransaction');
const User = require('../models/User');

/**
 * @desc    Get all subscription plans (for Admin viewing)
 * @route   GET /api/subscriptions/plans
 * @access  Protected (Admin, Technician)
 */
exports.getActivePlans = async (req, res) => {
  try {
    const plans = await Plan.find({ isActive: true }).sort('price');
    res.status(200).json({
      success: true,
      count: plans.length,
      data: plans
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching plans', error: error.message });
  }
};

/**
 * @desc    Request a subscription plan (Admin initiates purchase)
 * @route   POST /api/subscriptions/request
 * @access  Protected (Admin)
 */
exports.requestSubscription = async (req, res) => {
  try {
    const { planId, message } = req.body;
    const user = req.user;
    const labId = user.lab;

    if (!planId) {
      return res.status(400).json({ success: false, message: 'Plan ID is required' });
    }

    const plan = await Plan.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(404).json({ success: false, message: 'Plan not found or inactive' });
    }

    const lab = await Lab.findById(labId);
    if (!lab) {
      return res.status(404).json({ success: false, message: 'Lab not found' });
    }

    // Create a pending subscription record
    const subscription = await Subscription.create({
      lab: labId,
      plan: planId,
      startDate: new Date(),
      endDate: new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000),
      status: 'pending',
      paymentProvider: 'WhatsApp',
    });

    // Log in history
    await SubscriptionHistory.create({
      lab: labId,
      plan: planId,
      startDate: new Date(),
      endDate: new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000),
      status: 'pending_payment',
      createdBy: user._id,
      paymentDetails: {
        paymentMethod: 'WhatsApp',
      },
    });

    // Return data for WhatsApp redirect
    res.status(201).json({
      success: true,
      data: {
        subscription,
        plan,
        lab: {
          _id: lab._id,
          name: lab.name,
        },
        admin: {
          name: user.name,
          email: user.email,
        },
        // Super admin WhatsApp number - can be configured in env
        whatsappNumber: process.env.SUPER_ADMIN_WHATSAPP || '919XXXXXXXXX',
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error requesting subscription', error: error.message });
  }
};

/**
 * @desc    Get current lab's subscription status
 * @route   GET /api/subscriptions/current
 * @access  Protected (Admin, Technician)
 */
exports.getCurrentSubscription = async (req, res) => {
  try {
    const labId = req.user.lab;
    if (!labId) {
      return res.status(400).json({ success: false, message: 'No lab assigned' });
    }

    const lab = await Lab.findById(labId)
      .select('subscriptionStatus subscriptionExpiry subscriptionPlan name totalPatientsCreated totalReportsCreated')
      .populate('subscriptionPlan', 'name description price duration maxPatients maxReports isActive');

    if (!lab) {
      return res.status(404).json({ success: false, message: 'Lab not found' });
    }

    // Get active subscription from Subscription collection
    const activeSub = await Subscription.findOne({
      lab: labId,
      status: 'active',
    })
      .populate('plan', 'name description price duration')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        lab,
        activeSubscription: activeSub,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching subscription', error: error.message });
  }
};

/**
 * @desc    Get all lab subscriptions (Super Admin)
 * @route   GET /api/subscriptions/admin/all
 * @access  Private (Super Admin)
 */
exports.getAllLabSubscriptions = async (req, res) => {
  try {
    const labs = await Lab.find({})
      .select('name subscriptionStatus subscriptionExpiry subscriptionPlan status totalPatientsCreated totalReportsCreated')
      .populate('subscriptionPlan', 'name description price duration maxPatients maxReports')
      .populate({
        path: 'users',
        match: { role: 'admin' },
        select: 'name email phone',
        options: { limit: 1 }
      })
      .sort({ createdAt: -1 });

    // Format labs to include admin name
    const formattedLabs = labs.map(lab => {
      const labObj = lab.toObject();
      labObj.adminName = lab.users && lab.users.length > 0 ? lab.users[0].name : 'No Admin';
      labObj.adminEmail = lab.users && lab.users.length > 0 ? lab.users[0].email : '';
      labObj.adminPhone = lab.users && lab.users.length > 0 ? lab.users[0].phone : '';
      return labObj;
    });

    res.status(200).json({
      success: true,
      count: formattedLabs.length,
      data: formattedLabs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching subscriptions', error: error.message });
  }
};

/**
 * @desc    Activate subscription for a lab (Super Admin)
 * @route   POST /api/subscriptions/admin/activate
 * @access  Private (Super Admin)
 */
exports.activateSubscription = async (req, res) => {
  try {
    const { labId, planId, duration } = req.body;

    if (!labId || !planId) {
      return res.status(400).json({ success: false, message: 'Lab ID and Plan ID are required' });
    }

    const lab = await Lab.findById(labId);
    if (!lab) {
      return res.status(404).json({ success: false, message: 'Lab not found' });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    const days = duration || plan.duration;
    const startDate = new Date();
    const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    // Cancel any existing active subscriptions
    await Subscription.updateMany(
      { lab: labId, status: 'active' },
      {
        status: 'cancelled',
        cancelledBy: req.user._id,
        cancelledAt: new Date(),
        cancelReason: 'Plan changed or renewed'
      }
    );

    // Create new subscription
    const subscription = await Subscription.create({
      lab: labId,
      plan: planId,
      startDate,
      endDate,
      status: 'active',
      paymentProvider: 'WhatsApp',
      activatedBy: req.user._id,
    });

    // Update lab subscription fields
    lab.subscriptionStatus = 'active';
    lab.subscriptionExpiry = endDate;
    lab.subscriptionPlan = planId;
    lab.subscription = {
      plan: planId,
      startDate,
      endDate,
    };
    lab.status = 'active';
    await lab.save();

    // Log in history
    await SubscriptionHistory.create({
      lab: labId,
      plan: planId,
      startDate,
      endDate,
      status: 'active',
      createdBy: req.user._id,
      paymentDetails: {
        paymentMethod: 'WhatsApp',
      },
    });

    // Create revenue transaction
    const labAdmin = await User.findOne({ role: 'admin', lab: labId });
    await RevenueTransaction.create({
      lab: labId,
      admin: labAdmin?._id,
      subscriptionPlan: planId,
      subscription: subscription._id,
      amount: plan.price,
      activatedBy: req.user._id,
      activatedAt: startDate,
    });

    res.status(200).json({
      success: true,
      message: 'Subscription activated successfully',
      data: {
        subscription,
        lab: {
          _id: lab._id,
          name: lab.name,
          subscriptionStatus: lab.subscriptionStatus,
          subscriptionExpiry: lab.subscriptionExpiry,
        },
        plan: {
          _id: plan._id,
          name: plan.name,
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error activating subscription', error: error.message });
  }
};

/**
 * @desc    Cancel a lab's subscription (Super Admin)
 * @route   POST /api/subscriptions/admin/cancel
 * @access  Private (Super Admin)
 */
exports.cancelSubscription = async (req, res) => {
  try {
    const { labId, reason } = req.body;

    if (!labId) {
      return res.status(400).json({ success: false, message: 'Lab ID is required' });
    }

    const lab = await Lab.findById(labId);
    if (!lab) {
      return res.status(404).json({ success: false, message: 'Lab not found' });
    }

    // Cancel all active subscriptions for this lab
    await Subscription.updateMany(
      { lab: labId, status: 'active' },
      {
        status: 'cancelled',
        cancelledBy: req.user._id,
        cancelledAt: new Date(),
        cancelReason: reason || 'Cancelled by Super Admin'
      }
    );

    // Update lab
    lab.subscriptionStatus = 'cancelled';
    lab.subscriptionExpiry = new Date(); // Set to now
    // Keep subscriptionPlan reference for history
    await lab.save();

    // Log in history
    await SubscriptionHistory.create({
      lab: labId,
      plan: lab.subscriptionPlan,
      startDate: lab.subscription?.startDate || new Date(),
      endDate: new Date(),
      status: 'cancelled',
      createdBy: req.user._id,
      paymentDetails: {
        paymentMethod: 'Manual',
      },
    });

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: {
        lab: {
          _id: lab._id,
          name: lab.name,
          subscriptionStatus: lab.subscriptionStatus,
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error cancelling subscription', error: error.message });
  }
};

/**
 * @desc    Extend a lab's subscription (Super Admin)
 * @route   POST /api/subscriptions/admin/extend
 * @access  Private (Super Admin)
 */
exports.extendSubscription = async (req, res) => {
  try {
    const { labId, days, reason } = req.body;

    if (!labId || !days) {
      return res.status(400).json({ success: false, message: 'Lab ID and days are required' });
    }

    const lab = await Lab.findById(labId);
    if (!lab) {
      return res.status(404).json({ success: false, message: 'Lab not found' });
    }

    // Extend the expiry date
    const currentExpiry = lab.subscriptionExpiry || new Date();
    const newExpiry = new Date(currentExpiry.getTime() + days * 24 * 60 * 60 * 1000);

    lab.subscriptionExpiry = newExpiry;
    if (lab.subscription) {
      lab.subscription.endDate = newExpiry;
    }
    lab.subscriptionStatus = 'active';
    await lab.save();

    // Update active subscription in Subscription collection
    const activeSub = await Subscription.findOne({ lab: labId, status: 'active' });
    if (activeSub) {
      activeSub.endDate = newExpiry;
      await activeSub.save();
    } else if (lab.subscriptionPlan) {
      // Create a new subscription if none active
      await Subscription.create({
        lab: labId,
        plan: lab.subscriptionPlan,
        startDate: new Date(),
        endDate: newExpiry,
        status: 'active',
        paymentProvider: 'WhatsApp',
        activatedBy: req.user._id,
      });
    }

    // Log in history
    await SubscriptionHistory.create({
      lab: labId,
      plan: lab.subscriptionPlan,
      startDate: new Date(),
      endDate: newExpiry,
      status: 'active',
      createdBy: req.user._id,
      paymentDetails: {
        paymentMethod: 'Manual',
      },
    });

    res.status(200).json({
      success: true,
      message: `Subscription extended by ${days} days`,
      data: {
        lab: {
          _id: lab._id,
          name: lab.name,
          subscriptionExpiry: newExpiry,
          subscriptionStatus: 'active',
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error extending subscription', error: error.message });
  }
};

/**
 * @desc    Change a lab's plan (Super Admin)
 * @route   POST /api/subscriptions/admin/change-plan
 * @access  Private (Super Admin)
 */
exports.changePlan = async (req, res) => {
  try {
    const { labId, planId, reason } = req.body;

    if (!labId || !planId) {
      return res.status(400).json({ success: false, message: 'Lab ID and Plan ID are required' });
    }

    const lab = await Lab.findById(labId);
    if (!lab) {
      return res.status(404).json({ success: false, message: 'Lab not found' });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    // Cancel existing active subscriptions
    await Subscription.updateMany(
      { lab: labId, status: 'active' },
      {
        status: 'cancelled',
        cancelledBy: req.user._id,
        cancelledAt: new Date(),
        cancelReason: reason || 'Plan changed'
      }
    );

    // Create new subscription with new plan
    const startDate = new Date();
    const endDate = new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000);

    const subscription = await Subscription.create({
      lab: labId,
      plan: planId,
      startDate,
      endDate,
      status: 'active',
      paymentProvider: 'WhatsApp',
      activatedBy: req.user._id,
    });

    // Update lab
    lab.subscriptionPlan = planId;
    lab.subscriptionStatus = 'active';
    lab.subscriptionExpiry = endDate;
    lab.subscription = {
      plan: planId,
      startDate,
      endDate,
    };
    lab.status = 'active';
    await lab.save();

    // Log in history
    await SubscriptionHistory.create({
      lab: labId,
      plan: planId,
      startDate,
      endDate,
      status: 'active',
      createdBy: req.user._id,
      paymentDetails: {
        paymentMethod: 'Manual',
      },
    });

    // Create revenue transaction for plan change
    const labAdmin = await User.findOne({ role: 'admin', lab: labId });
    await RevenueTransaction.create({
      lab: labId,
      admin: labAdmin?._id,
      subscriptionPlan: planId,
      subscription: subscription._id,
      amount: plan.price,
      activatedBy: req.user._id,
      activatedAt: startDate,
    });

    res.status(200).json({
      success: true,
      message: `Plan changed to ${plan.name}`,
      data: {
        subscription,
        plan: {
          _id: plan._id,
          name: plan.name,
        },
        lab: {
          _id: lab._id,
          name: lab.name,
          subscriptionStatus: lab.subscriptionStatus,
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error changing plan', error: error.message });
  }
};

/**
 * @desc    Get subscription history for a lab (Super Admin)
 * @route   GET /api/subscriptions/admin/history/:labId
 * @access  Private (Super Admin)
 */
exports.getSubscriptionHistory = async (req, res) => {
  try {
    const { labId } = req.params;

    const history = await SubscriptionHistory.find({ lab: labId })
      .populate('plan', 'name price duration')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching history', error: error.message });
  }
};

/**
 * @desc    Check subscription status (lightweight endpoint for frontend)
 * @route   GET /api/subscriptions/status
 * @access  Protected
 */
exports.checkSubscriptionStatus = async (req, res) => {
  try {
    if (req.user.role === 'super-admin') {
      return res.status(200).json({
        success: true,
        data: {
          isActive: true,
          status: 'active',
          planName: 'Unlimited',
        }
      });
    }

    const labId = req.user.lab;
    if (!labId) {
      return res.status(200).json({
        success: true,
        data: {
          isActive: false,
          status: 'no_lab',
          planName: 'None',
        }
      });
    }

    const lab = await Lab.findById(labId)
      .select('subscriptionStatus subscriptionExpiry subscriptionPlan name')
      .populate('subscriptionPlan', 'name');

    if (!lab) {
      return res.status(200).json({
        success: true,
        data: {
          isActive: false,
          status: 'lab_not_found',
          planName: 'None',
        }
      });
    }

    const isActive = lab.subscriptionStatus === 'active' || lab.subscriptionStatus === 'trial';
    const isExpired = lab.subscriptionExpiry && new Date(lab.subscriptionExpiry) < new Date();

    res.status(200).json({
      success: true,
      data: {
        isActive: isActive && !isExpired,
        status: isExpired ? 'expired' : lab.subscriptionStatus,
        planName: lab.subscriptionPlan?.name || 'None',
        expiryDate: lab.subscriptionExpiry,
        labName: lab.name,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error checking status', error: error.message });
  }
};
