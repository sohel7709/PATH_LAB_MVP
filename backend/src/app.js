const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const helmet = require('helmet');
const xssClean = require('xss-clean');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import routes
const authRoutes = require('./routes/authRoutes');
const labManagementRoutes = require('./routes/labManagementRoutes');
const labRoutes = require('./routes/labRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const patientRoutes = require('./routes/patientRoutes');
const exportRoutes = require('./routes/exportRoutes');
const userManagementRoutes = require('./routes/userManagementRoutes');
const testTemplateRoutes = require('./routes/testTemplateRoutes');
const labReportSettingsRoutes = require('./routes/labReportSettingsRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const testRoutes = require('./routes/testRoutes');
const planRoutes = require('./routes/planRoutes'); // Import plan routes
const settingsRoutes = require('./routes/settingsRoutes'); // Import settings routes
const superAdminRoutes = require('./routes/superAdminRoutes'); // Import super admin routes
const revenueRoutes = require('./routes/revenueRoutes'); // Import revenue routes
const templateRoutes = require('./routes/templateRoutes'); // Import template routes
// const groupTestTemplateRoutes = require('./routes/groupTestTemplateRoutes');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'https://labnexus.in',
  'https://www.labnexus.in'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
};
app.use(cors(corsOptions));

// Allow OPTIONS requests to pass through without authentication
app.options('*', cors(corsOptions));

// Use morgan in development mode only
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      connectSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "https://raw.githubusercontent.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'same-origin' }
}));

// Prevent XSS attacks
app.use(xssClean());

// Prevent parameter pollution
app.use(hpp());

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 500, // limit each IP to 500 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 10 minutes'
  }
});
app.use(limiter);

// Add security headers
app.use((req, res, next) => {
  // Conditionally skip for public PDF route
  if (req.path.startsWith('/api/reports/public/') && req.path.endsWith('/pdf')) {
    console.log('[DEBUG] Skipping custom security headers for public PDF path:', req.path);
    return next();
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/lab-management', labManagementRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/user-management', userManagementRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/export', exportRoutes);
app.use('/api', testTemplateRoutes);
app.use('/api', labReportSettingsRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/test', testRoutes);
app.use('/api/plans', planRoutes); // Mount plan routes
app.use('/api/settings', settingsRoutes); // Mount settings routes
app.use('/api/superadmin', superAdminRoutes); // Mount super admin routes
app.use('/api/revenue', revenueRoutes); // Mount revenue routes
app.use('/api/templates', templateRoutes); // Mount template routes
// app.use('/api/group-test-templates', groupTestTemplateRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to LabNexus API'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
