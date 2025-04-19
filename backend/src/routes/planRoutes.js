const express = require('express');
const {
    createPlan,
    getAllPlans,
    getPlanById,
    updatePlan,
    deletePlan
} = require('../controllers/planController');
const { protect, authorize } = require('../middleware/auth'); // Assuming middleware is in ../middleware/auth

const router = express.Router();

// Apply protect middleware to all routes in this file
// Apply authorize middleware to ensure only 'super-admin' can access these routes
router.use(protect);
router.use(authorize('super-admin')); // Restrict all plan operations to super-admin

// Route definitions
router.route('/')
    .post(createPlan) // POST /api/v1/plans
    .get(getAllPlans); // GET /api/v1/plans

router.route('/:id')
    .get(getPlanById)    // GET /api/v1/plans/:id
    .put(updatePlan)     // PUT /api/v1/plans/:id
    .delete(deletePlan); // DELETE /api/v1/plans/:id

module.exports = router;
