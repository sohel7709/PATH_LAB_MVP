import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  BellAlertIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  ChatBubbleLeftEllipsisIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import WhatsAppNotificationSettings from '../../components/common/WhatsAppNotificationSettings';

const ToggleSwitch = ({ checked, onChange, id }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    id={id}
    onClick={() => onChange(!checked)}
    className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
    style={{
      background: checked ? 'var(--primary)' : 'var(--border-2)',
      focusRingColor: 'var(--primary)',
    }}
  >
    <span
      className="pointer-events-none inline-block h-5 w-5 transform rounded-full shadow ring-0 transition duration-200"
      style={{
        background: 'white',
        transform: checked ? 'translateX(1.25rem)' : 'translateX(0)',
      }}
    />
  </button>
);

const NotificationSettings = () => {
  const { user } = useAuth();
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);

  if (!user || !['admin', 'super-admin'].includes(user.role)) {
    return (
      <div className="page-enter max-w-2xl mx-auto p-4 sm:p-6">
        <div className="card p-10 text-center">
          <LockClosedIcon className="h-10 w-10 mx-auto mb-4" style={{ color: 'var(--text-faint)' }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>Access Denied</h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            You don&apos;t have permission to access notification settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="stat-icon" style={{ background: 'var(--primary-bg)' }}>
          <BellAlertIcon className="h-5 w-5" style={{ color: 'var(--primary)' }} />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text)' }}>
            Notification Settings
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Configure how notifications are sent to patients and doctors
          </p>
        </div>
      </div>

      {/* WhatsApp Notifications */}
      <WhatsAppNotificationSettings />

      {/* Email Notifications */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--primary-bg)' }}
            >
              <EnvelopeIcon className="h-5 w-5" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Email Notifications</h3>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Send report-ready emails to patients and referring doctors.
              </p>
              <p className="text-xs mt-2 px-2 py-1 rounded inline-block" style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>
                Managed via system configuration
              </p>
            </div>
          </div>
          <ToggleSwitch checked={emailEnabled} onChange={setEmailEnabled} id="email-toggle" />
        </div>
      </div>

      {/* SMS Notifications */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--success-bg)' }}
            >
              <DevicePhoneMobileIcon className="h-5 w-5" style={{ color: 'var(--success)' }} />
            </div>
            <div>
              <h3 className="font-semibold" style={{ color: 'var(--text)' }}>SMS Notifications</h3>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Text patients when their reports are ready for pickup or download.
              </p>
              <span className="badge badge-yellow mt-2 inline-block">Coming soon</span>
            </div>
          </div>
          <ToggleSwitch checked={smsEnabled} onChange={setSmsEnabled} id="sms-toggle" />
        </div>
      </div>

      {/* In-app Notifications placeholder */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div
            className="flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--warning)', opacity: 0.15 }}
          />
          <div
            className="flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center -ml-14"
            style={{ background: '#fff7ed' }}
          >
            <ChatBubbleLeftEllipsisIcon className="h-5 w-5" style={{ color: '#ea580c' }} />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--text)' }}>In-App Notifications</h3>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Real-time alerts inside the dashboard for staff.
            </p>
            <span className="badge badge-yellow mt-2 inline-block">Coming soon</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
