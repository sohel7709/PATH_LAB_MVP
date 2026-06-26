import { useState, useEffect } from 'react';
import {
  getAllLabSubscriptions, extendLabSubscription,
  changeLabPlan, forceExpireSubscription, getSubscriptionHistory,
} from '../../utils/superAdminApi';
import { plans as plansApi } from '../../utils/api';
import Modal from '../../components/common/Modal';
import { formatDate } from '../../utils/helpers';
import { DATE_FORMATS } from '../../utils/constants';
import {
  MagnifyingGlassIcon, BuildingOfficeIcon, CalendarIcon,
  ExclamationTriangleIcon, CheckCircleIcon, ClockIcon,
  ArrowPathIcon, ArrowsRightLeftIcon, XCircleIcon,
} from '@heroicons/react/24/outline';

const STATUS_STYLES = {
  active:  'bg-green-100 text-green-700 border-green-200',
  expired: 'bg-red-100 text-red-700 border-red-200',
  trial:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  pending: 'bg-gray-100 text-gray-600 border-gray-200',
};

const StatusBadge = ({ status }) => (
  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
    {status || 'Unknown'}
  </span>
);

const SectionLabel = ({ children }) => (
  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{children}</p>
);

export default function SubscriptionManagement() {
  const [labs, setLabs]               = useState([]);
  const [allPlans, setAllPlans]       = useState([]);
  const [filter, setFilter]           = useState('all');
  const [search, setSearch]           = useState('');
  const [loading, setLoading]         = useState(true);
  const [selectedLab, setSelectedLab] = useState(null);
  const [modalOpen, setModalOpen]     = useState(false);
  const [activeTab, setActiveTab]     = useState('overview');
  const [reason, setReason]           = useState('');
  const [newPlanId, setNewPlanId]     = useState('');
  const [extendDays, setExtendDays]   = useState('');
  const [history, setHistory]         = useState([]);
  const [saving, setSaving]           = useState(false);
  const [actionMsg, setActionMsg]     = useState(null);

  useEffect(() => {
    fetchLabs();
    fetchPlans();
  }, []);

  const fetchLabs = async () => {
    setLoading(true);
    try {
      const res = await getAllLabSubscriptions();
      if (res.success) setLabs(res.data);
    } catch {}
    finally { setLoading(false); }
  };

  const fetchPlans = async () => {
    try {
      const res = await plansApi.getAll();
      if (res.success) setAllPlans(res.data || []);
    } catch {}
  };

  const openManage = async (lab) => {
    setSelectedLab(lab);
    setNewPlanId(lab.subscription?.plan?._id || '');
    setExtendDays('');
    setReason('');
    setActiveTab('overview');
    setActionMsg(null);
    setHistory([]);
    setModalOpen(true);
    try {
      const hist = await getSubscriptionHistory(lab._id);
      if (hist.success) setHistory(hist.data || []);
    } catch {}
  };

  const showMsg = (type, text) => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 4000);
  };

  const handleExtend = async () => {
    if (!extendDays || !reason) return showMsg('error', 'Enter days and reason first.');
    setSaving(true);
    try {
      await extendLabSubscription(selectedLab._id, parseInt(extendDays), reason);
      showMsg('success', `Extended by ${extendDays} days.`);
      setExtendDays(''); setReason('');
      fetchLabs();
    } catch (e) { showMsg('error', e.message || 'Failed to extend.'); }
    finally { setSaving(false); }
  };

  const handleChangePlan = async () => {
    if (!newPlanId || !reason) return showMsg('error', 'Select a plan and enter reason.');
    setSaving(true);
    try {
      await changeLabPlan(selectedLab._id, newPlanId, reason);
      showMsg('success', 'Plan changed successfully.');
      setReason('');
      fetchLabs();
    } catch (e) { showMsg('error', e.message || 'Failed to change plan.'); }
    finally { setSaving(false); }
  };

  const handleForceExpire = async () => {
    if (!reason) return showMsg('error', 'Enter a reason before expiring.');
    if (!window.confirm(`Force-expire subscription for ${selectedLab.name}?`)) return;
    setSaving(true);
    try {
      await forceExpireSubscription(selectedLab._id, reason);
      showMsg('success', 'Subscription expired.');
      setReason('');
      fetchLabs();
    } catch (e) { showMsg('error', e.message || 'Failed.'); }
    finally { setSaving(false); }
  };

  const FILTERS = ['all', 'active', 'expired', 'trial', 'premium', 'basic'];

  const filteredLabs = labs.filter(lab => {
    const matchSearch = lab.name.toLowerCase().includes(search.toLowerCase());
    const status = lab.subscriptionStatus?.toLowerCase();
    const planName = lab.subscription?.plan?.name?.toLowerCase() || '';
    const matchFilter =
      filter === 'all' ||
      status === filter ||
      (filter === 'premium' && planName.includes('premium')) ||
      (filter === 'basic' && planName.includes('basic'));
    return matchSearch && matchFilter;
  });

  // Stats
  const activeCount  = labs.filter(l => l.subscriptionStatus === 'active').length;
  const expiredCount = labs.filter(l => l.subscriptionStatus === 'expired').length;
  const trialCount   = labs.filter(l => l.subscriptionStatus === 'trial').length;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">

      {/* ── Header ── */}
      <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <BuildingOfficeIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Subscription Management</h1>
              <p className="text-sm text-violet-100 mt-0.5">Manage lab plans, billing, and subscription status</p>
            </div>
          </div>
          <button
            onClick={fetchLabs}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mt-5">
          {[
            { label: 'Total Labs',  value: labs.length,    color: 'bg-white/20 text-white' },
            { label: 'Active',      value: activeCount,    color: 'bg-green-400/25 text-green-100' },
            { label: 'Trial',       value: trialCount,     color: 'bg-yellow-400/25 text-yellow-100' },
            { label: 'Expired',     value: expiredCount,   color: 'bg-red-400/25 text-red-100' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-xl px-3 py-2.5 text-center`}>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs font-medium opacity-80 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Search + Filter ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search labs…"
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:bg-white transition-all placeholder-gray-400"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border capitalize transition-all ${
                  filter === f
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-white'
                }`}
              >
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 px-1">
        Showing <span className="font-semibold text-gray-600">{filteredLabs.length}</span> of {labs.length} labs
      </p>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-50">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="h-9 w-9 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-gray-100 rounded w-1/4 animate-pulse" />
                  <div className="h-3 bg-gray-100 rounded w-1/3 animate-pulse" />
                </div>
                <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        ) : filteredLabs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BuildingOfficeIcon className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm font-semibold text-gray-600">No labs found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Lab', 'Plan', 'Status', 'Expires', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredLabs.map(lab => {
                  const sub = lab.subscription || {};
                  const endDate = sub.endDate ? new Date(sub.endDate) : null;
                  const isExpiringSoon = endDate && endDate > new Date() && (endDate - new Date()) < 7 * 24 * 60 * 60 * 1000;
                  return (
                    <tr key={lab._id} className="hover:bg-violet-50/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-violet-600">{lab.name?.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{lab.name}</p>
                            <p className="text-xs text-gray-400">{lab.email || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-gray-700 font-medium">{sub.plan?.name || '—'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={lab.subscriptionStatus} />
                      </td>
                      <td className="px-5 py-3.5">
                        {endDate ? (
                          <div className="flex items-center gap-1.5">
                            <span className={`text-sm ${isExpiringSoon ? 'text-orange-600 font-semibold' : 'text-gray-600'}`}>
                              {formatDate(sub.endDate, DATE_FORMATS.DD_MM_YYYY)}
                            </span>
                            {isExpiringSoon && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-700">
                                <ExclamationTriangleIcon className="h-3 w-3" /> Soon
                              </span>
                            )}
                          </div>
                        ) : <span className="text-sm text-gray-400">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => openManage(lab)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-violet-600 text-white text-xs font-semibold rounded-lg hover:bg-violet-700 transition-colors shadow-sm"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Manage Modal ── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedLab ? `Manage — ${selectedLab.name}` : 'Manage Subscription'}
        size="lg"
      >
        {selectedLab && (
          <div className="space-y-5">

            {/* Alert */}
            {actionMsg && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
                actionMsg.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {actionMsg.type === 'success'
                  ? <CheckCircleIcon className="h-4 w-4 flex-shrink-0" />
                  : <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
                }
                {actionMsg.text}
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'extend',   label: 'Extend' },
                { id: 'plan',     label: 'Change Plan' },
                { id: 'history',  label: 'History' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── Overview tab ── */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Lab Name',  value: selectedLab.name,                                         icon: BuildingOfficeIcon },
                    { label: 'Plan',      value: selectedLab.subscription?.plan?.name || '—',              icon: ArrowsRightLeftIcon },
                    { label: 'Status',    value: <StatusBadge status={selectedLab.subscriptionStatus} />,  icon: CheckCircleIcon },
                    { label: 'Start Date',value: formatDate(selectedLab.subscription?.startDate, DATE_FORMATS.DD_MM_YYYY), icon: CalendarIcon },
                    { label: 'End Date',  value: formatDate(selectedLab.subscription?.endDate, DATE_FORMATS.DD_MM_YYYY),   icon: CalendarIcon },
                    { label: 'Reports',   value: selectedLab.totalReportsCreated || 0,                     icon: ClockIcon },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-start gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Icon className="h-4 w-4 text-violet-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium">{label}</p>
                        <p className="text-sm font-semibold text-gray-900 mt-0.5">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Force expire — danger zone */}
                <div className="border border-red-200 rounded-xl p-4 bg-red-50/40">
                  <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-3">⚠ Danger Zone</p>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      placeholder="Reason for action (required)"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-red-200 bg-white focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 placeholder-gray-400"
                    />
                    <button
                      onClick={handleForceExpire}
                      disabled={saving || !reason}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      <XCircleIcon className="h-4 w-4" />
                      {saving ? 'Processing…' : 'Force Expire Subscription'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Extend tab ── */}
            {activeTab === 'extend' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-sm text-blue-700 font-medium">
                    Current expiry: <span className="font-bold">{formatDate(selectedLab.subscription?.endDate, DATE_FORMATS.DD_MM_YYYY)}</span>
                  </p>
                </div>
                <div>
                  <SectionLabel>Extend by (days)</SectionLabel>
                  <input
                    type="number"
                    min="1"
                    value={extendDays}
                    onChange={e => setExtendDays(e.target.value)}
                    placeholder="e.g. 30"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                  />
                </div>
                <div>
                  <SectionLabel>Reason *</SectionLabel>
                  <input
                    type="text"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="e.g. Customer requested 30-day extension"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                  />
                </div>
                <button
                  onClick={handleExtend}
                  disabled={saving || !extendDays || !reason}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  {saving ? 'Extending…' : `Extend by ${extendDays || '?'} days`}
                </button>
              </div>
            )}

            {/* ── Change Plan tab ── */}
            {activeTab === 'plan' && (
              <div className="space-y-4">
                <div>
                  <SectionLabel>Select New Plan</SectionLabel>
                  {allPlans.length === 0 ? (
                    <p className="text-sm text-gray-500">No plans available</p>
                  ) : (
                    <div className="space-y-2">
                      {allPlans.map(plan => (
                        <label
                          key={plan._id}
                          className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                            newPlanId === plan._id
                              ? 'border-violet-500 bg-violet-50'
                              : 'border-gray-200 hover:border-violet-300 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="plan"
                            value={plan._id}
                            checked={newPlanId === plan._id}
                            onChange={() => setNewPlanId(plan._id)}
                            className="accent-violet-600"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">{plan.name}</p>
                            {plan.price !== undefined && (
                              <p className="text-xs text-gray-500">₹{plan.price} / month</p>
                            )}
                          </div>
                          {newPlanId === plan._id && (
                            <CheckCircleIcon className="h-5 w-5 text-violet-600 flex-shrink-0" />
                          )}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <SectionLabel>Reason *</SectionLabel>
                  <input
                    type="text"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="e.g. Upgraded to premium on request"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                  />
                </div>
                <button
                  onClick={handleChangePlan}
                  disabled={saving || !newPlanId || !reason}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <ArrowsRightLeftIcon className="h-4 w-4" />
                  {saving ? 'Saving…' : 'Save Plan Change'}
                </button>
              </div>
            )}

            {/* ── History tab ── */}
            {activeTab === 'history' && (
              <div className="space-y-2">
                {history.length === 0 ? (
                  <div className="text-center py-10">
                    <ClockIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No history yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {history.map((item, i) => (
                      <div key={item._id || i} className="flex gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                          <ClockIcon className="h-4 w-4 text-violet-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-gray-700 capitalize">{item.modificationType?.replace(/_/g, ' ') || 'Action'}</p>
                            <p className="text-xs text-gray-400 flex-shrink-0">
                              {formatDate(item.modifiedAt, DATE_FORMATS.DD_MM_YYYY)}
                            </p>
                          </div>
                          {item.modifiedBy?.name && (
                            <p className="text-xs text-gray-500 mt-0.5">by {item.modifiedBy.name}</p>
                          )}
                          {item.reason && (
                            <p className="text-xs text-gray-600 mt-1 bg-white border border-gray-100 rounded-lg px-2 py-1">{item.reason}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
