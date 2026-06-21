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
  const [actionData, setActionData] = useState({
    planId: '',
    days: 30,
    reason: '',
  });
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

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
    setActionData({
      planId: lab.subscriptionPlan?._id || '',
      days: 30,
      reason: '',
    });
    setManageModal(true);

    // Fetch history
    try {
      const hist = await subscriptionsApi.getHistory(lab._id);
      if (hist.success) setHistory(hist.data || []);
    } catch (e) {
      setHistory([]);
    }
  };

  const handleActivate = async () => {
    if (!actionData.planId) {
      setError('Please select a plan');
      return;
    }
    try {
      const resp = await subscriptionsApi.activateSubscription(
        selectedLab._id,
        actionData.planId,
        actionData.days
      );
      if (resp.success) {
        setSuccessMsg(`Subscription activated for ${selectedLab.name}`);
        setManageModal(false);
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to activate');
    }
  };

  const handleExtend = async () => {
    try {
      const resp = await subscriptionsApi.extendSubscription(
        selectedLab._id,
        actionData.days,
        actionData.reason
      );
      if (resp.success) {
        setSuccessMsg(`Subscription extended by ${actionData.days} days`);
        setManageModal(false);
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to extend');
    }
  };

  const handleChangePlan = async () => {
    if (!actionData.planId) {
      setError('Please select a plan');
      return;
    }
    try {
      const resp = await subscriptionsApi.changePlan(
        selectedLab._id,
        actionData.planId,
        actionData.reason
      );
      if (resp.success) {
        setSuccessMsg(`Plan changed for ${selectedLab.name}`);
        setManageModal(false);
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change plan');
    }
  };

  const handleCancel = async () => {
    if (!window.confirm(`Are you sure you want to cancel the subscription for ${selectedLab.name}?`)) return;
    try {
      const resp = await subscriptionsApi.cancelSubscription(
        selectedLab._id,
        actionData.reason
      );
      if (resp.success) {
        setSuccessMsg(`Subscription cancelled for ${selectedLab.name}`);
        setManageModal(false);
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      trial: 'bg-blue-100 text-blue-800',
      expired: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredLabs = labs.filter((lab) => {
    const matchesSearch =
      lab.name?.toLowerCase().includes(search.toLowerCase()) ||
      lab.adminName?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === 'all' || lab.subscriptionStatus === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Lab Subscriptions</h1>
        <p className="mt-1 text-sm text-gray-500">Manage subscriptions for all labs</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex justify-between items-center">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">&times;</button>
        </div>
      )}
      {successMsg && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex justify-between items-center">
          <p className="text-sm text-green-700">{successMsg}</p>
          <button onClick={() => setSuccessMsg(null)} className="text-green-500 hover:text-green-700">&times;</button>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search labs or admin..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="expired">Expired</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Labs Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lab Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLabs.map((lab) => (
                <tr key={lab._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-sm font-medium text-gray-900">{lab.name}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-sm text-gray-600">{lab.adminName || 'N/A'}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-sm text-gray-600">
                      {lab.subscriptionPlan?.name || 'No Plan'}
                    </p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(lab.subscriptionStatus)}`}>
                      {(lab.subscriptionStatus || 'N/A').charAt(0).toUpperCase() + (lab.subscriptionStatus || 'N/A').slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-sm text-gray-600">
                      {lab.subscriptionExpiry
                        ? new Date(lab.subscriptionExpiry).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
                        : '-'}
                    </p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => openManage(lab)}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
              {filteredLabs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                    No labs found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manage Modal */}
      {manageModal && selectedLab && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setManageModal(false)} />
            <div className="relative bg-white rounded-lg max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Manage Subscription: {selectedLab.name}
              </h3>

              {/* Current Status */}
              <div className="bg-gray-50 rounded p-4 mb-4 space-y-2">
                <p className="text-sm"><span className="font-medium">Admin:</span> {selectedLab.adminName || 'N/A'}</p>
                <p className="text-sm"><span className="font-medium">Current Plan:</span> {selectedLab.subscriptionPlan?.name || 'None'}</p>
                <p className="text-sm">
                  <span className="font-medium">Status:</span>{' '}
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(selectedLab.subscriptionStatus)}`}>
                    {(selectedLab.subscriptionStatus || 'N/A').charAt(0).toUpperCase() + (selectedLab.subscriptionStatus || 'N/A').slice(1)}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="font-medium">Expiry:</span>{' '}
                  {selectedLab.subscriptionExpiry
                    ? new Date(selectedLab.subscriptionExpiry).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
                    : 'Not set'}
                </p>
                <p className="text-sm"><span className="font-medium">Total Patients:</span> {selectedLab.totalPatientsCreated || 0}</p>
                <p className="text-sm"><span className="font-medium">Total Reports:</span> {selectedLab.totalReportsCreated || 0}</p>
              </div>

              {/* Activate / Change Plan */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Plan</label>
                <select
                  value={actionData.planId}
                  onChange={(e) => setActionData({ ...actionData, planId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Select a Plan --</option>
                  {allPlans.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} - ₹{p.price}/{p.duration} days
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
                <input
                  type="number"
                  min="1"
                  value={actionData.days}
                  onChange={(e) => setActionData({ ...actionData, days: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Reason */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Notes</label>
                <input
                  type="text"
                  value={actionData.reason}
                  onChange={(e) => setActionData({ ...actionData, reason: e.target.value })}
                  placeholder="e.g., Payment received via WhatsApp"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={handleActivate}
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                >
                  Activate Subscription
                </button>
                <button
                  onClick={handleExtend}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Extend Subscription
                </button>
                <button
                  onClick={handleChangePlan}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                  Change Plan
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                >
                  Cancel Subscription
                </button>
              </div>

              {/* Subscription History */}
              {history.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Subscription History</h4>
                  <div className="max-h-40 overflow-y-auto border rounded">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 py-1 text-left">Date</th>
                          <th className="px-2 py-1 text-left">Status</th>
                          <th className="px-2 py-1 text-left">By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((h) => (
                          <tr key={h._id} className="border-t">
                            <td className="px-2 py-1">
                              {new Date(h.createdAt).toLocaleDateString('en-IN')}
                            </td>
                            <td className="px-2 py-1">
                              <span className={`inline-flex px-1.5 py-0.5 rounded-full text-xs ${getStatusBadge(h.status)}`}>
                                {h.status}
                              </span>
                            </td>
                            <td className="px-2 py-1">{h.createdBy?.name || 'System'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setManageModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Labs</p>
          <p className="text-2xl font-bold text-gray-900">{labs.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">
            {labs.filter((l) => l.subscriptionStatus === 'active' || l.subscriptionStatus === 'trial').length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Expired</p>
          <p className="text-2xl font-bold text-red-600">
            {labs.filter((l) => l.subscriptionStatus === 'expired').length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">
            {labs.filter((l) => l.subscriptionStatus === 'pending').length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LabSubscriptions;