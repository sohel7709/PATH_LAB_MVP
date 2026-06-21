const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { protect, verifyToken } = require('../middleware/auth');

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

// Forgot-password: max 3 requests per 15 min per IP (stops email bombing)
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'Too many password reset requests. Try again in 15 minutes.' },
});

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Protected routes
router.use(protect); // All routes below this will be protected
router.get('/me', getMe);
router.get('/verify', verifyToken);


router.put('/updatedetails', updateDetails);
router.put('/updatepassword', updatePassword);
router.get('/logout', logout);

module.exports = router;
