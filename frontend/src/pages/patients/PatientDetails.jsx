import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PencilIcon,
  DocumentTextIcon,
  EyeIcon,
  PrinterIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  UserIcon,
  CalendarIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/helpers';
import { DATE_FORMATS } from '../../utils/constants';

const statusColors = {
  verified: 'badge-green',
  completed: 'badge-blue',
  pending: 'badge-yellow',
};

export default function PatientDetails() {
  const { id: patientMongoId } = useParams();
  const [patient, setPatient] = useState(null);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState(null);

  useEffect(() => {
    const fetchDetailsAndReports = async () => {
      if (!patientMongoId) return;
      setIsLoading(true);
      setReportsLoading(true);
      setError(null);
      setPatient(null);
      setReports([]);

      try {
        const { default: api } = await import('../../utils/api');
        const patientData = await api.patients.getById(patientMongoId);
        setPatient(patientData);

        if (patientData && patientData.patientId) {
          try {
            const reportsResponse = await api.reports.getByPatientId(patientData.patientId);
            setReports(reportsResponse.data);
            setReportsError(null);
          } catch (reportsErrInner) {
            setReportsError(reportsErrInner.message || 'Failed to fetch patient reports');
          }
        } else if (patientData) {
          setReports([]);
          setReportsError('Patient string ID not found.');
        } else {
          setError('Patient not found.');
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch patient details.');
      } finally {
        setIsLoading(false);
        setReportsLoading(false);
      }
    };

    fetchDetailsAndReports();
  }, [patientMongoId]);

  if (isLoading) {
    return (
      <div className="page-enter max-w-4xl mx-auto px-4 py-8 space-y-4">
        <div className="skeleton h-24 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="skeleton h-40 rounded-xl" />
          <div className="skeleton h-40 rounded-xl" />
        </div>
        <div className="skeleton h-48 rounded-xl" />
      </div>
    );
  }

  if (error && !patient) {
    return (
      <div className="page-enter max-w-4xl mx-auto px-4 py-8">
        <div className="alert alert-error flex items-start gap-3">
          <ExclamationCircleIcon className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error loading patient</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
        <Link to="/patients" className="btn btn-secondary mt-4 inline-flex items-center gap-2">
          <ArrowLeftIcon className="h-4 w-4" /> Back to Patient List
        </Link>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="page-enter max-w-4xl mx-auto px-4 py-8">
        <div className="empty-state">
          <UserIcon className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-medium" style={{ color: 'var(--text)' }}>Patient not found</p>
          <Link to="/patients" className="btn btn-primary mt-4">Back to Patient List</Link>
        </div>
      </div>
    );
  }

  const initials = (patient.fullName || 'P')
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="page-enter max-w-4xl mx-auto px-4 py-6 space-y-5">
      {/* Back link */}
      <Link to="/patients" className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--primary)' }}>
        <ArrowLeftIcon className="h-4 w-4" /> Back to Patient List
      </Link>

      {/* Patient header card */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0 h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold text-white"
            style={{ background: 'var(--primary)' }}>
            {initials}
          </div>
          {/* Name + badges */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate" style={{ color: 'var(--text)' }}>{patient.fullName}</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>ID: {patient.patientId || 'N/A'}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {patient.age && (
                <span className="badge badge-gray">{patient.age} yrs</span>
              )}
              {patient.gender && (
                <span className="badge badge-blue capitalize">{patient.gender}</span>
              )}
              {patient.phone && (
                <span className="badge badge-gray flex items-center gap-1">
                  <PhoneIcon className="h-3 w-3" />{patient.phone}
                </span>
              )}
            </div>
          </div>
          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link to={`/patients/${patient._id}/edit`} className="btn btn-secondary btn-sm inline-flex items-center gap-1.5">
              <PencilIcon className="h-4 w-4" /> Edit
            </Link>
            <Link to={`/reports/create?patientId=${patient._id}`} className="btn btn-primary btn-sm inline-flex items-center gap-1.5">
              <DocumentTextIcon className="h-4 w-4" /> Create Report
            </Link>
          </div>
        </div>
      </div>

      {/* Info cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact Info */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <PhoneIcon className="h-4 w-4" /> Contact Info
          </h2>
          <dl className="space-y-3">
            <div className="detail-row">
              <dt className="detail-label flex items-center gap-1"><EnvelopeIcon className="h-3.5 w-3.5" /> Email</dt>
              <dd className="detail-value">{patient.email || 'N/A'}</dd>
            </div>
            <div className="detail-row">
              <dt className="detail-label flex items-center gap-1"><PhoneIcon className="h-3.5 w-3.5" /> Phone</dt>
              <dd className="detail-value">{patient.phone || 'N/A'}</dd>
            </div>
            <div className="detail-row">
              <dt className="detail-label flex items-center gap-1"><MapPinIcon className="h-3.5 w-3.5" /> Address</dt>
              <dd className="detail-value">{patient.address || 'N/A'}</dd>
            </div>
          </dl>
        </div>

        {/* Medical Info */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <UserIcon className="h-4 w-4" /> Medical Info
          </h2>
          <dl className="space-y-3">
            <div className="detail-row">
              <dt className="detail-label">Age</dt>
              <dd className="detail-value">{patient.age || 'N/A'}</dd>
            </div>
            <div className="detail-row">
              <dt className="detail-label">Gender</dt>
              <dd className="detail-value capitalize">{patient.gender || 'N/A'}</dd>
            </div>
            <div className="detail-row">
              <dt className="detail-label flex items-center gap-1"><CalendarIcon className="h-3.5 w-3.5" /> Registered</dt>
              <dd className="detail-value">{formatDate(patient.createdAt, DATE_FORMATS.DD_MM_YYYY)}</dd>
            </div>
            <div className="detail-row">
              <dt className="detail-label">Referred By</dt>
              <dd className="detail-value">{patient.referringDoctor?.name || 'N/A'}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>Recent Reports</h2>
          {reports.length > 0 && (
            <Link to={`/patients/${patientMongoId}/reports`} className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
              View All &rarr;
            </Link>
          )}
        </div>
        <div className="p-5">
          {reportsLoading && (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-12 rounded" />)}
            </div>
          )}
          {reportsError && (
            <div className="alert alert-error text-sm">{reportsError}</div>
          )}
          {!reportsLoading && !reportsError && reports.length === 0 && (
            <div className="empty-state py-8">
              <DocumentTextIcon className="h-10 w-10 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No reports found for this patient.</p>
              <Link to={`/reports/create?patientId=${patient._id}`} className="btn btn-primary btn-sm mt-3">
                Create First Report
              </Link>
            </div>
          )}
          {!reportsLoading && !reportsError && reports.length > 0 && (
            <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {reports.slice(0, 5).map(report => (
                <li key={report._id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      to={`/reports/${report._id}`}
                      className="text-sm font-medium hover:underline"
                      style={{ color: 'var(--primary)' }}
                    >
                      {report.testInfo?.name || `Report ID: ${report.reportId || report._id}`}
                    </Link>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {formatDate(report.testInfo?.sampleCollectionDate || report.createdAt, DATE_FORMATS.DD_MM_YYYY)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`badge ${statusColors[report.status] || 'badge-gray'} capitalize`}>
                      {report.status || 'N/A'}
                    </span>
                    <Link
                      to={`/reports/${report._id}`}
                      className="btn-icon"
                      title="View Report"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Link>
                    <Link
                      to={`/reports/${report._id}/print`}
                      target="_blank"
                      className="btn-icon"
                      title="Print Report"
                    >
                      <PrinterIcon className="h-4 w-4" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
