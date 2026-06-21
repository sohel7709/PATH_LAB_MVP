import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { subscriptions } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminSubscriptionPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [currentSub, setCurrentSub] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansRes, currentRes] = await Promise.allSettled([
        subscriptions.getActivePlans(),
        subscriptions.getCurrentSubscription(),
      ]);

      if (plansRes.status === 'fulfilled' && plansRes.value.success) {
        setPlans(plansRes.value.data || []);
      }
      if (currentRes.status === 'fulfilled' && currentRes.value.success) {
        setCurrentSub(currentRes.value.data);
      }
    } catch (err) {
      setError('Failed to load plans. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSubscription = (plan) => {
    setConfirmModal(plan);
  };

  const confirmRequest = async () => {
    if (!confirmModal) return;
    try {
      const response = await subscriptions.requestSubscription(confirmModal._id);
      if (response.success) {
        const data = response.data;
        // Build WhatsApp message
        const phone = data.whatsappNumber || import.meta.env.VITE_SUPER_ADMIN_WHATSAPP || '919XXXXXXXXX';
        const message = encodeURIComponent(
          `Hello,\nI would like to purchase the ${data.plan.name} Plan.\n\nLab: ${data.lab.name}\nAdmin: ${data.admin.name}\nPlan: ${data.plan.name}\n\nPlease activate my subscription.`
        );
        // Redirect to WhatsApp
        window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request subscription');
    }
    setConfirmModal(null);
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-gray-100 text-gray-800',
      trial: 'bg-blue-100 text-blue-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
        <p className="mt-1 text-sm text-gray-500">
          Choose a plan that best fits your lab's needs
        </p>
      </div>

      {/* Current Subscription Status */}
      {currentSub && (
        <div className="mb-8 bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Current Subscription</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Plan</p>
              <p className="text-lg font-medium text-gray-900">
                {currentSub.lab?.subscriptionPlan?.name || currentSub.activeSubscription?.plan?.name || 'No Active Plan'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-sm font-medium ${getStatusBadge(currentSub.lab?.subscriptionStatus)}`}>
                {(currentSub.lab?.subscriptionStatus || 'N/A').charAt(0).toUpperCase() + (currentSub.lab?.subscriptionStatus || 'N/A').slice(1)}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Expiry Date</p>
              <p className="text-lg font-medium text-gray-900">
                {currentSub.lab?.subscriptionExpiry
                  ? new Date(currentSub.lab.subscriptionExpiry).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan._id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Plan Header */}
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
            </div>

            {/* Price */}
            <div className="px-6 py-5 bg-gray-50 border-b border-gray-100">
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-gray-900">₹{plan.price.toLocaleString('en-IN')}</span>
                <span className="ml-1 text-sm text-gray-500">/{plan.duration} days</span>
              </div>
            </div>

            {/* Features */}
            <div className="px-6 py-5">
              <ul className="space-y-3">
                <li className="flex items-center text-sm text-gray-600">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Duration: {plan.duration} days
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Max Users: {plan.features?.maxUsers || 5}
                </li>
                {plan.maxPatients && (
                  <li className="flex items-center text-sm text-gray-600">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Max Patients: {plan.maxPatients}
                  </li>
                )}
                {plan.maxReports && (
                  <li className="flex items-center text-sm text-gray-600">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Max Reports: {plan.maxReports}
                  </li>
                )}
                {plan.features?.customReportHeader && (
                  <li className="flex items-center text-sm text-gray-600">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Custom Report Header
                  </li>
                )}
              </ul>
            </div>

            {/* Action Button */}
            <div className="px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => handleRequestSubscription(plan)}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Request Subscription
              </button>
            </div>
          </div>
        ))}

        {plans.length === 0 && !loading && (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg">No subscription plans available at the moment.</p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setConfirmModal(null)} />
            <div className="relative bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Subscription Request</h3>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  You are requesting the <span className="font-semibold">{confirmModal.name}</span> plan.
                </p>
                <div className="bg-gray-50 rounded p-3">
                  <p className="text-sm"><span className="font-medium">Plan:</span> {confirmModal.name}</p>
                  <p className="text-sm"><span className="font-medium">Price:</span> ₹{confirmModal.price.toLocaleString('en-IN')}/{confirmModal.duration} days</p>
                  <p className="text-sm"><span className="font-medium">Lab:</span> {currentSub?.lab?.name || 'Your Lab'}</p>
                  <p className="text-sm"><span className="font-medium">Admin:</span> {user?.name || 'Admin'}</p>
                </div>
                <p className="text-sm text-gray-500">
                  After confirmation, you will be redirected to WhatsApp to complete the subscription request with the Super Admin.
                </p>
              </div>
              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRequest}
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                >
                  Confirm & Go to WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptionPlans;