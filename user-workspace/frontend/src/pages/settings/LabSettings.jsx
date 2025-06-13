import { useState, useEffect } from 'react';
import { ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/20/solid';
import { lab } from '../../utils/api';

export default function LabSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [settings, setSettings] = useState({
    labName: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    logo: '',
    reportHeader: '',
    reportFooter: '',
    currency: 'INR',
    timeZone: 'Asia/Kolkata',
    notifications: {
      email: true,
      sms: false,
      whatsapp: false
    },
    defaultTestCategories: [],
    customFields: []
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const data = await lab.getSettings();
      setSettings(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('notifications.')) {
      const notificationType = name.split('.')[1];
      setSettings(prev => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          [notificationType]: checked
        }
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      await lab.updateSettings(settings);
      setSuccess('Settings updated successfully');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Laboratory Settings
          </h2>
        </div>
      </div>

      <form className="mt-8 space-y-8" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">{success}</h3>
              </div>
            </div>
          </div>
        )}

        {/* Basic Information */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Basic Information</h3>
            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="labName" className="block text-sm font-medium text-gray-700">
                  Laboratory name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="labName"
                    id="labName"
                    required
                    value={settings.labName}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    value={settings.email}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone number
                </label>
                <div className="mt-1">
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    required
                    value={settings.phone}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                  Website
                </label>
                <div className="mt-1">
                  <input
                    type="url"
                    name="website"
                    id="website"
                    value={settings.website}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <div className="mt-1">
                  <textarea
                    name="address"
                    id="address"
                    rows={3}
                    required
                    value={settings.address}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Report Settings */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Report Settings</h3>
            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <label htmlFor="reportHeader" className="block text-sm font-medium text-gray-700">
                  Report Header
                </label>
                <div className="mt-1">
                  <textarea
                    name="reportHeader"
                    id="reportHeader"
                    rows={3}
                    value={settings.reportHeader}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Custom text to appear at the top of reports..."
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="reportFooter" className="block text-sm font-medium text-gray-700">
                  Report Footer
                </label>
                <div className="mt-1">
                  <textarea
                    name="reportFooter"
                    id="reportFooter"
                    rows={3}
                    value={settings.reportFooter}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Custom text to appear at the bottom of reports..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Notification Settings</h3>
            <div className="mt-6 space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="notifications.email"
                  id="notifications.email"
                  checked={settings.notifications.email}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="notifications.email" className="ml-2 block text-sm text-gray-900">
                  Email notifications
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="notifications.sms"
                  id="notifications.sms"
                  checked={settings.notifications.sms}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="notifications.sms" className="ml-2 block text-sm text-gray-900">
                  SMS notifications
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="notifications.whatsapp"
                  id="notifications.whatsapp"
                  checked={settings.notifications.whatsapp}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="notifications.whatsapp" className="ml-2 block text-sm text-gray-900">
                  WhatsApp notifications
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className={`btn-primary ${isSaving ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}