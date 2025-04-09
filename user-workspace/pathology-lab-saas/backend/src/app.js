const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

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

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Security middleware
app.use(require('helmet')());
app.use(require('xss-clean')());
app.use(require('express-rate-limit')({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
}));

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
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
