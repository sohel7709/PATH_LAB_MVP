const axios = require('axios');

/**
 * WhatsApp Notification Service
 * 
 * This service handles sending WhatsApp messages to patients and doctors
 * using the UltraMsg WhatsApp API.
 */
class WhatsAppService {
  constructor() {
    this.apiKey = process.env.WHATSAPP_API_KEY;
    this.baseUrl = (process.env.WHATSAPP_API_URL || 'https://api.ultramsg.com/').replace(/\/+$/, '');
    this.fromNumber = process.env.WHATSAPP_FROM_NUMBER;
  }

  /**
   * Format a message template by replacing placeholders with actual values
   * 
   * Supported placeholders:
   * {patientName} - Patient's full name
   * {testName} - Name of the test
   * {reportLink} - Link to view the report
   * {labName} - Name of the lab
   * {doctorName} - Doctor's name (for doctor notifications)
   * 
   * @param {string} template - The message template with placeholders
   * @param {Object} data - Object containing values for placeholders
   * @returns {string} - Formatted message
   */
  formatMessage(template, data) {
    let message = template;
    const placeholders = {
      '{patientName}': data.patientName || '',
      '{testName}': data.testName || '',
      '{reportLink}': data.reportLink || '',
      '{labName}': data.labName || '',
      '{doctorName}': data.doctorName || '',
    };

    for (const [placeholder, value] of Object.entries(placeholders)) {
      message = message.replaceAll(placeholder, value);
    }

    return message;
  }

  /**
   * Send a WhatsApp message via UltraMsg API
   * 
   * @param {string} to - Recipient's phone number (with country code, e.g. +919876543210)
   * @param {string} messageBody - The message text to send
   * @returns {Promise<Object>} - Response from the WhatsApp API
   */
  async _sendMessage(to, messageBody) {
    try {
      // Validate phone number format (should include country code)
      if (!to.startsWith('+')) {
        to = `+${to}`;
      }

      // Remove any spaces or special characters from phone number
      to = to.replace(/[^+\d]/g, '');

      // UltraMsg API payload format
      // POST https://api.ultramsg.com/{instance_id}/messages/chat
      const payload = {
        token: this.apiKey,
        to: to,
        body: messageBody,
        priority: '1',
        referenceId: ''
      };

      const apiEndpoint = `${this.baseUrl}/messages/chat`;

      const response = await axios.post(
        apiEndpoint,
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send a WhatsApp message with a report link to a patient
   * 
   * @param {string} to - Recipient's phone number (with country code)
   * @param {string} patientName - Patient's name
   * @param {string} testName - Name of the test
   * @param {string} reportLink - Link to the report
   * @param {string} labName - Name of the lab
   * @param {string} customMessage - Optional custom message to send instead of template
   * @returns {Promise<Object>} - Response from the WhatsApp API
   */
  async sendReportNotification(to, patientName, testName, reportLink, labName, customMessage) {
    // Prepare the message - use custom message if provided, otherwise use default format
    let messageBody;
    if (customMessage) {
      messageBody = this.formatMessage(customMessage, {
        patientName,
        testName,
        reportLink,
        labName
      });
    } else {
      messageBody = `Dear ${patientName}, your ${testName} report is ready. View your report here: ${reportLink} - ${labName}`;
    }

    return this._sendMessage(to, messageBody);
  }

  /**
   * Send a WhatsApp message to a doctor about a new report
   * 
   * @param {string} to - Doctor's phone number (with country code)
   * @param {string} doctorName - Doctor's name
   * @param {string} patientName - Patient's name
   * @param {string} testName - Name of the test
   * @param {string} reportLink - Link to the report
   * @param {string} labName - Name of the lab
   * @param {string} customMessage - Optional custom message template
   * @returns {Promise<Object>} - Response from the WhatsApp API
   */
  async sendDoctorNotification(to, doctorName, patientName, testName, reportLink, labName, customMessage) {
    // Prepare the message - use custom message if provided, otherwise use default format
    let messageBody;
    if (customMessage) {
      messageBody = this.formatMessage(customMessage, {
        doctorName,
        patientName,
        testName,
        reportLink,
        labName
      });
    } else {
      messageBody = `Dear Dr. ${doctorName}, the report for patient ${patientName} (${testName}) is ready. View report: ${reportLink} - ${labName}`;
    }

    return this._sendMessage(to, messageBody);
  }

  /**
   * Check if WhatsApp service is properly configured
   * 
   * @returns {boolean} - True if the service is configured, false otherwise
   */
  isConfigured() {
    return Boolean(this.apiKey);
  }
}

module.exports = new WhatsAppService();
