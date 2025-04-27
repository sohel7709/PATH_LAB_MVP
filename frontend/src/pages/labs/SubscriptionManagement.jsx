import React, { useState, useEffect } from 'react';
import { getAllLabSubscriptions, extendLabSubscription, changeLabPlan, forceExpireSubscription, getSubscriptionHistory } from '../../utils/superAdminApi';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const SubscriptionManagement = () => {
  const [labs, setLabs] = useState([]);
  const [filter, setFilter] = useState('all'); // all, active, expired, trial
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedLab, setSelectedLab] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [newPlan, setNewPlan] = useState('');
  const [extendDays, setExtendDays] = useState(0);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    setLoading(true);
    try {
      const resp = await getAllLabSubscriptions();
      if (resp.success) setLabs(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openManage = async (lab) => {
    setSelectedLab(lab);
    setNewPlan(lab.subscription.plan._id);
    setExtendDays(0);
    setReason('');
    // fetch history
    const hist = await getSubscriptionHistory(lab._id);
    if (hist.success) setHistory(hist.data);
    setModalOpen(true);
  };


  const handleExtend = async () => {
    if (!extendDays || !reason) return;
    await extendLabSubscription(selectedLab._id, extendDays, reason);
    setModalOpen(false);
    fetchLabs();
  };

  const handleChangePlan = async () => {
    if (!newPlan || !reason) return;
    await changeLabPlan(selectedLab._id, newPlan, reason);
    setModalOpen(false);
    fetchLabs();
  };

  const handleForceExpire = async () => {
    if (!reason) return;
    await forceExpireSubscription(selectedLab._id, reason);
    setModalOpen(false);
    fetchLabs();
  };

  const filteredLabs = labs.filter(lab => {
    const matchesSearch = lab.name.toLowerCase().includes(search.toLowerCase());
    let matchesFilter = false;
    if (filter === 'all') {
      matchesFilter = true;
    } else if (['active', 'expired', 'trial'].includes(filter) && lab.subscriptionStatus === filter) {
      matchesFilter = true;
    } else if (filter === 'premium' && lab.subscription.plan.name.toLowerCase().includes('premium')) {
      matchesFilter = true;
    } else if (filter === 'basic' && lab.subscription.plan.name.toLowerCase().includes('basic')) {
      matchesFilter = true;
    }
    return matchesSearch && matchesFilter;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Subscription Management</h1>
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="🔍 Search Labs"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border px-3 py-1 rounded"
        />
        <select value={filter} onChange={e => setFilter(e.target.value)} className="border px-3 py-1 rounded">
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="trial">Trial</option>
          <option value="premium">Premium</option>
          <option value="basic">Basic</option>
        </select>
      </div>
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr>
            <th className="border px-2 py-1">Lab Name</th>
            <th className="border px-2 py-1">Plan</th>
            <th className="border px-2 py-1">Status</th>
            <th className="border px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredLabs.map(lab => (
            <tr key={lab._id}>
              <td className="border px-2 py-1">{lab.name}</td>
              <td className="border px-2 py-1">{lab.subscription.plan.name}</td>
              <td className="border px-2 py-1">{lab.subscriptionStatus}</td>
              <td className="border px-2 py-1">
                <button onClick={() => openManage(lab)} className="bg-indigo-500 text-white px-2 rounded">
                  Manage
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modalOpen && selectedLab && (
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`Manage: ${selectedLab.name}`}>
          <div className="space-y-2">
            <p>📄 Current Plan: {selectedLab.subscription.plan.name}</p>
            <p>⏳ Start Date: {new Date(selectedLab.subscription.startDate).toLocaleDateString()}</p>
            <p>📅 End Date: {new Date(selectedLab.subscription.endDate).toLocaleDateString()}</p>
            <p>🛡️ Status: {selectedLab.subscriptionStatus}</p>

            <div className="mt-4">
              <p>🔘 Change Plan:</p>
              <select value={newPlan} onChange={e => setNewPlan(e.target.value)} className="border px-2 py-1 rounded">
                {labs.map(pLab => (
                  <option key={pLab.subscription.plan._id} value={pLab.subscription.plan._id}>{pLab.subscription.plan.name}</option>
                ))}
              </select>
              <button onClick={handleChangePlan} className="ml-2 bg-blue-600 text-white px-2 rounded">Save Plan</button>
            </div>

            <div className="mt-4">
              <p>➕ Extend Plan:</p>
              <input
                type="number"
                placeholder="Days"
                value={extendDays}
                onChange={e => setExtendDays(parseInt(e.target.value))}
                className="border px-2 py-1 rounded w-24"
              />
              <button onClick={handleExtend} className="ml-2 bg-green-600 text-white px-2 rounded">Extend</button>
            </div>

            <div className="mt-4">
              <button onClick={handleForceExpire} className="bg-red-600 text-white px-2 rounded">
                🚫 Force Expire Subscription
              </button>
            </div>

            <div className="mt-4">
              <p>📜 Subscription History:</p>
              <ul className="max-h-40 overflow-y-auto border p-2 rounded">
                {history.map(item => (
                  <li key={item._id} className="border-b py-1">
                    {new Date(item.modifiedAt).toLocaleString()} - {item.modificationType} by {item.modifiedBy.name}: {item.reason}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4">
              <p>🖊️ Reason:</p>
              <input
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="border px-2 py-1 rounded w-full"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SubscriptionManagement;
