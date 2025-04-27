import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  BellAlertIcon,
} from '@heroicons/react/24/outline';
import WhatsAppNotificationSettings from '../../components/common/WhatsAppNotificationSettings';

const NotificationSettings = () => {
  const { user } = useAuth();

  // Only allow admin and super-admin to access this page
  if (!user || !['admin', 'super-admin'].includes(user.role)) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have permission to access notification settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BellAlertIcon className="h-8 w-8 text-blue-500 mr-2" />
            Notification Settings
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Configure how notifications are sent to patients and doctors
          </p>
        </div>
      </div>

      {/* WhatsApp Notification Settings */}
      <WhatsAppNotificationSettings />

      {/* Email Notification Settings (placeholder for future implementation) */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Email Notifications</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Email notification settings are managed in the system configuration.</p>
          </div>
        </div>
      </div>

      {/* SMS Notification Settings (placeholder for future implementation) */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">SMS Notifications</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>SMS notification settings will be available in a future update.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
