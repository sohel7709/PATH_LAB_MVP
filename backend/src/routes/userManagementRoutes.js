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

// Super Admin routes
router.route('/')
  .post(authorize('super-admin'), createUser) // Create a new user
  .get(authorize('super-admin'), getUsers); // Get all users

router.route('/:id')
  .get(authorize('super-admin'), getUser) // Get a specific user
  .put(authorize('super-admin'), updateUser) // Update a specific user
  .delete(authorize('super-admin'), deleteUser); // Delete a specific user

module.exports = router;
