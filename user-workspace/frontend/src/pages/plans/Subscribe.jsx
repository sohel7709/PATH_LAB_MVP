import React, { useState, useEffect } from 'react';
import { plans as plansApi, auth } from '../../utils/api';
import { createOrder, verifyPayment, startTrial } from '../../utils/subscriptionApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Subscribe = () => {
  const [plans, setPlans] = useState([]);
  const [currentPlanId, setCurrentPlanId] = useState('');
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [loading, setLoading] = useState(true);

  // Define features and their labels
  const featureList = [
    { label: 'Unlimited Reports & Patients', always: true },
    { label: 'Custom Branding', key: 'customReportHeader' },
    { label: 'WhatsApp Reports', key: 'apiAccess' },
    { label: 'Finance Dashboard', always: true },
    { label: 'Export Financial Reports', premiumOnly: true },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pResp, uResp] = await Promise.all([
          plansApi.getAll(),
          auth.getProfile()
        ]);
        if (pResp.success) setPlans(pResp.data);
        if (uResp.success && uResp.user.lab?.subscription) {
          const sub = uResp.user.lab.subscription;
          setCurrentPlanId(sub.plan._id);
          if (sub.plan.name.toLowerCase().includes('trial')) {
            const now = new Date();
            const end = new Date(sub.endDate);
            const days = Math.max(Math.ceil((end - now) / (1000 * 60 * 60 * 24)), 0);
            setTrialDaysLeft(days);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const renderFeature = (plan, feature) => {
    let available = false;
    if (feature.always) available = true;
    else if (feature.premiumOnly) {
      available = plan.name.toLowerCase().includes('premium') || plan.name.toLowerCase().includes('trial');
    } else if (feature.key) {
      available = !!plan.features[feature.key];
    }
    return available ? '✅' : '❌';
  };

  const loadRazorpay = () =>
    new Promise(resolve => {
      if (window.Razorpay) return resolve(true);
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });

  const handlePayment = async (planId, planName) => {
    if (!(await loadRazorpay())) {
      alert('Failed to load payment SDK');
      return;
    }
    const orderResp = await createOrder(planId);
    if (!orderResp.success) {
      alert(orderResp.message);
      return;
    }
    const { orderId, amount, currency } = orderResp.data;
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount, currency, order_id: orderId,
      name: 'Pathology Lab SaaS',
      description: `Purchase ${planName}`,
      handler: async (response) => {
        const v = await verifyPayment(
          response.razorpay_order_id,
          response.razorpay_payment_id,
          response.razorpay_signature
        );
        if (v.success) window.location.reload();
        else alert('Payment verification failed');
      }
    };
    new window.Razorpay(options).open();
  };

  const onStartTrial = async () => {
    const t = await startTrial();
    if (t.success) window.location.reload();
    else alert(t.message);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Subscription Plans</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {plans.map(plan => {
          const isActive = plan._id === currentPlanId;
          const isTrial = plan.name.toLowerCase().includes('trial');
          return (
            <div key={plan._id}
              className={`border rounded-lg p-4 shadow ${isActive ? 'ring-4 ring-blue-500' : ''}`}>
              <h2 className="text-xl font-semibold mb-2">
                {plan.name}
                {isActive && <span className="ml-2 text-sm text-blue-700">(Current)</span>}
              </h2>
              <p className="font-bold text-lg mb-4">
                {plan.price > 0 ? `₹${plan.price}` : 'Free'} / {plan.duration} days
              </p>
              <table className="w-full text-sm mb-4">
                <tbody>
                  {featureList.map(f => (
                    <tr key={f.label}>
                      <td className="py-1">{f.label}</td>
                      <td className="py-1 text-right">{renderFeature(plan, f)}</td>
                    </tr>
                  ))}
                  {isTrial && (
                    <tr>
                      <td className="py-1">Trial Days Left</td>
                      <td className="py-1 text-right">{trialDaysLeft}</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div>
                {isActive ? (
                  <button disabled className="w-full bg-gray-400 text-white py-2 rounded">Current Plan</button>
                ) : isTrial ? (
                  <button onClick={onStartTrial} className="w-full bg-green-500 text-white py-2 rounded">
                    Start Free Trial
                  </button>
                ) : plan.name.toLowerCase().includes('premium') ? (
                  <button onClick={() => handlePayment(plan._id, plan.name)}
                    className="w-full bg-blue-600 text-white py-2 rounded">
                    Upgrade to Premium
                  </button>
                ) : (
                  <button onClick={() => handlePayment(plan._id, plan.name)}
                    className="w-full bg-blue-600 text-white py-2 rounded">
                    Buy Basic Plan
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Subscribe;
