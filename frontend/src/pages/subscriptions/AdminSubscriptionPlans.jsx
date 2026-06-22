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

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansRes, currentRes] = await Promise.allSettled([
        subscriptions.getActivePlans(),
        subscriptions.getCurrentSubscription(),
      ]);
      if (plansRes.status === 'fulfilled' && plansRes.value.success) setPlans(plansRes.value.data || []);
      if (currentRes.status === 'fulfilled' && currentRes.value.success) setCurrentSub(currentRes.value.data);
    } catch (err) {
      setError('Failed to load plans. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSubscription = (plan) => { setConfirmModal(plan); };

  const confirmRequest = async () => {
    if (!confirmModal) return;
    try {
      const response = await subscriptions.requestSubscription(confirmModal._id);
      if (response.success) {
        const data = response.data;
        const phone = data.whatsappNumber || import.meta.env.VITE_SUPER_ADMIN_WHATSAPP || '919XXXXXXXXX';
        const message = encodeURIComponent(
          `Hello,\nI would like to purchase the ${data.plan.name} Plan.\n\nLab: ${data.lab.name}\nAdmin: ${data.admin.name}\nPlan: ${data.plan.name}\n\nPlease activate my subscription.`
        );
        window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request subscription');
    }
    setConfirmModal(null);
  };

  const currentPlanId = currentSub?.lab?.subscriptionPlan?._id || currentSub?.activeSubscription?.plan?._id;
  const currentStatus = currentSub?.lab?.subscriptionStatus;
  const currentExpiry = currentSub?.lab?.subscriptionExpiry;

  const statusColors = {
    active: { bg: 'var(--success)', label: 'Active' },
    expired: { bg: 'var(--danger)', label: 'Expired' },
    pending: { bg: 'var(--warning)', label: 'Pending' },
    trial: { bg: 'var(--primary)', label: 'Trial' },
    cancelled: { bg: 'var(--text-muted)', label: 'Cancelled' },
  };
  const statusInfo = statusColors[currentStatus] || { bg: 'var(--text-muted)', label: currentStatus || 'N/A' };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Subscription Plans</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>Choose a plan that best fits your lab's needs</p>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}>&times;</button>
        </div>
      )}

      {/* Current Subscription Card */}
      {currentSub && (
        <div className="card p-6" style={{ border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <svg className="h-5 w-5" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Current Subscription</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg p-4" style={{ background: 'var(--surface-2)' }}>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Plan</p>
              <p className="font-semibold" style={{ color: 'var(--text)' }}>
                {currentSub.lab?.subscriptionPlan?.name || currentSub.activeSubscription?.plan?.name || 'No Active Plan'}
              </p>
            </div>
            <div className="rounded-lg p-4" style={{ background: 'var(--surface-2)' }}>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Status</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white" style={{ background: statusInfo.bg }}>
                {statusInfo.label.charAt(0).toUpperCase() + statusInfo.label.slice(1)}
              </span>
            </div>
            <div className="rounded-lg p-4" style={{ background: 'var(--surface-2)' }}>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Expiry Date</p>
              <p className="font-semibold" style={{ color: 'var(--text)' }}>
                {currentExpiry
                  ? new Date(currentExpiry).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      {plans.length === 0 ? (
        <div className="empty-state py-16">
          <svg className="h-12 w-12 mb-3" style={{ color: 'var(--text-faint)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p style={{ color: 'var(--text-muted)' }}>No subscription plans available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan, idx) => {
            const isCurrent = plan._id === currentPlanId;
            const isPopular = idx === 1;

            return (
              <div
                key={plan._id}
                className="card overflow-hidden flex flex-col relative"
                style={isPopular ? { border: '2px solid var(--primary)', boxShadow: '0 0 0 3px var(--primary-bg)' } : {}}
              >
                {isPopular && (
                  <div className="text-center py-1.5 text-xs font-bold tracking-wide" style={{ background: 'var(--primary)', color: 'var(--primary-txt)' }}>
                    MOST POPULAR
                  </div>
                )}

                <div className="p-6 flex-1">
                  <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>{plan.name}</h3>
                  {plan.description && (
                    <p className="text-sm mb-4" style={{ color: 'var(--text-2)' }}>{plan.description}</p>
                  )}

                  {/* Price */}
                  <div className="mb-5 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>
                        ₹{plan.price?.toLocaleString('en-IN')}
                      </span>
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>/ {plan.duration} days</span>
                    </div>
                  </div>

                  {/* Feature checklist */}
                  <ul className="space-y-2.5">
                    {[
                      `Duration: ${plan.duration} days`,
                      `Max Users: ${plan.features?.maxUsers || 5}`,
                      plan.maxPatients ? `Max Patients: ${plan.maxPatients}` : null,
                      plan.maxReports ? `Max Reports: ${plan.maxReports}` : null,
                      plan.features?.customReportHeader ? 'Custom Report Header' : null,
                    ].filter(Boolean).map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-2)' }}>
                        <svg className="h-4 w-4 shrink-0" style={{ color: 'var(--success)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action */}
                <div className="px-6 pb-6">
                  {isCurrent ? (
                    <div className="w-full text-center py-2.5 rounded-lg text-sm font-semibold" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                      ✓ Current Plan
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRequestSubscription(plan)}
                      className={`w-full btn ${isPopular ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      {currentSub ? 'Upgrade to This Plan' : 'Get Started'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setConfirmModal(null)} />
          <div className="relative rounded-xl shadow-2xl max-w-md w-full p-6 z-10" style={{ background: 'var(--surface)' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>Confirm Subscription Request</h3>

            <div className="rounded-lg p-4 mb-4 space-y-2" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>
                <span className="font-medium" style={{ color: 'var(--text)' }}>Plan: </span>{confirmModal.name}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>
                <span className="font-medium" style={{ color: 'var(--text)' }}>Price: </span>
                ₹{confirmModal.price?.toLocaleString('en-IN')} / {confirmModal.duration} days
              </p>
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>
                <span className="font-medium" style={{ color: 'var(--text)' }}>Lab: </span>{currentSub?.lab?.name || 'Your Lab'}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>
                <span className="font-medium" style={{ color: 'var(--text)' }}>Admin: </span>{user?.name || 'Admin'}
              </p>
            </div>

            <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
              After confirmation, you will be redirected to WhatsApp to complete the subscription request with the Super Admin.
            </p>

            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(null)} className="btn btn-secondary flex-1">Cancel</button>
              <button onClick={confirmRequest} className="btn btn-primary flex-1">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Confirm & Go to WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptionPlans;
