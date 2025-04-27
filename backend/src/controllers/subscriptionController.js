const Razorpay = require('razorpay');
const crypto = require('crypto');
const Plan = require('../models/Plan');
const Lab = require('../models/Lab');
const SubscriptionHistory = require('../models/SubscriptionHistory');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * @desc    Create Razorpay order for subscription purchase
 * @route   POST /api/v1/subscriptions/create-order
 * @access  Protected (lab user)
 */
const createOrder = async (req, res) => {
  const { planId } = req.body;
  const user = req.user;
  const labId = user.lab;

  if (!planId) {
    return res.status(400).json({ success: false, message: 'Plan ID is required' });
  }
  try {
    const plan = await Plan.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(404).json({ success: false, message: 'Invalid or inactive plan' });
    }

    const amountInPaise = Math.round(plan.price * 100); // Convert INR to paise

    // Create order
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_sub_${labId}_${Date.now()}`,
      notes: {
        planId: planId,
        labId: labId.toString(),
      },
    };
    const order = await razorpay.orders.create(options);

    res.status(201).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        plan,
      }
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ success: false, message: 'Could not create order', error: error.message });
  }
};

/**
 * @desc    Verify Razorpay payment and activate subscription
 * @route   POST /api/v1/subscriptions/verify
 * @access  Protected (lab user)
 */
const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const user = req.user;
  const labId = user.lab;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Payment details incomplete' });
  }

  // Verify signature
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generatedSignature !== razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Payment signature verification failed' });
  }

  try {
    // Fetch order to get notes
    const order = await razorpay.orders.fetch(razorpay_order_id);
    const planId = order.notes.planId;
    const startDate = new Date();
    const plan = await Plan.findById(planId);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.duration);

    // Update lab subscription
    const updatedLab = await Lab.findByIdAndUpdate(
      labId,
      { subscription: { plan: planId, startDate, endDate } },
      { new: true }
    );

    // Create subscription history record
    await SubscriptionHistory.create({
      lab: labId,
      plan: planId,
      startDate,
      endDate,
      status: 'active',
      paymentDetails: {
        transactionId: razorpay_payment_id,
        amount: order.amount / 100,
        currency: order.currency,
        paymentDate: new Date(),
        paymentMethod: 'razorpay',
      },
      createdBy: user._id,
      modifiedBy: user._id,
      reason: 'Payment via Razorpay',
      modificationType: 'purchase',
    });

    res.json({ success: true, message: 'Payment verified, subscription activated', data: updatedLab });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, message: 'Verification failed', error: error.message });
  }
};

/**
 * @desc    Start trial subscription for current lab
 * @route   POST /api/v1/subscriptions/trial
 * @access  Protected (lab user)
 */
const startTrial = async (req, res) => {
  const user = req.user;
  const labId = user.lab;
  try {
    // Find active trial plan
    const trialPlan = await Plan.findOne({ name: /trial/i, isActive: true });
    if (!trialPlan) {
      return res.status(404).json({ success: false, message: 'Trial plan not available' });
    }
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + trialPlan.duration);

    // Update lab subscription
    const updatedLab = await Lab.findByIdAndUpdate(
      labId,
      { subscription: { plan: trialPlan._id, startDate, endDate } },
      { new: true }
    );

    // Log history
    await SubscriptionHistory.create({
      lab: labId,
      plan: trialPlan._id,
      startDate,
      endDate,
      status: 'active',
      createdBy: user._id,
      modifiedBy: user._id,
      reason: 'Trial started',
      modificationType: 'trial',
    });

    res.json({ success: true, message: 'Trial started', data: updatedLab });
  } catch (error) {
    console.error('Error starting trial:', error);
    res.status(500).json({ success: false, message: 'Could not start trial', error: error.message });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  startTrial,
};
