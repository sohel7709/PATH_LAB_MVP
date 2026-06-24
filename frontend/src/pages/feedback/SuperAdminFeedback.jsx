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

  const loadFeedback = async (page = 1) => {
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
      setFeedbacks(data.data || []);
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feedback Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all feedback tickets from all labs</p>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm text-xs focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="Pending">Pending</option>
              <option value="Read">Read</option>
              <option value="Working On It">Working On It</option>
              <option value="Completed">Completed</option>
              <option value="Rejected">Rejected</option>
              <option value="Need More Information">Need More Info</option>
              <option value="Duplicate Request">Duplicate</option>
              <option value="Planned For Future Release">Planned</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm text-xs focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="Bug Report">Bug Report</option>
              <option value="Feature Request">Feature Request</option>
              <option value="Improvement Suggestion">Suggestion</option>
              <option value="UI/UX Issue">UI/UX</option>
              <option value="Performance Issue">Performance</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filter.priority}
              onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm text-xs focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Lab</label>
            <select
              value={filter.lab}
              onChange={(e) => setFilter({ ...filter, lab: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm text-xs focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Labs</option>
              {labs.map((lab) => (
                <option key={lab._id} value={lab._id}>{lab.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">From</label>
            <input
              type="date"
              value={filter.startDate}
              onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm text-xs focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">To</label>
            <input
              type="date"
              value={filter.endDate}
              onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm text-xs focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
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
        {loading ? (
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
              onClick={() => loadFeedback(pagination.next.page)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}