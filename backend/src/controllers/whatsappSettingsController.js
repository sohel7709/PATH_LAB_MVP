const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

/**
 * @desc    Get WhatsApp notification settings
 * @route   GET /api/settings/whatsapp
 * @access  Private/Admin/SuperAdmin
 */
exports.getWhatsAppSettings = async (req, res, next) => {
  try {
    // Only allow admin and super-admin to access settings
    if (!['admin', 'super-admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access WhatsApp settings'
      });
    }

    // Return the WhatsApp settings from environment variables
    const settings = {
      enabled: process.env.WHATSAPP_API_KEY ? true : false,
      apiKey: process.env.WHATSAPP_API_KEY || '',
      fromNumber: process.env.WHATSAPP_FROM_NUMBER || '',
      apiUrl: process.env.WHATSAPP_API_URL || 'https://api.whatsapp.com/v1/messages'
    };

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error getting WhatsApp settings:', error);
    next(error);
  }
};

/**
 * @desc    Update WhatsApp notification settings
 * @route   POST /api/settings/whatsapp
 * @access  Private/Admin/SuperAdmin
 */
exports.updateWhatsAppSettings = async (req, res, next) => {
  try {
    // Only allow admin and super-admin to update settings
    if (!['admin', 'super-admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update WhatsApp settings'
      });
    }

    const { enabled, apiKey, fromNumber, apiUrl } = req.body;

    // Read the current .env file
    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Update or add WhatsApp settings
    const envVars = {
      WHATSAPP_API_KEY: enabled ? apiKey : '',
      WHATSAPP_FROM_NUMBER: enabled ? fromNumber : '',
      WHATSAPP_API_URL: enabled && apiUrl ? apiUrl : 'https://api.whatsapp.com/v1/messages'
    };

    // Update each environment variable in the .env file
    Object.entries(envVars).forEach(([key, value]) => {
      // Check if the variable already exists in the file
      const regex = new RegExp(`^${key}=.*`, 'm');
      if (regex.test(envContent)) {
        // Replace existing variable
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        // Add new variable
        envContent += `\n${key}=${value}`;
      }
    });

    // Write the updated content back to the .env file
    fs.writeFileSync(envPath, envContent);

    // Update the environment variables in the current process
    Object.entries(envVars).forEach(([key, value]) => {
      process.env[key] = value;
    });

    res.status(200).json({
      success: true,
      message: 'WhatsApp settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating WhatsApp settings:', error);
    next(error);
  }
};
