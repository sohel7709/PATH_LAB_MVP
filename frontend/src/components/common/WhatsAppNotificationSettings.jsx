import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { whatsappSettings } from '../../utils/api';

const WhatsAppNotificationSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    enabled: false,
    messageTemplate: 'Dear {patientName}, your {testName} report is ready. View your report here: {reportLink} - {labName}',
    sendToPatientOnReportComplete: true,
    sendToDoctorOnReportComplete: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [previewMessage, setPreviewMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    // Generate preview whenever template changes
    const preview = settings.messageTemplate
      .replace(/{patientName}/g, 'John Doe')
      .replace(/{testName}/g, 'Blood Test')
      .replace(/{reportLink}/g, 'https://labnexus.in/view-report/abc123')
      .replace(/{labName}/g, user?.name || 'Pathology Lab')
      .replace(/{doctorName}/g, 'Dr. Smith');
    setPreviewMessage(preview);
  }, [settings.messageTemplate, user?.name]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await whatsappSettings.getSettings(user?.lab);
      const data = response.data || response;
      if (data && data._id) {
        setSettings({
          enabled: data.enabled || false,
          messageTemplate: data.messageTemplate || 'Dear {patientName}, your {testName} report is ready. View your report here: {reportLink} - {labName}',
          sendToPatientOnReportComplete: data.sendToPatientOnReportComplete !== false,
          sendToDoctorOnReportComplete: data.sendToDoctorOnReportComplete || false
        });
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to load WhatsApp settings:', err);
      setError('Failed to load WhatsApp notification settings');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value
    });
    // Clear success when user makes changes
    if (success) setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      
      await whatsappSettings.updateSettings(settings, user?.lab);
      
      setSuccess(true);
      setSaving(false);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Failed to save WhatsApp notification settings');
      setSaving(false);
    }
  };

  if (!user || !['admin', 'super-admin'].includes(user.role)) {
    return null;
  }

  const insertPlaceholder = (placeholder) => {
    setSettings({
      ...settings,
      messageTemplate: settings.messageTemplate + placeholder
    });
  };

  if (loading) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6 bg-blue-600">
          <h3 className="text-lg leading-6 font-medium text-white">
            WhatsApp Notification Settings
          </h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6 bg-blue-600">
        <h3 className="text-lg leading-6 font-medium text-white">
          WhatsApp Notification Settings
        </h3>
        <p className="mt-1 text-sm text-blue-100">
          Configure WhatsApp notifications sent to patients when reports are created. 
          The API key and sender number are configured in the server environment variables.
        </p>
      </div>
      <div className="px-4 py-5 sm:p-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="rounded-md bg-green-50 p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Settings saved successfully!</h3>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="relative flex items-start">
            <div className="flex items-center h-5">
              <input
                id="whatsapp-enabled"
                name="enabled"
                type="checkbox"
                checked={settings.enabled}
                onChange={handleChange}
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="whatsapp-enabled" className="font-medium text-gray-700 cursor-pointer">
                Enable WhatsApp Notifications
              </label>
              <p className="text-gray-500 text-xs">
                Master toggle for all WhatsApp notifications. When disabled, no WhatsApp messages will be sent.
              </p>
            </div>
          </div>

          {/* Send to Patient Toggle */}
          <div className="relative flex items-start">
            <div className="flex items-center h-5">
              <input
                id="sendToPatientOnReportComplete"
                name="sendToPatientOnReportComplete"
                type="checkbox"
                checked={settings.sendToPatientOnReportComplete}
                onChange={handleChange}
                disabled={!settings.enabled}
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="sendToPatientOnReportComplete" className={`font-medium ${settings.enabled ? 'text-gray-700 cursor-pointer' : 'text-gray-400'}`}>
                Send Notifications to Patients
              </label>
              <p className="text-gray-500 text-xs">
                When enabled, patients who have opted in will receive WhatsApp notifications when their reports are ready.
              </p>
            </div>
          </div>

          {/* Send to Doctor Toggle */}
          <div className="relative flex items-start">
            <div className="flex items-center h-5">
              <input
                id="sendToDoctorOnReportComplete"
                name="sendToDoctorOnReportComplete"
                type="checkbox"
                checked={settings.sendToDoctorOnReportComplete}
                onChange={handleChange}
                disabled={!settings.enabled}
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="sendToDoctorOnReportComplete" className={`font-medium ${settings.enabled ? 'text-gray-700 cursor-pointer' : 'text-gray-400'}`}>
                Send Notifications to Referring Doctors
              </label>
              <p className="text-gray-500 text-xs">
                When enabled, referring doctors will receive WhatsApp notifications when their patients' reports are ready.
              </p>
            </div>
          </div>

          {/* Message Template */}
          <div>
            <label htmlFor="messageTemplate" className="block text-sm font-medium text-gray-700">
              Custom Message Template
            </label>
            <div className="mt-1">
              <textarea
                id="messageTemplate"
                name="messageTemplate"
                rows={3}
                value={settings.messageTemplate}
                onChange={handleChange}
                disabled={!settings.enabled}
                className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${!settings.enabled ? 'bg-gray-100 text-gray-500' : ''}`}
                placeholder="Enter your custom message template..."
              />
            </div>
            
            {/* Placeholder Buttons */}
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="text-xs text-gray-500 mr-1 self-center">Insert placeholder:</span>
              <button
                type="button"
                onClick={() => insertPlaceholder('{patientName}')}
                disabled={!settings.enabled}
                className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {'{patientName}'}
              </button>
              <button
                type="button"
                onClick={() => insertPlaceholder('{testName}')}
                disabled={!settings.enabled}
                className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {'{testName}'}
              </button>
              <button
                type="button"
                onClick={() => insertPlaceholder('{reportLink}' )}
                disabled={!settings.enabled}
                className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {'{reportLink}'}
              </button>
              <button
                type="button"
                onClick={() => insertPlaceholder('{labName}')}
                disabled={!settings.enabled}
                className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {'{labName}'}
              </button>
              <button
                type="button"
                onClick={() => insertPlaceholder('{doctorName}')}
                disabled={!settings.enabled}
                className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {'{doctorName}'}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Available placeholders: {'{patientName}'}, {'{testName}'}, {'{reportLink}'}, {'{labName}'}, {'{doctorName}'}
            </p>
          </div>

          {/* Preview */}
          {settings.messageTemplate && (
            <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Message Preview:</h4>
              <div className="bg-white rounded p-3 border border-gray-200">
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{previewMessage}</p>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                This is a preview using sample data. Actual messages will use real patient and report information.
              </p>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 rounded-md p-4 border border-blue-200">
            <h4 className="text-sm font-medium text-blue-800 mb-1">How it works:</h4>
            <ul className="text-xs text-blue-700 space-y-1 list-disc pl-4">
              <li>The WhatsApp API key and sender number are configured in the server environment variables.</li>
              <li>Notifications are only sent to patients who have enabled WhatsApp notifications (per patient setting).</li>
              <li>The report link sent is the same as the QR code link: <code className="bg-blue-100 px-1 rounded">https://labnexus.in/view-report/REPORT_ID</code></li>
              <li>Update the message template to customize what patients receive.</li>
            </ul>
          </div>

          <div className="pt-5">
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving || !settings.enabled}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : 'Save Settings'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WhatsAppNotificationSettings;