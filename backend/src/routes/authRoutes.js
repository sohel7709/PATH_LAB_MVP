const express = require('express');
const cors = require('cors');
const router = express.Router();
const { protect, verifyToken } = require('../middleware/auth');

const corsOptions = {
  origin: '*',
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

const {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  logout,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');

// Public routes
// In your authRoutes.js
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Protected routes
router.use(protect); // All routes below this will be protected
router.get('/me', getMe);
router.get('/verify', verifyToken);


router.put('/updatedetails', updateDetails);
router.put('/updatepassword', updatePassword);
router.get('/logout', logout);

module.exports = router;
