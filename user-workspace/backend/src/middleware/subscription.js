const Lab = require('../models/Lab');

/**
 * Middleware to check subscription status for lab users.
 * If expired: send 403 with code 'expired'
 * If trial: attach trialDaysLeft in req and continue
 * If active: continue
 */
exports.checkSubscription = async (req, res, next) => {
  try {
    // Only apply for non-super-admin users
    if (req.user.role === 'super-admin') {
      return next();
    }
    const labId = req.user.lab;
    if (!labId) {
      return res.status(403).json({ success: false, message: 'No lab assigned' });
    }
    const lab = await Lab.findById(labId).select('subscription');
    if (!lab || !lab.subscription || !lab.subscription.plan) {
      return res.status(403).json({ success: false, message: 'No active subscription found' });
    }
    const now = new Date();
    const { startDate, endDate } = lab.subscription;
    if (endDate && endDate < now) {
      // Subscription expired
      return res.status(403).json({ success: false, code: 'expired', message: 'Subscription expired' });
    }
    // Check trial
    // Assuming trial plan name includes 'trial'
    if (lab.subscription.plan && lab.subscription.plan.toString()) {
      const trialDaysLeft = Math.ceil((new Date(endDate) - now) / (1000 * 60 * 60 * 24));
      // Attach trialDaysLeft
      if (trialDaysLeft > 0 && lab.subscription.plan) {
        req.trialDaysLeft = trialDaysLeft;
      }
    }
    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    res.status(500).json({ success: false, message: 'Error checking subscription' });
  }
};
