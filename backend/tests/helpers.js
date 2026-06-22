const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Lab = require('../src/models/Lab');

// Reusable placeholder ObjectId for createdBy when no real user exists yet
const PLACEHOLDER_ID = new mongoose.Types.ObjectId();

/**
 * Create a lab in the DB and return it.
 */
async function createLab(overrides = {}) {
  return Lab.create({
    name: overrides.name || `Test Lab ${Date.now()}`,
    status: 'active',
    contact: { email: 'lab@test.com', phone: '1234567890' },
    createdBy: PLACEHOLDER_ID,
    ...overrides,
  });
}

/**
 * Create a user + lab (if needed) and return { user, token, lab }.
 */
async function createUser(overrides = {}) {
  const needsLab = overrides.role !== 'super-admin';
  let lab = overrides.lab || undefined;

  if (needsLab && !lab) {
    // Create a placeholder lab; we'll update createdBy after user creation
    lab = await createLab();
  }

  const user = await User.create({
    name: 'Test User',
    email: `user_${Date.now()}_${Math.random().toString(36).slice(2)}@test.com`,
    password: 'Password123',
    role: 'admin',
    ...overrides,
    ...(lab ? { lab: lab._id } : {}),
  });

  const token = jwt.sign(
    { id: user._id, role: user.role, lab: user.lab },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
  return { user, token, lab };
}

/**
 * Return an Authorization header object.
 */
function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

module.exports = { createLab, createUser, authHeader };
