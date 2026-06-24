import { useState, useEffect, useCallback } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const MODULES = ['USERS', 'PATIENTS', 'REPORTS', 'TEMPLATES', 'SUBSCRIPTIONS', 'REVENUE', 'FEEDBACK', 'SETTINGS'];
const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'PRINT', 'DOWNLOAD', 'ACTIVATE', 'DEACTIVATE', 'RENEW', 'CANCEL', 'SUBMIT', 'UPLOAD', 'ROLE_CHANGE', 'PLAN_CHANGE', 'VERIFY'];
const DATE_RANGES = [
  { label: 'All Time', value: '' },
  { label: 'Today', value: 'today' },
  { label: 'Last 7 Days', value: '7days' },
  { label: 'Last 30 Days', value: '30days' },
];

async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Request failed');
  }
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    return res.blob();
  }
  return res.json();
}

export default function AuditLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const LIMIT = 50;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', LIMIT);
      if (search) params.append('search', search);
      if (moduleFilter) params.append('module', moduleFilter);
      if (actionFilter) params.append('action', actionFilter);
      if (dateRange) params.append('range', dateRange);
      if (customStart) params.append('startDate', new Date(customStart).toISOString());
      if (customEnd) params.append('endDate', new Date(customEnd + 'T23:59:59').toISOString());

      const data = await fetchWithAuth(`/audit-logs?${params.toString()}`);
      setLogs(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, moduleFilter, actionFilter, dateRange, customStart, customEnd]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      params.append('format', 'csv');
      if (search) params.append('search', search);
      if (moduleFilter) params.append('module', moduleFilter);
      if (actionFilter) params.append('action', actionFilter);
      if (dateRange) params.append('range', dateRange);
      if (customStart) params.append('startDate', new Date(customStart).toISOString());
      if (customEnd) params.append('endDate', new Date(customEnd + 'T23:59:59').toISOString());

      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/audit-logs/export?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting:', err);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getModuleBadge = (mod) => {
    const colors = {
      USERS: 'bg-blue-100 text-blue-800',
      PATIENTS: 'bg-green-100 text-green-800',
      REPORTS: 'bg-purple-100 text-purple-800',
      TEMPLATES: 'bg-orange-100 text-orange-800',
      SUBSCRIPTIONS: 'bg-teal-100 text-teal-800',
      REVENUE: 'bg-emerald-100 text-emerald-800',
      FEEDBACK: 'bg-pink-100 text-pink-800',
      SETTINGS: 'bg-slate-100 text-slate-800',
    };
    return colors[mod] || 'bg-gray-100 text-gray-800';
  };

  const getActionBadge = (action) => {
    const base = 'px-2 py-0.5 rounded text-xs font-medium';
    if (action === 'CREATE' || action === 'ACTIVATE') return `${base} bg-green-100 text-green-700`;
    if (action === 'DELETE' || action === 'CANCEL') return `${base} bg-red-100 text-red-700`;
    if (action === 'UPDATE' || action === 'STATUS_CHANGE' || action === 'ROLE_CHANGE' || action === 'PLAN_CHANGE') return `${base} bg-yellow-100 text-yellow-700`;
    if (action === 'SUBMIT' || action === 'UPLOAD') return `${base} bg-blue-100 text-blue-700`;
    if (action === 'VERIFY') return `${base} bg-indigo-100 text-indigo-700`;
    return `${base} bg-gray-100 text-gray-700`;
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
          <p className="text-sm text-slate-500 mt-1">Complete activity trail across all modules</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Search & Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by user, patient ID, report ID, template..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${showFilters ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
          <FunnelIcon className="h-4 w-4" />
          Filters
          {(moduleFilter || actionFilter || dateRange) && (
            <span className="ml-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {[moduleFilter, actionFilter, dateRange].filter(Boolean).length}
            </span>
          )}
        </button>
        {(search || moduleFilter || actionFilter || dateRange) && (
          <button
            onClick={() => {
              setSearch('');
              setModuleFilter('');
              setActionFilter('');
              setDateRange('');
              setCustomStart('');
              setCustomEnd('');
              setPage(1);
            }}
            className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Extended Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Module</label>
            <select
              value={moduleFilter}
              onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Modules</option>
              {MODULES.map(m => (
                <option key={m} value={m}>{m.charAt(0) + m.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Action</label>
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Actions</option>
              {ACTIONS.map(a => (
                <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => { setDateRange(e.target.value); setPage(1); }}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
            >
              {DATE_RANGES.map(dr => (
                <option key={dr.value} value={dr.value}>{dr.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Custom Start</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => { setCustomStart(e.target.value); setDateRange(''); setPage(1); }}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Custom End</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => { setCustomEnd(e.target.value); setDateRange(''); setPage(1); }}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Date & Time</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">User</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Role</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Lab</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Module</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Action</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                    <p className="mt-2">Loading audit logs...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log._id}
                    onClick={() => { setSelectedLog(log); setShowDetail(true); }}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{log.userName}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {log.role?.replace('-', ' ') || 'System'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{log.labName || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getModuleBadge(log.module)}`}>
                        {log.module}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={getActionBadge(log.action)}>
                        {log.action?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 max-w-xs truncate">{log.description}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
            <span className="text-sm text-slate-500">
              Showing {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} of {total} logs
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-white transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-white transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetail && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto m-4">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h3 className="text-lg font-semibold text-slate-900">Audit Log Detail</h3>
              <button
                onClick={() => { setShowDetail(false); setSelectedLog(null); }}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Date & Time</p>
                  <p className="text-sm font-medium text-slate-800">{formatDate(selectedLog.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">User</p>
                  <p className="text-sm font-medium text-slate-800">{selectedLog.userName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Role</p>
                  <p className="text-sm font-medium text-slate-800 capitalize">{selectedLog.role?.replace('-', ' ')}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Lab</p>
                  <p className="text-sm font-medium text-slate-800">{selectedLog.labName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Module</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${getModuleBadge(selectedLog.module)}`}>
                    {selectedLog.module}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Action</p>
                  <span className={`inline-block mt-1 ${getActionBadge(selectedLog.action)}`}>
                    {selectedLog.action?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Description</p>
                <p className="text-sm text-slate-800 bg-slate-50 rounded-lg p-3">{selectedLog.description}</p>
              </div>

              {selectedLog.entityId && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Entity</p>
                  <p className="text-sm text-slate-700">
                    {selectedLog.entityType || 'Unknown'}: {selectedLog.entityId}
                  </p>
                </div>
              )}

              {/* Old Data vs New Data */}
              {(selectedLog.oldData || selectedLog.newData) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedLog.oldData && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 font-semibold">Before (Old Data)</p>
                      <pre className="text-xs bg-red-50 border border-red-100 rounded-lg p-3 overflow-auto max-h-60 font-mono text-slate-700">
                        {JSON.stringify(selectedLog.oldData, null, 2)}
                      </pre>
                    </div>
                  )}
                  {selectedLog.newData && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 font-semibold">After (New Data)</p>
                      <pre className="text-xs bg-green-50 border border-green-100 rounded-lg p-3 overflow-auto max-h-60 font-mono text-slate-700">
                        {JSON.stringify(selectedLog.newData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {selectedLog.ipAddress && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">IP Address</p>
                  <p className="text-sm text-slate-600">{selectedLog.ipAddress}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}