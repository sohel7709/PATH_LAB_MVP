import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckIcon,
  CheckBadgeIcon,
  SparklesIcon,
  CalendarDaysIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
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

  const handleRequestSubscription = (plan) => setConfirmModal(plan);

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
  const currentPlanName = currentSub?.lab?.subscriptionPlan?.name || currentSub?.activeSubscription?.plan?.name || 'No Active Plan';

  const statusBadge = {
    active: 'badge-green', expired: 'badge-red', pending: 'badge-yellow',
    trial: 'badge-blue', cancelled: 'badge-gray',
  }[currentStatus] || 'badge-gray';

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-wrapper page-enter">
      {/* Hero header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="badge badge-blue mb-3"><SparklesIcon className="h-3.5 w-3.5 mr-1" /> Plans &amp; Pricing</span>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>Choose the plan that fits your lab</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          Flexible plans designed to scale with your patients, reports, and team.
        </p>
      </div>

      {error && (
        <div className="alert alert-error mb-6 max-w-3xl mx-auto justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}>&times;</button>
        </div>
      )}

      {/* Current subscription banner */}
      {currentSub && (
        <div
          className="card p-5 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 max-w-4xl mx-auto"
          style={{ borderLeft: '4px solid var(--primary)' }}
        >
          <div className="flex items-center gap-3">
            <div className="stat-icon" style={{ background: 'var(--primary-bg)' }}>
              <CheckBadgeIcon className="h-5 w-5" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Current plan</p>
              <p className="font-semibold" style={{ color: 'var(--text)' }}>{currentPlanName}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Status</p>
              <span className={`badge ${statusBadge}`}>{currentStatus ? currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1) : 'N/A'}</span>
            </div>
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Renews / Expires</p>
              <p className="text-sm font-semibold flex items-center gap-1" style={{ color: 'var(--text)' }}>
                <CalendarDaysIcon className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                {currentExpiry
                  ? new Date(currentExpiry).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Plans grid */}
      {plans.length === 0 ? (
        <div className="empty-state py-16">
          <SparklesIcon className="h-12 w-12 mb-3" style={{ color: 'var(--text-faint)' }} />
          <p style={{ color: 'var(--text-muted)' }}>No subscription plans available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
          {plans.map((plan, idx) => {
            const isCurrent = plan._id === currentPlanId;
            const isFeatured = idx === 1;
            const muted = isFeatured ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)';
            const body = isFeatured ? 'rgba(255,255,255,0.92)' : 'var(--text-2)';

            const features = [
              `${plan.duration} days validity`,
              `Up to ${plan.features?.maxUsers || 5} users`,
              plan.maxPatients ? `${plan.maxPatients} patients` : null,
              plan.maxReports ? `${plan.maxReports} reports` : null,
              plan.features?.customReportHeader ? 'Custom report header' : null,
            ].filter(Boolean);

            return (
              <div key={plan._id} className={`plan-card ${isFeatured ? 'featured' : ''} p-6`}>
                {isFeatured && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold tracking-wide"
                    style={{ background: '#fff', color: 'var(--primary)', boxShadow: 'var(--shadow-sm)' }}
                  >
                    MOST POPULAR
                  </span>
                )}

                <h3 className="text-lg font-bold" style={{ color: isFeatured ? '#fff' : 'var(--text)' }}>{plan.name}</h3>
                {plan.description && (
                  <p className="text-sm mt-1" style={{ color: muted }}>{plan.description}</p>
                )}

                <div className="my-5 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold" style={{ color: isFeatured ? '#fff' : 'var(--primary)' }}>
                    ₹{plan.price?.toLocaleString('en-IN')}
                  </span>
                  <span className="text-sm" style={{ color: muted }}>/ {plan.duration}d</span>
                </div>

                <ul className="space-y-2.5 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm" style={{ color: body }}>
                      <span
                        className="h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: isFeatured ? 'rgba(255,255,255,0.2)' : 'var(--success-bg)' }}
                      >
                        <CheckIcon className="h-3.5 w-3.5" style={{ color: isFeatured ? '#fff' : 'var(--success)' }} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  {isCurrent ? (
                    <div
                      className="w-full text-center py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-1"
                      style={isFeatured
                        ? { background: 'rgba(255,255,255,0.2)', color: '#fff' }
                        : { background: 'var(--surface-2)', color: 'var(--text-muted)' }}
                    >
                      <CheckBadgeIcon className="h-4 w-4" /> Current plan
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRequestSubscription(plan)}
                      className={`btn w-full justify-center ${isFeatured ? '' : 'btn-primary'}`}
                      style={isFeatured ? { background: '#fff', color: 'var(--primary)', fontWeight: 600 } : {}}
                    >
                      {currentSub ? 'Upgrade to this plan' : 'Get started'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setConfirmModal(null)} />
          <div className="relative rounded-xl shadow-2xl max-w-md w-full p-6 z-10" style={{ background: 'var(--surface)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Confirm subscription request</h3>
              <button onClick={() => setConfirmModal(null)} style={{ color: 'var(--text-muted)' }}>
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-lg p-4 mb-4 space-y-2" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              {[
                ['Plan', confirmModal.name],
                ['Price', `₹${confirmModal.price?.toLocaleString('en-IN')} / ${confirmModal.duration} days`],
                ['Lab', currentSub?.lab?.name || 'Your Lab'],
                ['Admin', user?.name || 'Admin'],
              ].map(([k, v]) => (
                <p key={k} className="text-sm" style={{ color: 'var(--text-2)' }}>
                  <span className="font-medium" style={{ color: 'var(--text)' }}>{k}: </span>{v}
                </p>
              ))}
            </div>

            <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
              After confirmation, you'll be redirected to WhatsApp to complete the request with the Super Admin.
            </p>

            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(null)} className="btn btn-secondary flex-1">Cancel</button>
              <button onClick={confirmRequest} className="btn btn-primary flex-1">Confirm &amp; continue</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptionPlans;
