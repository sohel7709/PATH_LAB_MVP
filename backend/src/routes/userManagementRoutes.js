const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');

// All routes require authentication
router.use(protect);

// Admin and Super Admin can access (admin restricted to their own lab in controller)
router.route('/')
  .post(authorize('admin', 'super-admin'), createUser)
  .get(authorize('admin', 'super-admin'), getUsers);

router.route('/:id')
  .get(authorize('admin', 'super-admin'), getUser)
  .put(authorize('admin', 'super-admin'), updateUser)
  .delete(authorize('admin', 'super-admin'), deleteUser);

module.exports = router;