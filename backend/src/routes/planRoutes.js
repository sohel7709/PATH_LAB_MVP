const express = require('express');
const {
    createPlan,
    getAllPlans,
    getPlanById,
    updatePlan,
    deletePlan
} = require('../controllers/planController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

// GET routes - accessible by all authenticated users (admin/technician need to view plans)
router.route('/')
    .get(getAllPlans); // GET /api/plans - all authenticated users can view

router.route('/:id')
    .get(getPlanById); // GET /api/plans/:id

// POST/PUT/DELETE routes - super-admin only
router.route('/')
    .post(authorize('super-admin'), createPlan); // POST /api/plans

router.route('/:id')
    .put(authorize('super-admin'), updatePlan)     // PUT /api/plans/:id
    .delete(authorize('super-admin'), deletePlan); // DELETE /api/plans/:id

module.exports = router;