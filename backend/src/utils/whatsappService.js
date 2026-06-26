const axios = require('axios');

const AISENSY_API_KEY = process.env.AISENSY_API_KEY;
const AISENSY_USERNAME = process.env.AISENSY_USERNAME;
const AISENSY_URL = 'https://backend.aisensy.com/campaign/t1/api/v2';

class WhatsAppService {
  constructor() {
    this.apiKey = AISENSY_API_KEY;
    this.userName = AISENSY_USERNAME;
  }

  isConfigured() {
    return Boolean(this.apiKey && this.userName);
  }

  _normalizePhone(phone) {
    let normalized = phone.replace(/[^+\d]/g, '');
    // Strip leading +
    normalized = normalized.replace(/^\+/, '');
    // If 10-digit Indian number, prepend country code
    if (normalized.length === 10) {
      normalized = `91${normalized}`;
    }
    return normalized;
  }

  async _send(to, campaignName, templateParams = [], source = 'PathLab') {
    const payload = {
      apiKey: this.apiKey,
      campaignName,
      destination: this._normalizePhone(to),
      userName: this.userName,
      source,
      media: {},
      templateParams,
      tags: [],
      attributes: {},
    };

    const response = await axios.post(AISENSY_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    return response.data;
  }

  /**
   * Send report-ready notification to a patient.
   * AiSensy campaign template params: [patientName, reportLink]
   */
  async sendReportNotification(to, patientName, reportLink, campaignName = 'test_results_uploaded', _languageCode) {
    return this._send(to, campaignName, [patientName, reportLink]);
  }

  /**
   * Send report-ready notification to the referring doctor.
   * Template params: {{1}} doctorName, {{2}} patientName, {{3}} testName, {{4}} reportLink, {{5}} labName
   */
  async sendDoctorNotification(to, doctorName, patientName, testName, reportLink, labName, campaignName = 'doctor_report_ready', _languageCode) {
    return this._send(to, campaignName, [doctorName, patientName, testName, reportLink, labName]);
  }

  /**
   * Send Google Review request after report delivery.
   * AiSensy campaign template params: [patientName, labName, googleReviewUrl]
   */
  async sendGoogleReviewRequest(to, patientName, labName, googleReviewUrl, campaignName = 'google_review_request', _languageCode) {
    return this._send(to, campaignName, [patientName, labName, googleReviewUrl]);
  }
}

module.exports = new WhatsAppService();
