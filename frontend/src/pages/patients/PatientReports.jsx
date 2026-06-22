import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  EyeIcon,
  PrinterIcon,
  DocumentMagnifyingGlassIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/helpers';
import { DATE_FORMATS } from '../../utils/constants';

const statusColors = {
  verified: 'badge-green',
  completed: 'badge-blue',
  pending: 'badge-yellow',
};

export default function PatientReports() {
  const { id: patientMongoId } = useParams();
  const [patient, setPatient] = useState(null);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPatientAndReports = async () => {
      if (!patientMongoId) {
        setError('Patient ID is missing from URL.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setPatient(null);
      setReports([]);

      try {
        const { default: api } = await import('../../utils/api');
        let patientStringIdToUse = null;

        try {
          const patientData = await api.patients.getById(patientMongoId);
          setPatient(patientData);
          if (patientData && patientData.patientId) {
            patientStringIdToUse = patientData.patientId;
          } else {
            setError('Patient string ID not found. Cannot fetch reports.');
          }
        } catch (patientFetchError) {
          setError(patientFetchError.message || 'Failed to fetch patient details.');
        }

        if (patientStringIdToUse && !error) {
          try {
            const reportsResponse = await api.reports.getByPatientId(patientStringIdToUse);
            setReports(reportsResponse.data.sort((a, b) => new Date(b.reportDate) - new Date(a.reportDate)));
          } catch (reportsFetchError) {
            setError(reportsFetchError.message || 'Failed to fetch reports.');
          }
        }
      } catch (generalError) {
        setError(generalError.message || 'An unexpected error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatientAndReports();
  }, [patientMongoId]);

  if (isLoading) {
    return (
      <div className="page-enter max-w-4xl mx-auto px-4 py-6 space-y-4">
        <div className="skeleton h-10 rounded-lg w-1/2" />
        <div className="card overflow-hidden">
          <div className="skeleton h-14 rounded-none" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className="skeleton h-4 rounded flex-1" />
              <div className="skeleton h-4 rounded w-24" />
              <div className="skeleton h-6 rounded-full w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && reports.length === 0) {
    return (
      <div className="page-enter max-w-4xl mx-auto px-4 py-6">
        <div className="alert alert-error flex items-start gap-3">
          <ExclamationCircleIcon className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
        <Link
          to={patientMongoId ? `/patients/${patientMongoId}/details` : '/patients'}
          className="btn btn-secondary mt-4 inline-flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {patientMongoId ? 'Back to Patient Details' : 'Back to Patient List'}
        </Link>
      </div>
    );
  }

  return (
    <div className="page-enter max-w-4xl mx-auto px-4 py-6 space-y-5">
      {/* Back link */}
      <Link
        to={`/patients/${patientMongoId}/details`}
        className="inline-flex items-center gap-1.5 text-sm font-medium"
        style={{ color: 'var(--primary)' }}
      >
        <ArrowLeftIcon className="h-4 w-4" /> Back to Patient Details
      </Link>

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            Reports for {patient ? patient.fullName : 'Patient'}
          </h1>
          {patient && (
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Patient ID: {patient.patientId || 'N/A'}
            </p>
          )}
        </div>
        <Link
          to={`/reports/create?patientId=${patientMongoId}`}
          className="btn btn-primary inline-flex items-center gap-1.5 shrink-0"
        >
          <PlusIcon className="h-4 w-4" /> Create Report
        </Link>
      </div>

      {/* Inline error if reports partially loaded */}
      {error && reports.length > 0 && (
        <div className="alert alert-error text-sm">{error}</div>
      )}

      {/* Content */}
      <div className="card overflow-hidden">
        {/* Empty state */}
        {!error && reports.length === 0 && (
          <div className="empty-state py-16">
            <DocumentMagnifyingGlassIcon className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="font-medium" style={{ color: 'var(--text)' }}>No Reports Found</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              This patient does not have any reports yet.
            </p>
            <Link
              to={`/reports/create?patientId=${patientMongoId}`}
              className="btn btn-primary btn-sm mt-4"
            >
              Create New Report
            </Link>
          </div>
        )}

        {/* Table */}
        {reports.length > 0 && (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Test</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(report => (
                  <tr key={report._id}>
                    <td className="text-sm whitespace-nowrap" style={{ color: 'var(--text-2)' }}>
                      {formatDate(report.testInfo?.sampleCollectionDate || report.createdAt, DATE_FORMATS.DD_MM_YYYY)}
                    </td>
                    <td>
                      <Link
                        to={`/reports/${report._id}`}
                        className="text-sm font-medium hover:underline"
                        style={{ color: 'var(--primary)' }}
                      >
                        {report.testInfo?.name || `Report ID: ${report.reportId || report._id}`}
                      </Link>
                    </td>
                    <td>
                      <span className={`badge ${statusColors[report.status] || 'badge-gray'} capitalize`}>
                        {report.status || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
