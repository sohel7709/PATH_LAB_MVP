import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon, CreditCardIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

const SubscriptionRequiredModal = ({ isOpen, onClose, errorData }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!isOpen) return null;

  const isSuperAdmin = user?.role === 'super-admin';

  const handleViewPlans = () => {
    onClose();
    if (isSuperAdmin) {
      navigate('/subscriptions/manage');
    } else {
      navigate('/subscriptions/plans');
    }
  };

  const handleContactAdmin = () => {
    onClose();
    // Open WhatsApp chat with Super Admin
    const phone = import.meta.env.VITE_SUPER_ADMIN_WHATSAPP || '919XXXXXXXXX';
    const message = encodeURIComponent(
      `Hello,\nI would like to inquire about subscription plans.\n\nLab: ${errorData?.labName || 'N/A'}\nUser: ${user?.name || 'N/A'}`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const title = errorData?.message || 'Subscription Required';
  const subtitle = errorData?.subtitle || 'Your lab does not have an active subscription. Please purchase a subscription plan to continue.';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        {/* Center modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <CreditCardIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg leading-6 font-semibold text-gray-900">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  {subtitle}
                </p>
              </div>

              {/* Subscription Status Badge */}
              {errorData?.subscriptionStatus && (
                <div className="mt-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    errorData.subscriptionStatus === 'active' ? 'bg-green-100 text-green-800' :
                    errorData.subscriptionStatus === 'expired' ? 'bg-red-100 text-red-800' :
                    errorData.subscriptionStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    Status: {errorData.subscriptionStatus.charAt(0).toUpperCase() + errorData.subscriptionStatus.slice(1)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
            {!isSuperAdmin && (
              <>
                <button
                  type="button"
                  onClick={handleViewPlans}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
                >
                  View Plans
                </button>
                <button
                  type="button"
                  onClick={handleContactAdmin}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
                >
                  <PhoneIcon className="h-4 w-4 mr-2" />
                  Contact Admin
                </button>
              </>
            )}
            {isSuperAdmin && (
              <button
                type="button"
                onClick={handleViewPlans}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
              >
                Manage Subscriptions
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionRequiredModal;