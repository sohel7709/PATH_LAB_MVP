const Plan = require('../models/Plan');
const Lab = require('../models/Lab'); // Needed for checks when deleting/updating plans

// @desc    Create a new subscription plan
// @route   POST /api/v1/plans
// @access  Private (Super Admin)
exports.createPlan = async (req, res) => {
    try {
        // Add validation if needed (e.g., ensure unique name is handled gracefully)
        const newPlan = await Plan.create(req.body);
        res.status(201).json({ success: true, data: newPlan });
    } catch (error) {
        console.error('Error creating plan:', error);
        // Handle potential duplicate key error for unique name
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Plan name already exists.' });
        }
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get all subscription plans
// @route   GET /api/v1/plans
// @access  Private (Super Admin, potentially Admin)
exports.getAllPlans = async (req, res) => {
    try {
        // Add filtering/sorting/pagination if needed
        const plans = await Plan.find().sort('name'); // Sort by name for consistency
        res.status(200).json({ success: true, count: plans.length, data: plans });
    } catch (error) {
        console.error('Error getting plans:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get a single subscription plan by ID
// @route   GET /api/v1/plans/:id
// @access  Private (Super Admin, potentially Admin)
exports.getPlanById = async (req, res) => {
    try {
        const plan = await Plan.findById(req.params.id);
        if (!plan) {
            return res.status(404).json({ success: false, message: 'Plan not found' });
        }
        res.status(200).json({ success: true, data: plan });
    } catch (error) {
        console.error(`Error getting plan ${req.params.id}:`, error);
        // Handle potential CastError if ID format is invalid
        if (error.name === 'CastError') {
             return res.status(400).json({ success: false, message: 'Invalid Plan ID format' });
        }
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Update a subscription plan
// @route   PUT /api/v1/plans/:id
// @access  Private (Super Admin)
exports.updatePlan = async (req, res) => {
    try {
        let plan = await Plan.findById(req.params.id);
        if (!plan) {
            return res.status(404).json({ success: false, message: 'Plan not found' });
        }

        // Prevent changing certain fields if plan is in use? (Optional complexity)
        // e.g., if (await Lab.exists({ 'subscription.plan': req.params.id })) { ... }

        plan = await Plan.findByIdAndUpdate(req.params.id, req.body, {
            new: true, // Return the updated document
            runValidators: true, // Run schema validators on update
        });

        res.status(200).json({ success: true, data: plan });
    } catch (error) {
        console.error(`Error updating plan ${req.params.id}:`, error);
         // Handle potential duplicate key error for unique name on update
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Plan name already exists.' });
        }
        // Handle potential CastError if ID format is invalid
        if (error.name === 'CastError') {
             return res.status(400).json({ success: false, message: 'Invalid Plan ID format' });
        }
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Delete a subscription plan
// @route   DELETE /api/v1/plans/:id
// @access  Private (Super Admin)
exports.deletePlan = async (req, res) => {
    try {
        const plan = await Plan.findById(req.params.id);
        if (!plan) {
            return res.status(404).json({ success: false, message: 'Plan not found' });
        }

        // **Important Check:** Prevent deletion if the plan is currently assigned to any active lab
        // We check labs that have this plan assigned AND are not in a 'pending_approval' or 'inactive' state.
        const labsUsingPlan = await Lab.countDocuments({
            'subscription.plan': req.params.id,
            'status': { $in: ['active', 'suspended'] } // Check against relevant active/suspended statuses
         });

        if (labsUsingPlan > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete plan. It is currently assigned to ${labsUsingPlan} active or suspended lab(s). Consider deactivating the plan instead (setting isActive: false).`
            });
        }

        // Optional: Instead of deleting, mark as inactive
        // await Plan.findByIdAndUpdate(req.params.id, { isActive: false });
        // return res.status(200).json({ success: true, message: 'Plan deactivated successfully' });

        await plan.deleteOne(); // Use deleteOne()

        res.status(200).json({ success: true, message: 'Plan deleted successfully', data: {} }); // Return empty data on delete
    } catch (error) {
        console.error(`Error deleting plan ${req.params.id}:`, error);
        // Handle potential CastError if ID format is invalid
        if (error.name === 'CastError') {
             return res.status(400).json({ success: false, message: 'Invalid Plan ID format' });
        }
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
