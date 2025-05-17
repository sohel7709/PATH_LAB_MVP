const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Lab = require('../models/Lab'); // Import Lab model

// Original verifyToken function (restored)
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
exports.verifyToken = verifyToken; // Export the restored function
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
      // Select 'lab' field explicitly if needed, otherwise it might be excluded by default schema settings
      // Explicitly select fields to ensure 'role' and others are present on req.user
      const user = await User.findById(decoded.id).select('name email role lab activeSessions'); 

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found for token'
        });
      }

      // Check for JTI (session ID) in token and validate session
      if (!decoded.jti) {
        return res.status(401).json({
          success: false,
          message: 'Session identifier missing from token. Please log in again.'
        });
      }

      const currentSession = user.activeSessions.find(session => session.sessionId === decoded.jti);

      if (!currentSession) {
        return res.status(401).json({
          success: false,
          message: 'Session is invalid or has expired. Please log in again.'
        });
      }

      // Update lastAccessedAt for the current session
      currentSession.lastAccessedAt = new Date();
      await user.save();
      
      req.user = user; // Assign the full user object
      req.authInfo = decoded; // Store decoded token info (contains id, role, lab, jti)

      // --- Lab Status Check ---
      // Check if the user's lab is inactive (skip for super-admin)
      if (req.user.role !== 'super-admin' && req.user.lab) {
        const userLab = await Lab.findById(req.user.lab);
        // If lab not found or lab is inactive/suspended, deny access
        if (!userLab || userLab.status === 'inactive' || userLab.status === 'suspended') {
          let message = 'Your lab account is currently inactive. Please contact the Super Admin.';
          if (userLab && userLab.status === 'suspended') {
            message = 'Your lab account has been suspended. Please contact the Super Admin.';
          }
          return res.status(403).json({ // 403 Forbidden
            success: false,
            message: message,
            errorCode: 'LAB_INACTIVE_OR_SUSPENDED' // Add an error code for frontend handling
          });
        }
         // Optionally attach lab features to req for feature toggle checks later
         // This would require populating the plan within the Lab model query or here
         // Example (if Lab model populates plan):
         // if (userLab.subscription && userLab.subscription.plan && userLab.subscription.plan.features) {
         //    req.labFeatures = userLab.subscription.plan.features;
         // }
      }
      // --- End Lab Status Check ---

      next();
    } catch (err) {
       console.error('Auth Protect Error:', err); // Log the actual error
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

// Middleware to check if a specific feature is enabled for the lab's plan
exports.checkFeature = (...requiredFeatures) => {
  return async (req, res, next) => {
    // Super Admins have access to all features
    if (req.user.role === 'super-admin') {
      return next();
    }

    // Check if user belongs to a lab
    if (!req.user.lab) {
       return res.status(403).json({
        success: false,
        message: 'User is not associated with any lab.'
      });
    }

    try {
      // Fetch the lab and populate the plan details, specifically the features
      const lab = await Lab.findById(req.user.lab).populate({
        path: 'subscription.plan',
        select: 'features name', // Select only the features and name for efficiency
      });

      // Double-check lab status (already done in protect, but good for safety)
      if (!lab || lab.status !== 'active') {
         return res.status(403).json({
          success: false,
          message: 'Lab is not active.',
          errorCode: 'LAB_INACTIVE_OR_SUSPENDED'
        });
      }

      // Check if the lab has an active plan assigned
      if (!lab.subscription || !lab.subscription.plan) {
        return res.status(403).json({
          success: false,
          message: 'No active subscription plan found for this lab.'
        });
      }

      const planFeatures = lab.subscription.plan.features || {};
      const planName = lab.subscription.plan.name || 'Unnamed Plan';

      // Check if all required features are enabled in the plan
      const missingFeatures = requiredFeatures.filter(feature => !planFeatures[feature]);

      if (missingFeatures.length > 0) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Your current plan ('${planName}') does not include the required feature(s): ${missingFeatures.join(', ')}.`,
          errorCode: 'FEATURE_NOT_ENABLED'
        });
      }

      // Attach features to request object for potential use in controllers (optional)
      req.labFeatures = planFeatures;
      next();

    } catch (error) {
      console.error('Feature Check Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking feature access.'
      });
    }
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
