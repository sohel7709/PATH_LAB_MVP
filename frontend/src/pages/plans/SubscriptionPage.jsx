// frontend/src/pages/plans/SubscriptionPage.jsx
import React, { useState, useEffect } from 'react'; // Removed useContext
import api from '../../utils/api';
import { Link } from 'react-router-dom';
// Removed AuthContext import as user is not needed here
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
import { formatDate as formatSharedDate } from '../../utils/helpers'; // Aliased import
import { DATE_FORMATS } from '../../utils/constants';

const SubscriptionPage = () => {
  const [subscription, setSubscription] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Removed: const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchSubscription = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/subscriptions/current');
        if (response.data && response.data.success) {
          setSubscription(response.data.data); // The subscription document
          setPlan(response.data.plan); // The populated plan document
        } else {
          // Handle cases where no subscription is found (e.g., new lab, failed trial)
          setSubscription(null);
          setPlan(null);
          console.log(response.data?.message || 'No active subscription found.');
        }
      } catch (err) {
        console.error('Error fetching subscription:', err);
        setError(err.response?.data?.message || 'An error occurred while fetching subscription details.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  // Removed local formatDate, will use shared one

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircleIcon className="h-4 w-4 mr-1" /> Active</span>;
      case 'trial':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><InformationCircleIcon className="h-4 w-4 mr-1" /> Trial</span>;
      case 'expired':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><ExclamationTriangleIcon className="h-4 w-4 mr-1" /> Expired</span>;
      case 'cancelled':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Cancelled</span>;
      case 'pending_payment':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending Payment</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">No Subscription</span>;
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading subscription details...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-center mb-10 text-gray-800">Your Subscription</h1>

      <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg p-8 border">
        {subscription && plan ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-indigo-600">{plan.planName} Plan</h2>
              {getStatusBadge(subscription.status)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-gray-700">
              <div>
                <p className="font-medium">Start Date:</p>
                <p>{formatSharedDate(subscription.startDate, DATE_FORMATS.DD_MM_YYYY)}</p>
              </div>
              <div>
                <p className="font-medium">End Date:</p>
                <p>{formatSharedDate(subscription.endDate, DATE_FORMATS.DD_MM_YYYY)}</p>
              </div>
              <div>
                <p className="font-medium">Price:</p>
                <p>₹{plan.price} / month</p>
              </div>
               <div>
                <p className="font-medium">Auto Renew:</p>
                <p>{subscription.autoRenew ? 'Enabled' : 'Disabled'}</p>
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-3 text-gray-800">Plan Features:</h3>
            <ul className="list-disc list-inside space-y-1 mb-8 text-gray-700">
              {plan.features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
               {/* Show upgrade button if not on the highest plan (assuming Premium is highest public) */}
               {plan.planName !== 'Premium' && subscription.status !== 'trial' && (
                 <Link
                    to="/pricing"
                    className="w-full sm:w-auto text-center bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition duration-300"
                 >
                    Upgrade Plan
                 </Link>
               )}
               {/* Add button to manage billing/cancel later */}
               {/* <button className="w-full sm:w-auto text-center bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition duration-300">
                 Manage Billing
               </button> */}
            </div>
          </>
        ) : (
          // Display when no active subscription is found
          <div className="text-center">
            <p className="text-gray-600 mb-4">You currently do not have an active subscription.</p>
            <Link
              to="/pricing"
              className="inline-block bg-indigo-600 text-white py-2 px-6 rounded hover:bg-indigo-700 transition duration-300"
            >
              View Plans
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPage;
