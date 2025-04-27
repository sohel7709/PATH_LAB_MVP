const express = require('express');
const router = express.Router();
const { getIntelligenceData } = require('../controllers/superAdminController');
const authMiddleware = require('../middleware/auth');

// Protect route with auth and super-admin role check middleware
router.get('/intelligence', authMiddleware.protect, async (req, res, next) => {
  try {
    // Check if user is super-admin
    if (req.user?.role !== 'super-admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    await getIntelligenceData(req, res);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
