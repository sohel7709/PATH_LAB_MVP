const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add user to req object
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Protect routes

exports.verifyToken = verifyToken;
exports.protect = async (req, res, next) => {

  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Add user to req object
      req.user = await User.findById(decoded.id);

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Check if user belongs to lab
exports.checkLabAccess = async (req, res, next) => {
  try {
    // Super admin can access all labs
    if (req.user.role === 'super-admin') {
      // If a specific lab ID is provided in the request, use it
      const labId = req.params.labId || req.body.labId || req.query.labId || req.params.lab || req.body.lab || req.query.lab || req.params.id;
      if (labId) {
        req.labId = labId;
      }
      return next();
    }

    // For non-super-admin users, get lab ID from request params or body
    const labId = req.params.labId || req.body.labId || req.query.labId || req.params.lab || req.body.lab || req.query.lab || req.params.id;

    // If no lab ID is specified in the request, use the user's lab ID
    if (!labId) {
      // Add the user's lab ID to the request for controllers to use
      req.labId = req.user.lab;
      return next();
    }

    // Check if user's lab matches the requested lab
    // Convert both to strings for comparison to avoid ObjectId vs String issues
    const userLabId = req.user.lab ? req.user.lab.toString() : '';
    const requestedLabId = labId.toString();

    // For patient and report operations, we need to check if the patient/report belongs to the user's lab
    // This will be handled in the respective controllers
    if ((req.originalUrl.includes('/patients/') || req.originalUrl.includes('/reports/')) && 
        (req.method === 'DELETE' || req.method === 'GET' || req.method === 'PUT')) {
      req.labId = req.user.lab;
      return next();
    }

    if (!userLabId || userLabId !== requestedLabId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this lab\'s data'
      });
    }

    // Add the lab ID to the request for controllers to use
    req.labId = req.user.lab;
    next();
  } catch (error) {
    next(error);
  }
};

// Error handler middleware
exports.errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: messages
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate field value entered'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
