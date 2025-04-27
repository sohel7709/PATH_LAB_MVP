const axios = require('axios');

/**
 * WhatsApp Notification Service
 * 
 * This service handles sending WhatsApp messages to patients and doctors
 * using the AiSensy WhatsApp Business API.
 */
class WhatsAppService {
  constructor() {
    this.apiKey = process.env.WHATSAPP_API_KEY;
    this.apiUrl = 'https://backend.aisensy.com/campaign/t1/api/v2';
    this.fromNumber = process.env.WHATSAPP_FROM_NUMBER;
  }

  /**
   * Send a WhatsApp message with a report link
   * 
   * @param {string} to - Recipient's phone number (with country code)
   * @param {string} patientName - Patient's name
   * @param {string} testName - Name of the test
   * @param {string} reportLink - Link to the report
   * @param {string} labName - Name of the lab
   * @returns {Promise<Object>} - Response from the WhatsApp API
   */
  async sendReportNotification(to, patientName, testName, reportLink, labName) {
    try {
      // Validate phone number format (should include country code)
      if (!to.startsWith('+')) {
        to = `+${to}`;
      }

      // Remove any spaces or special characters from phone number
      to = to.replace(/[^+\d]/g, '');

      // Format according to AiSensy API requirements
      const payload = {
        apiKey: this.apiKey,
        campaignName: "Lab Report Notification",
        destination: to.replace('+', ''),
        userName: patientName,
        source: "Lab Report System",
        templateParams: [
          patientName,
          testName
        ],
        attributes: {},
        paramsFallbackValue: {
          FirstName: patientName
        }
      };

      const response = await axios.post(
        this.apiUrl,
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`WhatsApp notification sent to ${to}`, response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending WhatsApp notification:', error.response?.data || error.message);
      throw error;
    }
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
   * @returns {Promise<Object>} - Response from the WhatsApp API
   */
  async sendDoctorNotification(to, doctorName, patientName, testName, reportLink, labName) {
    try {
      // Validate phone number format (should include country code)
      if (!to.startsWith('+')) {
        to = `+${to}`;
      }

      // Remove any spaces or special characters from phone number
      to = to.replace(/[^+\d]/g, '');

      // Format according to AiSensy API requirements
      const payload = {
        apiKey: this.apiKey,
        campaignName: "Doctor Report Notification",
        destination: to.replace('+', ''),
        userName: doctorName,
        source: "Lab Report System",
        templateParams: [
          doctorName,
          patientName
        ],
        attributes: {},
        paramsFallbackValue: {
          FirstName: doctorName
        }
      };

      const response = await axios.post(
        this.apiUrl,
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`WhatsApp notification sent to doctor ${to}`, response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending WhatsApp notification to doctor:', error.response?.data || error.message);
      throw error;
    }
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
