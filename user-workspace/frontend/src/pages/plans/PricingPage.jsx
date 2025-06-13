// frontend/src/pages/plans/PricingPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../../utils/api'; // Assuming api utility is set up for requests
import { Link } from 'react-router-dom'; // For linking to payment page later
import { CheckCircleIcon } from '@heroicons/react/24/solid'; // Example icon

const PricingPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/plans'); // Fetch public plans
        if (response.data && response.data.success) {
          setPlans(response.data.data);
        } else {
          setError('Failed to load plans.');
        }
      } catch (err) {
        console.error('Error fetching plans:', err);
        setError(err.response?.data?.message || 'An error occurred while fetching plans.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleSelectPlan = (planId) => {
    // TODO: Implement logic to initiate upgrade process
    // This might involve redirecting to a payment page or calling an API endpoint
    console.log(`Plan selected: ${planId}`);
    alert(`Plan selection/upgrade for ${planId} not yet implemented.`);
  };

  if (loading) {
    return <div className="text-center py-10">Loading pricing plans...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-center mb-10 text-gray-800">Choose Your Plan</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <div key={plan._id} className="border rounded-lg shadow-lg p-6 flex flex-col bg-white">
            <h2 className="text-2xl font-semibold mb-3 text-indigo-600">{plan.planName}</h2>
            <p className="text-gray-600 mb-4">{plan.description}</p>
            <div className="mb-6 text-center">
              <span className="text-4xl font-bold text-gray-900">
                ₹{plan.price}
              </span>
              <span className="text-gray-500">/month</span>
            </div>
            <ul className="space-y-2 mb-8 flex-grow">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-1" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSelectPlan(plan._id)}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition duration-300 mt-auto"
            >
              Choose {plan.planName}
            </button>
          </div>
        ))}
      </div>
       {/* Add Enterprise plan section if needed */}
       <div className="text-center mt-12 p-6 border rounded-lg bg-gray-50 max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold mb-3 text-gray-700">Enterprise</h2>
            <p className="text-gray-600 mb-4">Need a custom solution with unlimited users and specific integrations? Contact us for tailored pricing.</p>
            <Link to="/contact" className="text-indigo-600 hover:text-indigo-800 font-medium">
                Contact Sales &rarr;
            </Link>
        </div>
    </div>
  );
};

export default PricingPage;
