import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const WhatsAppNotificationSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    enabled: false,
    apiKey: '',
    fromNumber: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await api.whatsappSettings.getSettings();
        setSettings(response.data || {
          enabled: false,
          apiKey: '',
          fromNumber: ''
        });
        setLoading(false);
      } catch {
        setError('Failed to load WhatsApp notification settings');
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      await api.whatsappSettings.updateSettings(settings);
      
      setSuccess(true);
      setLoading(false);
    } catch {
      setError('Failed to save WhatsApp notification settings');
      setLoading(false);
    }
  };

  if (!user || !['admin', 'super-admin'].includes(user.role)) {
    return null;
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6 bg-blue-600">
        <h3 className="text-lg leading-6 font-medium text-white">
          WhatsApp Notification Settings
        </h3>
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
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <div className="relative flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="whatsapp-enabled"
                    name="enabled"
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={handleChange}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="whatsapp-enabled" className="font-medium text-gray-700">
                    Enable WhatsApp Notifications
                  </label>
                  <p className="text-gray-500">
                    When enabled, patients and doctors will receive WhatsApp notifications when new reports are created.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
                WhatsApp API Key
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  name="apiKey"
                  id="apiKey"
                  value={settings.apiKey}
                  onChange={handleChange}
                  disabled={!settings.enabled}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Enter your WhatsApp API key"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                This is the API key from your AiSensy WhatsApp Business API account.
              </p>
            </div>

            <div>
              <label htmlFor="fromNumber" className="block text-sm font-medium text-gray-700">
                WhatsApp From Number
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="fromNumber"
                  id="fromNumber"
                  value={settings.fromNumber}
                  onChange={handleChange}
                  disabled={!settings.enabled}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Enter your WhatsApp sender number (with country code)"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                This is the phone number that will be used to send WhatsApp messages.
              </p>
            </div>

            <div className="pt-5">
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {loading ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WhatsAppNotificationSettings;
