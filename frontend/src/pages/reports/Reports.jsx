import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  TrashIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  PrinterIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  ArrowUturnRightIcon,
} from '@heroicons/react/24/outline';
import { reports } from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import { REPORT_STATUS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

const STATUS_STYLES = {
  pending:     'bg-yellow-100 text-yellow-700 border-yellow-200',
  'in-progress': 'bg-blue-100 text-blue-700 border-blue-200',
  completed:   'bg-green-100 text-green-700 border-green-200',
  verified:    'bg-indigo-100 text-indigo-700 border-indigo-200',
  delivered:   'bg-teal-100 text-teal-700 border-teal-200',
  cancelled:   'bg-red-100 text-red-700 border-red-200',
};

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-green-500',
  'bg-orange-500', 'bg-rose-500', 'bg-teal-500',
];

const avatarColor = (name = '') =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

export default function Reports() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super-admin';

  const [reportsData, setReportsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filterWhatsApp, setFilterWhatsApp] = useState('all');
  const [resendingId, setResendingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 25;

  useEffect(() => { fetchReports(); window.scrollTo(0, 0); }, []);

  const fetchReports = async (isRefresh = false) => {
    try {
      isRefresh ? setIsRefreshing(true) : setIsLoading(true);
      const response = await reports.getAll({ limit: 10000 });
      let arr = [];
      if (response?.data && Array.isArray(response.data)) arr = response.data;
      else if (Array.isArray(response)) arr = response;
      setReportsData(arr);
      setError(null);
    } catch (err) {
      setError(`Failed to load reports: ${err.message}`);
      setReportsData([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await reports.delete(deleteId);
      setDeleteId(null);
      fetchReports(true);
    } catch (err) {
      setError(err.message || 'Failed to delete report');
      setDeleteId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <span className="ml-1 text-gray-300">↕</span>;
    return <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  const sorted = [...reportsData].sort((a, b) => {
    const av = a[sortConfig.key] ?? '';
    const bv = b[sortConfig.key] ?? '';
    return sortConfig.direction === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  const filtered = sorted.filter(r => {
    const patient = r.patientInfo?.name || '';
    const test = r.testInfo?.name || '';
    const matchSearch = patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.patientInfo?.patientId || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    const waSent = r.reportMeta?.deliveryStatus?.whatsapp?.sent === true;
    const matchWA = filterWhatsApp === 'all' || (filterWhatsApp === 'sent' && waSent) || (filterWhatsApp === 'not-sent' && !waSent);
    return matchSearch && matchStatus && matchWA;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset to page 1 when filters change
  const setFilter = (fn) => { fn(); setCurrentPage(1); };

  const handleResendWhatsApp = async (e, reportId) => {
    e.stopPropagation();
    setResendingId(reportId);
    try {
      await reports.resendWhatsApp(reportId, 'patient');
      setReportsData(prev => prev.map(r =>
        r._id === reportId
          ? { ...r, reportMeta: { ...r.reportMeta, deliveryStatus: { ...r.reportMeta?.deliveryStatus, whatsapp: { sent: true, sentAt: new Date().toISOString(), recipient: r.patientInfo?.contact?.phone } } } }
          : r
      ));
    } catch {}
    finally { setResendingId(null); }
  };

  // Stats
  const total = reportsData.length;
  const pending = reportsData.filter(r => r.status === 'pending').length;
  const completed = reportsData.filter(r => r.status === 'completed').length;
  const verified = reportsData.filter(r => r.status === 'verified').length;
  const waSent = reportsData.filter(r => r.reportMeta?.deliveryStatus?.whatsapp?.sent === true).length;
  const waNotSent = total - waSent;

  const hasActiveFilter = filterStatus !== 'all' || searchTerm || filterWhatsApp !== 'all';

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-5">
        <div className="h-32 rounded-2xl bg-gray-100 animate-pulse" />
        <div className="h-12 rounded-xl bg-gray-100 animate-pulse" />
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50">
              <div className="h-9 w-9 rounded-full bg-gray-100 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-gray-100 rounded w-1/4 animate-pulse" />
                <div className="h-3 bg-gray-100 rounded w-1/3 animate-pulse" />
              </div>
              <div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
              <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">

      {/* ── Header banner ── */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <DocumentTextIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Reports</h1>
              <p className="text-sm text-blue-100 mt-0.5">All laboratory test reports</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setSearchTerm(''); setFilterStatus('all'); fetchReports(true); }}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing…' : 'Refresh'}
            </button>
            <Link
              to="/reports/create"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-blue-700 text-sm font-semibold rounded-lg hover:bg-blue-50 transition-colors shadow-sm"
            >
              <PlusIcon className="h-4 w-4" />
              New Report
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-5">
          {[
            { label: 'Total', value: total, color: 'bg-white/20 text-white' },
            { label: 'Pending', value: pending, color: 'bg-yellow-400/20 text-yellow-100' },
            { label: 'Completed', value: completed, color: 'bg-green-400/20 text-green-100' },
            { label: 'Verified', value: verified, color: 'bg-purple-400/20 text-purple-100' },
            { label: 'WA Sent', value: waSent, color: 'bg-emerald-400/20 text-emerald-100' },
            { label: 'WA Pending', value: waNotSent, color: 'bg-orange-400/20 text-orange-100' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-xl px-3 py-2.5 text-center`}>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs font-medium mt-0.5 opacity-80">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* ── Search + Filter bar ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by patient name, ID or test…"
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all placeholder-gray-400"
            />
          </div>

          {/* Status + WhatsApp filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {['all', ...Object.values(REPORT_STATUS)].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  filterStatus === s
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-white'
                }`}
              >
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}

            <div className="h-4 border-l border-gray-200 mx-1" />

            {[
              { key: 'all', label: 'All WA' },
              { key: 'sent', label: '✓ WA Sent' },
              { key: 'not-sent', label: '✗ WA Pending' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilterWhatsApp(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  filterWhatsApp === f.key
                    ? f.key === 'sent' ? 'bg-green-600 text-white border-green-600'
                      : f.key === 'not-sent' ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-white'
                }`}
              >
                {f.label}
              </button>
            ))}

            {hasActiveFilter && (
              <button
                onClick={() => { setSearchTerm(''); setFilterStatus('all'); setFilterWhatsApp('all'); }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-red-600 bg-gray-100 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
              >
                ✕ Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Results count ── */}
      {!isLoading && (
        <p className="text-xs text-gray-400 px-1">
          Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of {total} reports
          {filterStatus !== 'all' && ` · filtered by "${filterStatus}"`}
        </p>
      )}

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <DocumentTextIcon className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-base font-semibold text-gray-700">No reports found</p>
            <p className="text-sm text-gray-400 mt-1 mb-5">
              {hasActiveFilter ? 'Try adjusting your search or filter' : 'Create your first report to get started'}
            </p>
            {!hasActiveFilter && (
              <Link to="/reports/create" className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                <PlusIcon className="h-4 w-4" /> Create Report
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {[
                    { label: 'Patient', key: 'patientName' },
                    { label: 'Test', key: 'testName' },
                    { label: 'Date', key: 'createdAt' },
                    { label: 'Status', key: 'status' },
                    { label: 'WhatsApp', key: null },
                    { label: 'Actions', key: null },
                  ].map(col => (
                    <th
                      key={col.label}
                      onClick={() => col.key && handleSort(col.key)}
                      className={`px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide select-none ${col.key ? 'cursor-pointer hover:text-gray-700' : ''}`}
                    >
                      {col.label}
                      {col.key && <SortIcon columnKey={col.key} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map(report => {
                  const patientName = report.patientInfo?.name || 'N/A';
                  const testName = report.testInfo?.name || 'N/A';
                  const reportId = report._id || report.id;
                  const statusStyle = STATUS_STYLES[report.status] || 'bg-gray-100 text-gray-600 border-gray-200';

                  return (
                    <tr
                      key={reportId}
                      onClick={() => navigate(`/reports/${reportId}`)}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                    >
                      {/* Patient */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-full ${avatarColor(patientName)} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-sm font-bold text-white">
                              {patientName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{patientName}</p>
                            <p className="text-xs text-gray-400">{report.patientInfo?.patientId || ''}</p>
                          </div>
                        </div>
                      </td>

                      {/* Test */}
                      <td className="px-5 py-3.5 max-w-[200px]">
                        <p className="text-sm text-gray-700 truncate" title={testName}>{testName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{report.testInfo?.category || ''}</p>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <p className="text-sm text-gray-600">{formatDate(report.createdAt || report.reportMeta?.generatedAt)}</p>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusStyle}`}>
                          {report.status?.charAt(0).toUpperCase() + report.status?.slice(1)}
                        </span>
                      </td>

                      {/* WhatsApp status */}
                      <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                        {(() => {
                          const wa = report.reportMeta?.deliveryStatus?.whatsapp;
                          const isSending = resendingId === reportId;
                          if (wa?.sent) {
                            return (
                              <div className="flex flex-col gap-0.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                                  <ChatBubbleLeftRightIcon className="h-3 w-3" /> Sent
                                </span>
                                <span className="text-xs text-gray-400 pl-0.5">
                                  {wa.sentAt ? new Date(wa.sentAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : ''}
                                </span>
                              </div>
                            );
                          }
                          return (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-400 border border-gray-200">
                                <ChatBubbleLeftRightIcon className="h-3 w-3" /> Pending
                              </span>
                              <button
                                onClick={e => handleResendWhatsApp(e, reportId)}
                                disabled={isSending}
                                title="Send WhatsApp"
                                className="h-6 w-6 rounded-md flex items-center justify-center text-green-600 bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-50"
                              >
                                {isSending
                                  ? <ArrowPathIcon className="h-3 w-3 animate-spin" />
                                  : <ArrowUturnRightIcon className="h-3 w-3" />
                                }
                              </button>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <Link
                            to={`/reports/${reportId}`}
                            title="View"
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-blue-500 bg-blue-50 hover:bg-blue-100 transition-colors"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/reports/${reportId}/edit`}
                            title="Edit"
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-green-600 bg-green-50 hover:bg-green-100 transition-colors"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/reports/${reportId}/print`}
                            title="Print"
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                          >
                            <PrinterIcon className="h-4 w-4" />
                          </Link>
                          {isAdmin && (
                            <button
                              onClick={() => setDeleteId(reportId)}
                              title="Delete"
                              className="h-8 w-8 rounded-lg flex items-center justify-center text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
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
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500">
              Showing <span className="font-semibold text-gray-700">{(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}</span> of <span className="font-semibold text-gray-700">{filtered.length}</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold"
              >
                ‹
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let page;
                if (totalPages <= 7) page = i + 1;
                else if (currentPage <= 4) page = i + 1;
                else if (currentPage >= totalPages - 3) page = totalPages - 6 + i;
                else page = currentPage - 3 + i;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 w-8 rounded-lg text-xs font-semibold transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Delete modal — rendered via portal to fix fixed positioning inside transforms ── */}
      {deleteId && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="h-11 w-11 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <TrashIcon className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Delete Report</h3>
                <p className="text-sm text-gray-500 mt-1">This action is permanent and cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={isDeleting} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors">
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
