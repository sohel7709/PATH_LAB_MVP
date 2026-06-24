import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ExclamationCircleIcon,
  PrinterIcon,
  PencilIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  BeakerIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { reports } from '../../utils/api';
import { formatDate, getStatusColor } from '../../utils/helpers';
import { REPORT_STATUS } from '../../utils/constants';
import { isOutsideRange } from '../../utils/reportUtils';

export default function ViewReport() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedStatus, setEditedStatus] = useState('');

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const response = await reports.getById(id);
      const data = response.data || response;
      setReport(data);
      setEditedStatus(data.status);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    try {
      await reports.update(id, { status: editedStatus });
      setReport(prev => ({ ...prev, status: editedStatus }));
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePrint = () => {
    window.open(`/reports/${id}/print`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="page-enter max-w-5xl mx-auto space-y-4 p-4">
        <div className="skeleton h-10 rounded-lg w-1/3 mb-6" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-6 space-y-3">
            <div className="skeleton h-5 rounded w-1/4" />
            <div className="skeleton h-4 rounded w-3/4" />
            <div className="skeleton h-4 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="page-enter max-w-5xl mx-auto p-4">
        <div className="alert alert-error flex items-start gap-3">
          <ExclamationCircleIcon className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Failed to load report</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
        <Link to="/reports" className="btn btn-secondary mt-4 inline-flex items-center gap-2">
          <ArrowLeftIcon className="h-4 w-4" /> Back to Reports
        </Link>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="page-enter max-w-5xl mx-auto p-4">
        <div className="empty-state">
          <DocumentTextIcon className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-medium" style={{ color: 'var(--text)' }}>Report not found</p>
          <Link to="/reports" className="btn btn-primary mt-4">Back to Reports</Link>
        </div>
      </div>
    );
  }

  const patientName = report.patientInfo?.name || 'Unknown Patient';
  const testName = report.testInfo?.name || 'Unknown Test';

  return (
    <div className="page-enter max-w-5xl mx-auto px-4 py-6 space-y-6 print:py-0">
      {/* Inline error banner */}
      {error && (
        <div className="alert alert-error flex items-center gap-2">
          <ExclamationCircleIcon className="h-4 w-4 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Top bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            {patientName} — {testName}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>Report #{report.id || id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/reports/${id}/edit`} className="btn btn-primary btn-sm inline-flex items-center gap-1.5">
            <PencilIcon className="h-4 w-4" /> Edit
          </Link>
          <button onClick={handlePrint} className="btn btn-secondary btn-sm inline-flex items-center gap-1.5">
            <PrinterIcon className="h-4 w-4" /> Print
          </button>
          <Link to={`/reports/${id}/print`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm inline-flex items-center gap-1.5">
            <DocumentTextIcon className="h-4 w-4" /> Formatted
          </Link>
          <a href={`/api/reports/${id}/pdf`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm inline-flex items-center gap-1.5">
            <ArrowDownTrayIcon className="h-4 w-4" /> PDF
          </a>
          <Link to="/reports" className="btn btn-secondary btn-sm inline-flex items-center gap-1.5">
            <ArrowLeftIcon className="h-4 w-4" /> Back
          </Link>
        </div>
      </div>

      {/* Status row */}
      <div className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3 print:shadow-none">
        <span className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>Status:</span>
        {isEditing ? (
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={editedStatus}
              onChange={e => setEditedStatus(e.target.value)}
              className="select text-sm"
            >
              {Object.values(REPORT_STATUS).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <button onClick={handleStatusUpdate} className="btn btn-primary btn-sm">Save</button>
            <button onClick={() => setIsEditing(false)} className="btn btn-secondary btn-sm">Cancel</button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className={`badge ${getStatusColor(report.status)}`}>{report.status}</span>
            <button
              onClick={() => setIsEditing(true)}
              className="btn-icon"
              title="Edit status"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Patient & Test info — 2-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Patient details */}
        <div className="card p-5 print:shadow-none">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold" style={{ background: 'var(--primary-bg)', color: 'var(--primary-txt)' }}>
              {patientName.charAt(0).toUpperCase()}
            </span>
            Patient Information
          </h2>
          <dl className="space-y-3">
            <div className="detail-row">
              <dt className="detail-label">Patient ID</dt>
              <dd className="detail-value font-medium" style={{ color: 'var(--primary)' }}>{report.patientInfo?.patientId || 'N/A'}</dd>
            </div>
            <div className="detail-row">
              <dt className="detail-label">Full Name</dt>
              <dd className="detail-value">{report.patientInfo?.name || 'N/A'}</dd>
            </div>
            <div className="detail-row">
              <dt className="detail-label">Age</dt>
              <dd className="detail-value">{report.patientInfo?.age || 'N/A'}</dd>
            </div>
            <div className="detail-row">
              <dt className="detail-label">Gender</dt>
              <dd className="detail-value capitalize">{report.patientInfo?.gender || 'N/A'}</dd>
            </div>
            <div className="detail-row">
              <dt className="detail-label">Phone</dt>
              <dd className="detail-value">{report.patientInfo?.contact?.phone || 'N/A'}</dd>
            </div>
          </dl>
        </div>

        {/* Test / sample details */}
        <div className="card p-5 print:shadow-none">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <BeakerIcon className="h-5 w-5" style={{ color: 'var(--primary)' }} />
            Test &amp; Sample Details
          </h2>
          <dl className="space-y-3">
            <div className="detail-row">
              <dt className="detail-label">Test Name</dt>
              <dd className="detail-value font-medium">{report.testInfo?.name || 'N/A'}</dd>
            </div>
            <div className="detail-row">
              <dt className="detail-label">Category</dt>
              <dd className="detail-value">{report.testInfo?.category || 'N/A'}</dd>
            </div>
            <div className="detail-row">
              <dt className="detail-label">Collection Date</dt>
              <dd className="detail-value">{formatDate(report.testInfo?.sampleCollectionDate) || 'N/A'}</dd>
            </div>
            <div className="detail-row">
              <dt className="detail-label">Reference Doctor</dt>
              <dd className="detail-value">{report.testInfo?.referenceDoctor || 'Not specified'}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Results table */}
      <div className="card overflow-hidden print:shadow-none">
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>Test Parameters</h2>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Parameter</th>
                <th>Result</th>
                <th>Unit</th>
                <th>Reference Range</th>
              </tr>
            </thead>
            <tbody>
              {report.results && report.results.length > 0 ? (
                report.results.map((param, index) => {
                  const isAbnormal = isOutsideRange(param.value, param.referenceRange, report.patientInfo?.gender);
                  return (
                    <tr
                      key={index}
                      className={isAbnormal ? 'dark:bg-red-900/20' : 'dark:bg-slate-800/30'}
                      style={isAbnormal ? { background: 'rgba(239,68,68,0.07)' } : undefined}
                    >
                      <td className="text-sm" style={{ color: 'var(--text-muted)' }}>{index + 1}</td>
                      <td className="font-medium text-sm" style={{ color: 'var(--text)' }}>
                        {param.parameter || param.name}
                      </td>
                      <td className={`text-sm ${isAbnormal ? 'font-bold' : ''}`}
                        style={{ color: isAbnormal ? '#ef4444' : 'var(--text)' }}>
                        {isAbnormal && (
                          <ExclamationTriangleIcon className="inline h-4 w-4 mr-1 text-red-500" />
                        )}
                        {param.value}
                      </td>
                      <td className="text-sm" style={{ color: 'var(--text-2)' }}>{param.unit || '—'}</td>
                      <td className="text-sm" style={{ color: 'var(--text-2)' }}>{param.referenceRange || '—'}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center">
                    <BeakerIcon className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No test parameters available</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      {report.notes && (
        <div className="card p-5 print:shadow-none">
          <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text)' }}>Additional Notes</h2>
          <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text-2)' }}>{report.notes}</p>
        </div>
      )}
    </div>
  );
}
