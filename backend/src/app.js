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
const planRoutes = require('./routes/planRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const revenueRoutes = require('./routes/revenueRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const superAdminRevenueRoutes = require('./routes/superAdminRevenueRoutes');

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
  maxAge: 86400
};
app.use(cors(corsOptions));

app.options('*', cors(corsOptions));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 20,
  minPoolSize: 5,
  serverSelectionTimeoutMS: 5000,
})

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

app.use(xssClean());
app.use(hpp());

// Global rate limiter — 300 req/min per user (or IP before auth)
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  keyGenerator: (req) => req.user?.id || req.ip,
  skip: (req) => req.path === '/health',
  message: { success: false, message: 'Too many requests, please slow down and try again in a minute' }
});
app.use(limiter);

// Strict auth limiter — 10 attempts per 15 min per IP (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.ip,
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// NoSQL injection sanitizer — strips $ and . from req.body/params/query
const sanitizeNoSQL = (req, res, next) => {
  const sanitize = (obj) => {
    if (obj && typeof obj === 'object') {
      for (const key of Object.keys(obj)) {
        if (key.startsWith('$') || key.includes('.')) {
          delete obj[key];
        } else {
          sanitize(obj[key]);
        }
      }
    }
  };
  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);
  next();
};
app.use(sanitizeNoSQL);

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Inline lab settings routes (no separate router needed)
const { protect, authorize } = require('./middleware/auth');
const { getLabSettings, updateLabSettings } = require('./controllers/labController');

// Serve uploaded files only to authenticated users (prevents enumeration of patient/lab data)
app.use('/uploads', protect, express.static(path.join(__dirname, '../uploads')));

// Mount routes
app.use('/api/auth', authLimiter, authRoutes);  // strict rate limit on all auth endpoints
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
app.use('/api/plans', planRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/super-admin/revenue', superAdminRevenueRoutes);
app.get('/api/lab/settings', protect, authorize('admin', 'super-admin'), getLabSettings);
app.put('/api/lab/settings', protect, authorize('admin', 'super-admin'), updateLabSettings);

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

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use((err, req, res, next) => {
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5001;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {});
}

module.exports = app;
