import React, { useState, useEffect } from 'react';
import PlanForm from '../../components/plans/PlanForm';
import { plans as plansApi } from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

function PlanManagement() {
  const [plansList, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await plansApi.getAll();
      if (!response || (response.data && !Array.isArray(response.data))) {
        setError('Invalid response format from server.');
        setPlans([]);
      } else {
        setPlans(response.data || response || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch plans. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  const handleEdit = (plan) => { setSelectedPlan(plan); setIsFormVisible(true); };
  const handleAddNew = () => { setSelectedPlan(null); setIsFormVisible(true); };

  const handleDelete = async (planId) => {
    if (window.confirm('Are you sure you want to delete this plan? This cannot be undone.')) {
      setLoading(true);
      try {
        await plansApi.delete(planId);
        fetchPlans();
        if (selectedPlan && selectedPlan._id === planId) {
          setIsFormVisible(false);
          setSelectedPlan(null);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete plan.');
        setLoading(false);
      }
    }
  };

  const handleFormClose = () => { setIsFormVisible(false); setSelectedPlan(null); };
  const handleFormSuccess = () => { handleFormClose(); fetchPlans(); };

  // Find most popular plan (by active labs count or just first active one)
  const popularPlanId = plansList.find(p => p.isActive)?._id;

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Subscription Plans</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>Manage all subscription plans for labs</p>
        </div>
        {!isFormVisible && (
          <button onClick={handleAddNew} className="btn btn-primary">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Plan
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-lg leading-none">&times;</button>
        </div>
      )}

      {loading && <LoadingSpinner />}

      {/* Plan Form Modal */}
      {isFormVisible && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
              {selectedPlan ? 'Edit Plan' : 'Create New Plan'}
            </h2>
            <button onClick={handleFormClose} className="p-1 rounded hover:opacity-70 transition-opacity" style={{ color: 'var(--text-muted)' }}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <PlanForm planData={selectedPlan} onClose={handleFormClose} onSuccess={handleFormSuccess} />
        </div>
      )}

      {/* Plans Grid */}
      {!loading && !isFormVisible && (
        <>
          {plansList.length === 0 ? (
            <div className="empty-state py-16">
              <svg className="h-12 w-12 mb-3" style={{ color: 'var(--text-faint)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No plans found. Create your first plan.</p>
              <button onClick={handleAddNew} className="btn btn-primary mt-4">Create Plan</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plansList.map((plan, idx) => {
                const isPopular = plan._id === popularPlanId && idx === 1;
                return (
                  <div
                    key={plan._id}
                    className="card overflow-hidden flex flex-col relative"
                    style={isPopular ? { border: '2px solid var(--primary)', boxShadow: '0 0 0 3px var(--primary-bg)' } : {}}
                  >
                    {isPopular && (
                      <div className="text-center py-1.5 text-xs font-semibold" style={{ background: 'var(--primary)', color: 'var(--primary-txt)' }}>
                        MOST POPULAR
                      </div>
                    )}
                    <div className="p-6 flex-1">
                      {/* Plan name & status */}
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-bold" style={{ color: 'var(--text)' }}>{plan.name}</h3>
                        <span className={`badge ${plan.isActive ? 'badge-green' : 'badge-gray'}`}>
                          {plan.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

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

                      {/* Features */}
                      <ul className="space-y-2 mb-4">
                        <li className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-2)' }}>
                          <svg className="h-4 w-4 shrink-0" style={{ color: 'var(--success)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Duration: {plan.duration} days
                        </li>
                        {plan.features?.maxUsers && (
                          <li className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-2)' }}>
                            <svg className="h-4 w-4 shrink-0" style={{ color: 'var(--success)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Max Users: {plan.features.maxUsers}
                          </li>
                        )}
                        {plan.maxPatients && (
                          <li className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-2)' }}>
                            <svg className="h-4 w-4 shrink-0" style={{ color: 'var(--success)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Max Patients: {plan.maxPatients}
                          </li>
                        )}
                        {plan.maxReports && (
                          <li className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-2)' }}>
                            <svg className="h-4 w-4 shrink-0" style={{ color: 'var(--success)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Max Reports: {plan.maxReports}
                          </li>
                        )}
                        {plan.features?.customReportHeader && (
                          <li className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-2)' }}>
                            <svg className="h-4 w-4 shrink-0" style={{ color: 'var(--success)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Custom Report Header
                          </li>
                        )}
                        {Object.entries(plan.features || {}).filter(([k]) => k !== 'maxUsers' && k !== 'customReportHeader').map(([key, value]) => (
                          <li key={key} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-2)' }}>
                            <svg className="h-4 w-4 shrink-0" style={{ color: 'var(--success)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {key}: {String(value)}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Actions */}
                    <div className="px-6 py-4 flex gap-2" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                      <button onClick={() => handleEdit(plan)} className="btn btn-secondary btn-sm flex-1">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(plan._id)} className="btn btn-danger btn-sm flex-1">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default PlanManagement;
