const Lab = require('../models/Lab');

/**
 * Middleware to check subscription status for lab users.
 * Blocks create patient/report operations if no active subscription.
 */
exports.checkSubscription = async (req, res, next) => {
  try {
    // Skip for super-admin
    if (req.user.role === 'super-admin') {
      return next();
    }

    const labId = req.user.lab;
    if (!labId) {
      return res.status(403).json({
        success: false,
        message: 'No lab assigned',
        code: 'NO_LAB'
      });
    }

    const lab = await Lab.findById(labId)
      .select('subscriptionStatus subscriptionExpiry subscriptionPlan name status')
      .populate('subscriptionPlan', 'name maxPatients maxReports');

    if (!lab) {
      return res.status(403).json({
        success: false,
        message: 'Lab not found',
        code: 'LAB_NOT_FOUND'
      });
    }

    // Check if subscription is active and not expired
    const now = new Date();
    const isActive = lab.subscriptionStatus === 'active' || lab.subscriptionStatus === 'trial';
    const isExpired = lab.subscriptionExpiry && new Date(lab.subscriptionExpiry) < now;

    if (!isActive || isExpired) {
      // If previously active but now expired, update the status
      if (isActive && isExpired) {
        lab.subscriptionStatus = 'expired';
        await lab.save();
      }

      return res.status(403).json({
        success: false,
        code: 'SUBSCRIPTION_REQUIRED',
        message: 'Your lab does not have an active subscription. Please purchase a subscription plan to continue.',
        labName: lab.name,
        subscriptionStatus: lab.subscriptionStatus,
      });
    }

    // Attach subscription info to request for controllers
    req.labSubscription = {
      status: lab.subscriptionStatus,
      expiry: lab.subscriptionExpiry,
      plan: lab.subscriptionPlan,
    };

    // Check max limits if plan is populated
    if (lab.subscriptionPlan) {
      req.labSubscription.maxPatients = lab.subscriptionPlan.maxPatients;
      req.labSubscription.maxReports = lab.subscriptionPlan.maxReports;
      req.labSubscription.planName = lab.subscriptionPlan.name;
    }

    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking subscription',
      code: 'SUBSCRIPTION_CHECK_ERROR'
    });
  }
};

/**
 * Middleware specifically for create patient and create report operations.
 * Stricter check that blocks creation without active subscription.
 */
exports.checkSubscriptionForCreate = async (req, res, next) => {
  try {
    // Skip for super-admin
    if (req.user.role === 'super-admin') {
      return next();
    }

    const labId = req.user.lab;
    if (!labId) {
      return res.status(403).json({
        success: false,
        message: 'No lab assigned',
        code: 'NO_LAB'
      });
    }

    const lab = await Lab.findById(labId)
      .select('subscriptionStatus subscriptionExpiry subscriptionPlan totalPatientsCreated totalReportsCreated name')
      .populate('subscriptionPlan', 'name maxPatients maxReports');

    if (!lab) {
      return res.status(403).json({
        success: false,
        message: 'Lab not found',
        code: 'LAB_NOT_FOUND'
      });
    }

    const now = new Date();

    // Check if subscription is active/trial and not expired
    const isActiveStatus = lab.subscriptionStatus === 'active' || lab.subscriptionStatus === 'trial';
    const isExpired = lab.subscriptionExpiry && new Date(lab.subscriptionExpiry) < now;

    // Auto-expire if past expiry
    if (isActiveStatus && isExpired) {
      lab.subscriptionStatus = 'expired';
      await lab.save();
    }

    const subscriptionActive = isActiveStatus && !isExpired;

    if (!subscriptionActive) {
      return res.status(403).json({
        success: false,
        code: 'SUBSCRIPTION_REQUIRED',
        message: 'Subscription Required',
        subtitle: 'Your lab does not have an active subscription. Please purchase a subscription plan to continue creating patients and reports.',
        subscriptionStatus: lab.subscriptionStatus,
      });
    }

    // Check max patient limit if plan has a limit
    if (lab.subscriptionPlan && lab.subscriptionPlan.maxPatients != null) {
      if (lab.totalPatientsCreated >= lab.subscriptionPlan.maxPatients) {
        return res.status(403).json({
          success: false,
          code: 'MAX_PATIENTS_REACHED',
          message: 'Maximum Patients Limit Reached',
          subtitle: `Your plan (${lab.subscriptionPlan.name}) allows up to ${lab.subscriptionPlan.maxPatients} patients. Please upgrade your plan to add more patients.`,
        });
      }
    }

    // Check max report limit if plan has a limit
    if (lab.subscriptionPlan && lab.subscriptionPlan.maxReports != null) {
      if (lab.totalReportsCreated >= lab.subscriptionPlan.maxReports) {
        return res.status(403).json({
          success: false,
          code: 'MAX_REPORTS_REACHED',
          message: 'Maximum Reports Limit Reached',
          subtitle: `Your plan (${lab.subscriptionPlan.name}) allows up to ${lab.subscriptionPlan.maxReports} reports. Please upgrade your plan to add more reports.`,
        });
      }
    }

    req.labSubscription = {
      status: lab.subscriptionStatus,
      expiry: lab.subscriptionExpiry,
      plan: lab.subscriptionPlan,
    };

    next();
  } catch (error) {
    console.error('Subscription create check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking subscription',
      code: 'SUBSCRIPTION_CHECK_ERROR'
    });
  }
};