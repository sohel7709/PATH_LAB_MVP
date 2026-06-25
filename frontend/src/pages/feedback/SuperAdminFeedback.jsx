import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { feedback, superAdmin } from '../../utils/api';

const STATUS_COLORS = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Read: 'bg-blue-100 text-blue-800',
  'Working On It': 'bg-purple-100 text-purple-800',
  Completed: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
  'Need More Information': 'bg-orange-100 text-orange-800',
  'Duplicate Request': 'bg-gray-100 text-gray-800',
  'Planned For Future Release': 'bg-indigo-100 text-indigo-800',
};

const PRIORITY_COLORS = {
  Low: 'bg-gray-100 text-gray-700',
  Medium: 'bg-blue-100 text-blue-700',
  High: 'bg-orange-100 text-orange-700',
  Critical: 'bg-red-100 text-red-700',
};

export default function SuperAdminFeedback() {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState([]);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({
    status: '',
    type: '',
    priority: '',
    lab: '',
    startDate: '',
    endDate: '',
  });
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    loadLabs();
  }, []);

  useEffect(() => {
    loadFeedback();
  }, [filter]);

  const loadLabs = async () => {
    try {
      const data = await superAdmin.getLabs();
      setLabs(data.data || []);
    } catch (err) {
      // Silently fail
    }
  };

  const loadFeedback = async (page = 1, append = false) => {
    try {
      setLoading(true);
      const filters = { page, limit: 20 };
      if (filter.status) filters.status = filter.status;
      if (filter.type) filters.type = filter.type;
      if (filter.priority) filters.priority = filter.priority;
      if (filter.lab) filters.lab = filter.lab;
      if (filter.startDate) filters.startDate = filter.startDate;
      if (filter.endDate) filters.endDate = filter.endDate;
      const data = await feedback.getAllFeedback(filters);
      setFeedbacks((prev) => (append ? [...prev, ...(data.data || [])] : (data.data || [])));
      setPagination(data.pagination || {});
      setError('');
    } catch (err) {
      setError('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const clearFilters = () => {
    setFilter({ status: '', type: '', priority: '', lab: '', startDate: '', endDate: '' });
  };

  const hasActiveFilters = filter.status || filter.type || filter.priority || filter.lab || filter.startDate || filter.endDate;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 flex items-center justify-between mb-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Feedback Management</h1>
            <p className="text-sm text-indigo-100 mt-0.5">Manage all feedback tickets from all labs</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-white/70 text-sm font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          {pagination.total != null ? `${pagination.total} tickets` : ''}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter icon label */}
          <div className="flex items-center gap-1.5 text-gray-400 pr-1 border-r border-gray-200 mr-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filters</span>
          </div>

          {/* Status */}
          <div className="relative">
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className={`appearance-none pl-3 pr-8 py-2 rounded-lg border text-xs font-medium cursor-pointer transition-all outline-none
                ${filter.status
                  ? 'border-indigo-400 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-300'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-white'
                }`}
            >
              <option value="">Status · All</option>
              <option value="Pending">Pending</option>
              <option value="Read">Read</option>
              <option value="Working On It">Working On It</option>
              <option value="Completed">Completed</option>
              <option value="Rejected">Rejected</option>
              <option value="Need More Information">Need More Info</option>
              <option value="Duplicate Request">Duplicate</option>
              <option value="Planned For Future Release">Planned</option>
            </select>
            <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Type */}
          <div className="relative">
            <select
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
              className={`appearance-none pl-3 pr-8 py-2 rounded-lg border text-xs font-medium cursor-pointer transition-all outline-none
                ${filter.type
                  ? 'border-purple-400 bg-purple-50 text-purple-700 ring-1 ring-purple-300'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-white'
                }`}
            >
              <option value="">Type · All</option>
              <option value="Bug Report">Bug Report</option>
              <option value="Feature Request">Feature Request</option>
              <option value="Improvement Suggestion">Suggestion</option>
              <option value="UI/UX Issue">UI/UX</option>
              <option value="Performance Issue">Performance</option>
              <option value="Other">Other</option>
            </select>
            <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Priority */}
          <div className="relative">
            <select
              value={filter.priority}
              onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
              className={`appearance-none pl-3 pr-8 py-2 rounded-lg border text-xs font-medium cursor-pointer transition-all outline-none
                ${filter.priority
                  ? 'border-orange-400 bg-orange-50 text-orange-700 ring-1 ring-orange-300'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-white'
                }`}
            >
              <option value="">Priority · All</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
            <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Lab */}
          <div className="relative">
            <select
              value={filter.lab}
              onChange={(e) => setFilter({ ...filter, lab: e.target.value })}
              className={`appearance-none pl-3 pr-8 py-2 rounded-lg border text-xs font-medium cursor-pointer transition-all outline-none
                ${filter.lab
                  ? 'border-teal-400 bg-teal-50 text-teal-700 ring-1 ring-teal-300'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-white'
                }`}
            >
              <option value="">Lab · All</option>
              {labs.map((lab) => (
                <option key={lab._id} value={lab._id}>{lab.name}</option>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-200 mx-0.5" />

          {/* Date range */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="date"
                value={filter.startDate}
                onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                className={`pl-3 pr-3 py-2 rounded-lg border text-xs font-medium cursor-pointer transition-all outline-none
                  ${filter.startDate
                    ? 'border-blue-400 bg-blue-50 text-blue-700 ring-1 ring-blue-300'
                    : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:bg-white'
                  }`}
                placeholder="From"
              />
            </div>
            <span className="text-gray-300 text-xs font-medium">—</span>
            <div className="relative">
              <input
                type="date"
                value={filter.endDate}
                onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
                className={`pl-3 pr-3 py-2 rounded-lg border text-xs font-medium cursor-pointer transition-all outline-none
                  ${filter.endDate
                    ? 'border-blue-400 bg-blue-50 text-blue-700 ring-1 ring-blue-300'
                    : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:bg-white'
                  }`}
                placeholder="To"
              />
            </div>
          </div>

          {/* Clear button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-red-600 bg-gray-100 hover:bg-red-50 border border-transparent hover:border-red-200 px-3 py-2 rounded-lg transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Top-level counts */}
      {!loading && feedbacks.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Pending', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', count: feedbacks.filter((f) => f.status === 'Pending').length },
            { label: 'In Progress', color: 'bg-purple-50 text-purple-700 border-purple-200', count: feedbacks.filter((f) => f.status === 'Working On It').length },
            { label: 'Completed', color: 'bg-green-50 text-green-700 border-green-200', count: feedbacks.filter((f) => f.status === 'Completed').length },
            { label: 'Total', color: 'bg-blue-50 text-blue-700 border-blue-200', count: feedbacks.length },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.color} border rounded-lg p-3 text-center`}>
              <p className="text-2xl font-bold">{stat.count}</p>
              <p className="text-xs font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading && feedbacks.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-sm">No feedback found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lab</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {feedbacks.map((fb) => (
                  <tr
                    key={fb._id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/feedback/super-admin/${fb._id}`)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs font-mono font-medium text-blue-600">{fb.feedbackId}</span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <span className="text-sm font-medium text-gray-900 line-clamp-1">{fb.subject}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-gray-600">{fb.type}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${PRIORITY_COLORS[fb.priority] || 'bg-gray-100 text-gray-700'}`}>
                        {fb.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[fb.status] || 'bg-gray-100 text-gray-800'}`}>
                        {fb.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-xs font-medium text-gray-900">{fb.admin?.name || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{fb.admin?.email || ''}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-gray-600">{fb.lab?.name || 'N/A'}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                      {formatDate(fb.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.next && (
          <div className="px-6 py-3 border-t border-gray-200 flex justify-center">
            <button
              onClick={() => loadFeedback(pagination.next.page, true)}
              disabled={loading}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
            >
              {loading ? 'Loading…' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}