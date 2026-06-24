const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { protect, authorize } = require('../middleware/auth');

const {
  submitFeedback,
  getMyFeedback,
  getFeedbackById,
  getAllFeedback,
  updateFeedbackStatus,
  addInternalNote,
} = require('../controllers/feedbackController');

// Multer setup for feedback image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, '../../uploads/feedback');
    const fs = require('fs');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `feedback-${Date.now()}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PNG, JPG, JPEG, and WEBP images are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
});

// ===== SUPER ADMIN ROUTES (must be before generic :id) =====
// Get ALL feedback from all labs
router.get(
  '/super-admin/all',
  protect,
  authorize('super-admin'),
  getAllFeedback
);

// Update feedback status
router.put(
  '/super-admin/:id/status',
  protect,
  authorize('super-admin'),
  updateFeedbackStatus
);

// Add internal notes
router.put(
  '/super-admin/:id/notes',
  protect,
  authorize('super-admin'),
  addInternalNote
);

// ===== ADMIN ROUTES =====
// Submit feedback with optional images
router.post(
  '/',
  protect,
  authorize('admin'),
  upload.array('images', 5),
  submitFeedback
);

// Get feedback for current admin's lab
router.get('/', protect, authorize('admin', 'super-admin'), getMyFeedback);

// Get single feedback (must be LAST due to :id param)
router.get('/:id', protect, authorize('admin', 'super-admin'), getFeedbackById);

module.exports = router;