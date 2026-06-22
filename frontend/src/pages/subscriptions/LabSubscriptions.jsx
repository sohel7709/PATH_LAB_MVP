import React, { useState, useEffect } from 'react';
import { subscriptions as subscriptionsApi, plans } from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const LabSubscriptions = () => {
  const [labs, setLabs] = useState([]);
  const [allPlans, setAllPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [manageModal, setManageModal] = useState(null);
  const [selectedLab, setSelectedLab] = useState(null);
  const [actionData, setActionData] = useState({ planId: '', days: 30, reason: '' });
  const [history, setHistory] = useState([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [labsRes, plansRes] = await Promise.all([
        subscriptionsApi.getAllLabSubscriptions(),
        plans.getAll(),
      ]);
      if (labsRes.success) setLabs(labsRes.data || []);
      if (plansRes.success) setAllPlans(plansRes.data || []);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const openManage = async (lab) => {
    setSelectedLab(lab);
    setActionData({ planId: lab.subscriptionPlan?._id || '', days: 30, reason: '' });
    setManageModal(true);
    try {
      const hist = await subscriptionsApi.getHistory(lab._id);
      if (hist.success) setHistory(hist.data || []);
    } catch (e) { setHistory([]); }
  };

  const handleActivate = async () => {
    if (!actionData.planId) { setError('Please select a plan'); return; }
    try {
      const resp = await subscriptionsApi.activateSubscription(selectedLab._id, actionData.planId, actionData.days);
      if (resp.success) { setSuccessMsg(`Subscription activated for ${selectedLab.name}`); setManageModal(false); fetchData(); }
    } catch (err) { setError(err.response?.data?.message || 'Failed to activate'); }
  };

  const handleExtend = async () => {
    try {
      const resp = await subscriptionsApi.extendSubscription(selectedLab._id, actionData.days, actionData.reason);
      if (resp.success) { setSuccessMsg(`Subscription extended by ${actionData.days} days`); setManageModal(false); fetchData(); }
    } catch (err) { setError(err.response?.data?.message || 'Failed to extend'); }
  };

  const handleChangePlan = async () => {
    if (!actionData.planId) { setError('Please select a plan'); return; }
    try {
      const resp = await subscriptionsApi.changePlan(selectedLab._id, actionData.planId, actionData.reason);
      if (resp.success) { setSuccessMsg(`Plan changed for ${selectedLab.name}`); setManageModal(false); fetchData(); }
    } catch (err) { setError(err.response?.data?.message || 'Failed to change plan'); }
  };

  const handleCancel = async () => {
    if (!window.confirm(`Are you sure you want to cancel the subscription for ${selectedLab.name}?`)) return;
    try {
      const resp = await subscriptionsApi.cancelSubscription(selectedLab._id, actionData.reason);
      if (resp.success) { setSuccessMsg(`Subscription cancelled for ${selectedLab.name}`); setManageModal(false); fetchData(); }
    } catch (err) { setError(err.response?.data?.message || 'Failed to cancel'); }
  };

  const statusConfig = {
    active: { class: 'badge-green', label: 'Active' },
    trial: { class: 'badge-blue', label: 'Trial' },
    expired: { class: 'badge-red', label: 'Expired' },
    pending: { class: 'badge-yellow', label: 'Pending' },
    cancelled: { class: 'badge-gray', label: 'Cancelled' },
  };

  const getStatusBadge = (status) => statusConfig[status]?.class || 'badge-gray';
  const getStatusLabel = (status) => statusConfig[status]?.label || (status ? status.charAt(0).toUpperCase() + status.slice(1) : 'N/A');

  const filteredLabs = labs.filter((lab) => {
    const matchesSearch = lab.name?.toLowerCase().includes(search.toLowerCase()) || lab.adminName?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || lab.subscriptionStatus === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: labs.length,
    active: labs.filter(l => l.subscriptionStatus === 'active' || l.subscriptionStatus === 'trial').length,
    expiringSoon: labs.filter(l => {
      if (!l.subscriptionExpiry) return false;
      const days = (new Date(l.subscriptionExpiry) - new Date()) / 86400000;
      return days > 0 && days <= 7;
    }).length,
    noPlan: labs.filter(l => !l.subscriptionPlan).length,
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Lab Subscriptions</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>Manage subscriptions for all labs</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Labs', value: stats.total, color: 'var(--primary)' },
          { label: 'Active Subs', value: stats.active, color: 'var(--success)' },
          { label: 'Expiring Soon', value: stats.expiringSoon, color: 'var(--warning)' },
          { label: 'No Plan', value: stats.noPlan, color: 'var(--danger)' },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Messages */}
      {error && (
        <div className="alert alert-error flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}>&times;</button>
        </div>
      )}
      {successMsg && (
        <div className="alert alert-success flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)}>&times;</button>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search labs or admin..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 w-full"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="select"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="expired">Expired</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Lab Name</th>
                <th>Admin</th>
                <th>Plan</th>
                <th>Start</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLabs.map((lab) => (
                <tr key={lab._id}>
                  <td className="font-medium" style={{ color: 'var(--text)' }}>{lab.name}</td>
                  <td style={{ color: 'var(--text-2)' }}>{lab.adminName || 'N/A'}</td>
                  <td style={{ color: 'var(--text-2)' }}>{lab.subscriptionPlan?.name || <span style={{ color: 'var(--text-muted)' }}>No Plan</span>}</td>
                  <td style={{ color: 'var(--text-2)' }}>
                    {lab.subscriptionStart
                      ? new Date(lab.subscriptionStart).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
                      : '-'}
                  </td>
                  <td style={{ color: 'var(--text-2)' }}>
                    {lab.subscriptionExpiry
                      ? new Date(lab.subscriptionExpiry).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
                      : '-'}
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadge(lab.subscriptionStatus)}`}>
                      {getStatusLabel(lab.subscriptionStatus)}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => openManage(lab)} className="btn btn-secondary btn-sm">
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
              {filteredLabs.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state py-10">
                      <svg className="h-10 w-10 mb-2" style={{ color: 'var(--text-faint)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No labs found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manage Modal */}
      {manageModal && selectedLab && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setManageModal(false)} />
          <div className="relative rounded-xl shadow-2xl max-w-lg w-full p-6 z-10 max-h-[90vh] overflow-y-auto" style={{ background: 'var(--surface)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                Manage: {selectedLab.name}
              </h3>
              <button onClick={() => setManageModal(false)} style={{ color: 'var(--text-muted)' }}>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Current Status */}
            <div className="rounded-lg p-4 mb-5 space-y-2" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Admin: </span>
                  <span style={{ color: 'var(--text)' }}>{selectedLab.adminName || 'N/A'}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Plan: </span>
                  <span style={{ color: 'var(--text)' }}>{selectedLab.subscriptionPlan?.name || 'None'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span style={{ color: 'var(--text-muted)' }}>Status: </span>
                  <span className={`badge ${getStatusBadge(selectedLab.subscriptionStatus)}`}>
                    {getStatusLabel(selectedLab.subscriptionStatus)}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Expiry: </span>
                  <span style={{ color: 'var(--text)' }}>
                    {selectedLab.subscriptionExpiry
                      ? new Date(selectedLab.subscriptionExpiry).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
                      : 'Not set'}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Patients: </span>
                  <span style={{ color: 'var(--text)' }}>{selectedLab.totalPatientsCreated || 0}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Reports: </span>
                  <span style={{ color: 'var(--text)' }}>{selectedLab.totalReportsCreated || 0}</span>
                </div>
              </div>
            </div>

            {/* Form fields */}
            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>Select Plan</label>
                <select
                  value={actionData.planId}
                  onChange={(e) => setActionData({ ...actionData, planId: e.target.value })}
                  className="select w-full"
                >
                  <option value="">-- Select a Plan --</option>
                  {allPlans.map((p) => (
                    <option key={p._id} value={p._id}>{p.name} - ₹{p.price}/{p.duration} days</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>Duration (days)</label>
                <input
                  type="number" min="1" value={actionData.days}
                  onChange={(e) => setActionData({ ...actionData, days: parseInt(e.target.value) || 0 })}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>Reason / Notes</label>
                <input
                  type="text" value={actionData.reason}
                  onChange={(e) => setActionData({ ...actionData, reason: e.target.value })}
                  placeholder="e.g., Payment received via WhatsApp"
                  className="input w-full"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 mb-5">
              <button onClick={handleActivate} className="btn btn-primary btn-sm">Activate</button>
              <button onClick={handleExtend} className="btn btn-secondary btn-sm">Extend</button>
              <button onClick={handleChangePlan} className="btn btn-secondary btn-sm">Change Plan</button>
              <button onClick={handleCancel} className="btn btn-danger btn-sm">Cancel Sub</button>
            </div>

            {/* History */}
            {history.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>Subscription History</h4>
                <div className="max-h-40 overflow-y-auto rounded-lg" style={{ border: '1px solid var(--border)' }}>
                  <table className="table text-xs">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Status</th>
                        <th>By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((h) => (
                        <tr key={h._id}>
                          <td style={{ color: 'var(--text-2)' }}>{new Date(h.createdAt).toLocaleDateString('en-IN')}</td>
                          <td>
                            <span className={`badge ${getStatusBadge(h.status)}`}>{getStatusLabel(h.status)}</span>
                          </td>
                          <td style={{ color: 'var(--text-2)' }}>{h.createdBy?.name || 'System'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LabSubscriptions;
