import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowPathIcon,
  TrashIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner, { SkeletonLoader } from '../../components/common/LoadingSpinner';
import { reports } from '../../utils/api';
import { formatDate, getStatusColor } from '../../utils/helpers';
import { REPORT_STATUS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

const statusBadge = (status) => {
  const map = {
    completed: 'badge badge-green',
    pending: 'badge badge-yellow',
    processing: 'badge badge-blue',
    cancelled: 'badge badge-red',
  };
  return map[status] || 'badge badge-gray';
};

export default function Reports() {
  const [reportsData, setReportsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super-admin';

  useEffect(() => {
    fetchReports();
    window.scrollTo(0, 0);
  }, []);

  const fetchReports = async (isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      const response = await reports.getAll({ limit: 10000 });
      let arr = [];
      if (response?.data && Array.isArray(response.data)) arr = response.data;
      else if (Array.isArray(response)) arr = response;
      else if (response?.success && Array.isArray(response.data)) arr = response.data;

      setReportsData(arr || []);
      setError(null);
    } catch (err) {
      setError(`Failed to load reports: ${err.message}`);
      setReportsData([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setReportToDelete(null);
  };

  const handleDelete = async () => {
    if (!reportToDelete) return;
    setIsDeleting(true);
    try {
      await reports.delete(reportToDelete);
      setShowDeleteConfirm(false);
      setReportToDelete(null);
      fetchReports(true);
    } catch (err) {
      setError(err.message || 'Failed to delete report');
      setShowDeleteConfirm(false);
      setReportToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const sortedReports = [...reportsData].sort((a, b) => {
    if (sortConfig.direction === 'asc') return a[sortConfig.key] > b[sortConfig.key] ? 1 : -1;
    return a[sortConfig.key] < b[sortConfig.key] ? 1 : -1;
  });

  const filteredReports = sortedReports.filter(r => {
    const patientName = r.patientInfo?.name || r.patientName || '';
    const testName = r.testInfo?.name || r.testName || '';
    const matchesSearch = patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || r.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc'
      ? <ArrowUpIcon className="h-3 w-3 inline ml-1" />
      : <ArrowDownIcon className="h-3 w-3 inline ml-1" />;
  };

  if (isLoading) {
    return (
      <div className="page-enter space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 skeleton w-32 mb-2" />
            <div className="h-4 skeleton w-56" />
          </div>
        </div>
        <div className="card p-5 space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-12 skeleton" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">All laboratory reports</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterStatus('all');
              setSortConfig({ key: 'createdAt', direction: 'desc' });
              fetchReports(true);
            }}
            disabled={isRefreshing}
            className="btn btn-secondary"
          >
            <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <Link to="/reports/create" className="btn btn-primary">
            <PlusIcon className="h-4 w-4" />
            New Report
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

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by patient or test name..."
            className="input pl-9"
          />
        </div>
        <div className="relative sm:w-52">
          <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="input select pl-9"
          >
            <option value="all">All Status</option>
            {Object.values(REPORT_STATUS).map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th className="cursor-pointer hover:text-slate-800" onClick={() => handleSort('patientName')}>
                Patient <SortIcon columnKey="patientName" />
              </th>
              <th className="cursor-pointer hover:text-slate-800" onClick={() => handleSort('testName')}>
                Test <SortIcon columnKey="testName" />
              </th>
              <th className="cursor-pointer hover:text-slate-800" onClick={() => handleSort('createdAt')}>
                Date <SortIcon columnKey="createdAt" />
              </th>
              <th className="cursor-pointer hover:text-slate-800" onClick={() => handleSort('status')}>
                Status <SortIcon columnKey="status" />
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">
                    <DocumentTextIcon className="h-12 w-12 text-slate-300 mb-3" />
                    <p className="text-base font-medium text-slate-600">No reports found</p>
                    <p className="text-sm text-slate-400 mt-1">
                      {searchTerm || filterStatus !== 'all' ? 'Try adjusting your search or filters' : 'Create your first report to get started'}
                    </p>
                    <Link to="/reports/create" className="btn btn-primary mt-4">
                      <PlusIcon className="h-4 w-4" />
                      Create Report
                    </Link>
                  </div>
                </td>
              </tr>
            ) : filteredReports.map(report => {
              const patientName = report.patientInfo?.name || report.patientName || 'N/A';
              const testName = report.testInfo?.name || report.testName || 'N/A';
              const reportId = report._id || report.id;
              return (
                <tr key={reportId}>
                  <td className="font-medium text-slate-900">{patientName}</td>
                  <td className="text-slate-500 max-w-[200px] truncate" title={testName}>{testName}</td>
                  <td className="text-slate-500">{formatDate(report.createdAt || report.reportMeta?.generatedAt)}</td>
                  <td>
                    <span className={statusBadge(report.status)}>
                      {report.status?.charAt(0).toUpperCase() + report.status?.slice(1)}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <Link to={`/reports/${reportId}/print`} className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors" title="View">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>
                      <Link to={`/reports/${reportId}/edit`} className="p-1.5 rounded hover:bg-green-50 text-green-600 transition-colors" title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                      <Link to={`/reports/${reportId}/print`} className="p-1.5 rounded hover:bg-slate-100 text-slate-500 transition-colors" title="Print">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                      </Link>
                      {isAdmin && (
                        <button
                          onClick={() => { setReportToDelete(reportId); setShowDeleteConfirm(true); }}
                          className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Delete modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={cancelDelete} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <TrashIcon className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Delete Report</h3>
                <p className="text-sm text-slate-500 mt-1">Are you sure you want to delete this report? This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={cancelDelete} className="btn btn-secondary">Cancel</button>
              <button onClick={handleDelete} disabled={isDeleting} className="btn btn-danger">
                {isDeleting ? 'Deleting...' : 'Delete Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
