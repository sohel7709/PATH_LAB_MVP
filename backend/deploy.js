/**
 * Deployment script for Pathology Lab SaaS
 * 
 * This script performs the following tasks:
 * 1. Installs dependencies
 * 2. Creates a superadmin user and sample lab
 * 3. Creates default test templates
 * 
 * Usage: node deploy.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Helper function to execute commands and log output
function runCommand(command, description) {
  console.log(`\n${colors.bright}${colors.blue}=== ${description} ===${colors.reset}\n`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`\n${colors.green}✓ Success: ${description}${colors.reset}\n`);
    return true;
  } catch (error) {
    console.error(`\n${colors.red}✗ Error: ${description} failed${colors.reset}`);
    console.error(`${colors.red}${error.message}${colors.reset}\n`);
    return false;
  }
}

// Check if MongoDB is running
function checkMongoDB() {
  console.log(`\n${colors.bright}${colors.blue}=== Checking MongoDB Connection ===${colors.reset}\n`);
  try {
    const mongoose = require('mongoose');
    mongoose.connect(process.env.MONGODB_URI, { 
      serverSelectionTimeoutMS: 5000 
    }).then(() => {
      console.log(`${colors.green}✓ MongoDB is running and accessible${colors.reset}\n`);
      mongoose.disconnect();
    }).catch(err => {
      console.error(`${colors.red}✗ MongoDB connection failed: ${err.message}${colors.reset}\n`);
      console.log(`${colors.yellow}Please make sure MongoDB is running at: ${process.env.MONGODB_URI}${colors.reset}\n`);
      process.exit(1);
    });
  } catch (error) {
    console.error(`${colors.red}✗ MongoDB check failed: ${error.message}${colors.reset}\n`);
    process.exit(1);
  }
}

// Check environment variables
function checkEnvironmentVariables() {
  console.log(`\n${colors.bright}${colors.blue}=== Checking Environment Variables ===${colors.reset}\n`);
  
  const requiredVars = [
    'PORT',
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_EXPIRE'
  ];
  
  const missingVars = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    console.error(`${colors.red}✗ Missing required environment variables: ${missingVars.join(', ')}${colors.reset}\n`);
    console.log(`${colors.yellow}Please check your .env file and ensure all required variables are set.${colors.reset}\n`);
    process.exit(1);
  }
  
  if (process.env.JWT_SECRET === 'your-super-secret-jwt-key-2024') {
    console.error(`${colors.red}✗ JWT_SECRET is set to the default value. This is insecure.${colors.reset}\n`);
    console.log(`${colors.yellow}Please update JWT_SECRET in your .env file with a strong random string.${colors.reset}\n`);
    process.exit(1);
  }
  
  console.log(`${colors.green}✓ All required environment variables are set${colors.reset}\n`);
}

// Main deployment function
async function deploy() {
  console.log(`\n${colors.bright}${colors.magenta}======================================${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}  PATHOLOGY LAB SAAS DEPLOYMENT SCRIPT  ${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}======================================${colors.reset}\n`);
  
  // Check environment
  checkEnvironmentVariables();
  checkMongoDB();
  
  // Install dependencies
  if (!runCommand('npm install', 'Installing dependencies')) {
    process.exit(1);
  }
  
  // Create superadmin and sample lab
  if (!runCommand('node createsuperadmin.js', 'Creating superadmin user and sample lab')) {
    process.exit(1);
  }

  // Create default test templates

  console.log(`\n${colors.bright}${colors.green}========================================${colors.reset}`);
  console.log(`${colors.bright}${colors.green}  DEPLOYMENT COMPLETED SUCCESSFULLY!  ${colors.reset}`);
  console.log(`${colors.bright}${colors.green}========================================${colors.reset}\n`);
  
  console.log(`${colors.cyan}You can now start the server with:${colors.reset}`);
  console.log(`${colors.bright}npm start${colors.reset}\n`);
  
  console.log(`${colors.cyan}Default login credentials:${colors.reset}`);
  console.log(`${colors.bright}Super Admin:${colors.reset}`);
  console.log(`Email: superadmin_new@example.com`);
  console.log(`Password: SuperAdmin@2025!`);
  
  console.log(`\n${colors.bright}Admin:${colors.reset}`);
  console.log(`Email: admin_new@example.com`);
  console.log(`Password: Admin@2025!`);
  
  console.log(`\n${colors.bright}Technician:${colors.reset}`);
  console.log(`Email: technician_new@example.com`);
  console.log(`Password: Technician@2025!`);
  
  console.log(`\n${colors.yellow}IMPORTANT: For security reasons, please change these default passwords after first login.${colors.reset}\n`);
}

// Run the deployment
deploy().catch(err => {
  console.error(`\n${colors.red}Deployment failed: ${err.message}${colors.reset}\n`);
  process.exit(1);
});
