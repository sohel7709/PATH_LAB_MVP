import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { superAdmin } from '../../utils/api';
import {
  BuildingOfficeIcon,
  PencilSquareIcon,
  TrashIcon,
  PlusCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  CreditCardIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/helpers';
import { DATE_FORMATS } from '../../utils/constants';

const statusBadge = (status) => {
  const map = {
    active: 'badge badge-green',
    pending_approval: 'badge badge-yellow',
    inactive: 'badge badge-gray',
    suspended: 'badge badge-red',
  };
  return map[status] || 'badge badge-gray';
};

const LabList = () => {
  const [labs, setLabs] = useState([]);
  const [filteredLabs, setFilteredLabs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLabs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await superAdmin.getLabs();
      if (response.success) {
        setLabs(response.data || []);
        setFilteredLabs(response.data || []);
      } else {
        setError(response.message || 'Failed to fetch labs');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching labs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLabs(); }, []);

  useEffect(() => {
    if (!searchTerm.trim()) { setFilteredLabs(labs); return; }
    const term = searchTerm.toLowerCase().trim();
    setFilteredLabs(labs.filter(lab =>
      (lab.name && lab.name.toLowerCase().includes(term)) ||
      (lab.address?.city && lab.address.city.toLowerCase().includes(term)) ||
      (lab.address?.state && lab.address.state.toLowerCase().includes(term)) ||
      (lab.subscription?.plan?.name && lab.subscription.plan.name.toLowerCase().includes(term))
    ));
  }, [searchTerm, labs]);

  const handleDeleteLab = async (labId) => {
    if (!window.confirm('Are you sure you want to delete this lab? This action cannot be undone.')) return;
    try {
      setLabs(prev => prev.map(l => l._id === labId ? { ...l, isDeleting: true } : l));
      const response = await superAdmin.deleteLab(labId);
      if (response.success) {
        setLabs(prev => prev.filter(l => l._id !== labId));
      } else {
        setLabs(prev => prev.map(l => l._id === labId ? { ...l, isDeleting: false } : l));
        alert(response.message || 'Failed to delete lab');
      }
    } catch (err) {
      setLabs(prev => prev.map(l => l._id === labId ? { ...l, isDeleting: false } : l));
      alert(err.message || 'An error occurred while deleting the lab');
    }
  };

  return (
    <div className="page-enter space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lab Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage all labs in the system</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchLabs} className="btn btn-secondary">
            <ArrowPathIcon className="h-4 w-4" />
            Refresh
          </button>
          <Link to="/labs/create" className="btn btn-primary">
            <PlusCircleIcon className="h-4 w-4" />
            Add Lab
          </Link>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search by name, city, state or plan..."
          className="input pl-9"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="card p-5 space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-12 skeleton" />)}
        </div>
      ) : filteredLabs.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <BuildingOfficeIcon className="h-12 w-12 text-slate-300 mb-3" />
            <p className="text-base font-medium text-slate-600">No labs found</p>
            <p className="text-sm text-slate-400 mt-1">
              {searchTerm ? 'Try a different search term' : 'Get started by creating a new lab'}
            </p>
            {!searchTerm && (
              <Link to="/labs/create" className="btn btn-primary mt-4">
                <PlusCircleIcon className="h-4 w-4" />
                Add New Lab
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="table-wrapper overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Lab Name</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Created</th>
                <th>Users</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLabs.map(lab => (
                <tr key={lab._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                        <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{lab.name}</p>
                        <p className="text-xs text-slate-400">{lab.address?.city || 'No address'}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="text-sm text-slate-700">{lab.subscription?.plan?.name || <span className="text-slate-400 italic">No Plan</span>}</div>
                    {lab.subscription?.endDate && (
                      <div className="text-xs text-slate-400">Expires: {formatDate(lab.subscription.endDate, DATE_FORMATS.DD_MM_YYYY)}</div>
                    )}
                  </td>
                  <td>
                    <span className={statusBadge(lab.status)}>
                      {lab.status ? lab.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown'}
                    </span>
                  </td>
                  <td className="text-slate-500 text-sm">{formatDate(lab.createdAt, DATE_FORMATS.DD_MM_YYYY)}</td>
                  <td className="text-slate-500 text-sm">{lab.users ? lab.users.length : 0}</td>
                  <td>
                    <div className="flex gap-1">
                      <Link to={`/labs/${lab._id}`} className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors" title="View">
                        <EyeIcon className="h-4 w-4" />
                      </Link>
                      <Link to={`/labs/${lab._id}/edit`} className="p-1.5 rounded hover:bg-indigo-50 text-indigo-600 transition-colors" title="Manage Subscription">
                        <CreditCardIcon className="h-4 w-4" />
                      </Link>
                      <Link to={`/labs/${lab._id}/edit`} className="p-1.5 rounded hover:bg-green-50 text-green-600 transition-colors" title="Edit">
                        <PencilSquareIcon className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteLab(lab._id)}
                        disabled={lab.isDeleting}
                        className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        {lab.isDeleting ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                        ) : (
                          <TrashIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LabList;
