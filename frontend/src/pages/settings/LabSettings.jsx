import { useState, useEffect } from 'react';
import {
  ExclamationCircleIcon,
  CheckCircleIcon,
  BuildingOffice2Icon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
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
    notifications: { email: true, sms: false, whatsapp: false },
    defaultTestCategories: [],
    customFields: [],
  });

  useEffect(() => { fetchSettings(); }, []);

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
        notifications: { ...prev.notifications, [notificationType]: checked },
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
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
      <div className="page-enter max-w-4xl mx-auto space-y-6 p-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-40 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="page-enter max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="stat-icon" style={{ background: 'var(--primary-bg)' }}>
          <BuildingOffice2Icon className="h-5 w-5" style={{ color: 'var(--primary)' }} />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text)' }}>
            Laboratory Settings
          </h1>
          {settings.labName && (
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>
              {settings.labName}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-error flex items-center gap-2">
          <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="alert alert-success flex items-center gap-2">
          <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Lab Information */}
        <div className="card p-6 space-y-5">
          <h2 className="section-title">Lab Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>
                Laboratory Name <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="text"
                name="labName"
                required
                value={settings.labName}
                onChange={handleChange}
                className="input w-full"
                placeholder="e.g. City Diagnostics Lab"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>
                Email Address <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="email"
                name="email"
                required
                value={settings.email}
                onChange={handleChange}
                className="input w-full"
                placeholder="lab@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>
                Phone Number <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="tel"
                name="phone"
                required
                value={settings.phone}
                onChange={handleChange}
                className="input w-full"
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>
                Website
              </label>
              <input
                type="url"
                name="website"
                value={settings.website}
                onChange={handleChange}
                className="input w-full"
                placeholder="https://yourlab.com"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>
                Address <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <textarea
                name="address"
                rows={3}
                required
                value={settings.address}
                onChange={handleChange}
                className="input w-full resize-none"
                placeholder="Full address of the lab..."
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="btn btn-primary"
            >
              {isSaving ? 'Saving...' : 'Save Lab Information'}
            </button>
          </div>
        </div>

        {/* Lab Branding / Theme */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center gap-2">
            <DocumentTextIcon className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
            <h2 className="section-title" style={{ margin: 0 }}>Lab Branding &amp; Report Settings</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>
                Report Header
              </label>
              <textarea
                name="reportHeader"
                rows={3}
                value={settings.reportHeader}
                onChange={handleChange}
                className="input w-full resize-none"
                placeholder="Custom text to appear at the top of reports..."
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Displayed at the top of every patient report PDF.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>
                Report Footer
              </label>
              <textarea
                name="reportFooter"
                rows={3}
                value={settings.reportFooter}
                onChange={handleChange}
                className="input w-full resize-none"
                placeholder="Custom text to appear at the bottom of reports..."
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Displayed at the bottom of every patient report PDF.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="btn btn-primary"
            >
              {isSaving ? 'Saving...' : 'Save Branding Settings'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
