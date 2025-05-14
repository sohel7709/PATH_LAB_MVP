import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon, PencilIcon, DocumentTextIcon, EyeIcon, PrinterIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/helpers'; // Import shared formatDate
import { DATE_FORMATS } from '../../utils/constants'; // Import DATE_FORMATS

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
      setError(null); // Clear previous errors
      setPatient(null);
      setReports([]);

      try {
        const { default: api } = await import('../../utils/api');
        // Fetch patient details
        const patientData = await api.patients.getById(patientMongoId);
        setPatient(patientData);

        // Fetch patient reports using the string patientId from patientData
        if (patientData && patientData.patientId) {
          try {
            const reportsResponse = await api.reports.getByPatientId(patientData.patientId);
            setReports(reportsResponse.data);
            setReportsError(null);
          } catch (reportsErrInner) {
            setReportsError(reportsErrInner.message || 'Failed to fetch patient reports');
            console.error('Error fetching patient reports:', reportsErrInner);
          }
        } else if (patientData) {
          setReports([]);
          setReportsError('Patient string ID (patientInfo.patientId) not found in patient data to fetch reports.');
          console.warn('Patient data fetched, but patientInfo.patientId is missing:', patientData);
        } else { // patientData is null
            setError('Patient not found.'); // Set error if patientData is null after fetch
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch patient details or reports.');
        console.error('Error fetching patient details or reports:', err);
      } finally {
        setIsLoading(false);
        setReportsLoading(false);
      }
    };

    fetchDetailsAndReports();
  }, [patientMongoId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !patient) { // If there's an error and patient data couldn't be loaded at all
    return (
      <div className="min-h-screen bg-red-50 flex flex-col justify-center items-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-semibold text-red-600 mb-4">Error</h2>
          <p className="text-red-500">{error}</p>
          <Link
            to="/patients"
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <ArrowLeftIcon className="mr-2 h-5 w-5" />
            Back to Patient List
          </Link>
        </div>
      </div>
    );
  }

  if (!patient) { // Should be caught by error state if fetch failed, but as a fallback
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Patient Not Found</h2>
          <p className="text-gray-500">The requested patient could not be found.</p>
          <Link
            to="/patients"
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeftIcon className="mr-2 h-5 w-5" />
            Back to Patient List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            to="/patients"
            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 group"
          >
            <ArrowLeftIcon className="mr-2 h-5 w-5 text-blue-500 group-hover:text-blue-700" />
            Back to Patient List
          </Link>
        </div>

        {/* Patient Information Card */}
        <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200/80">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{patient.fullName}</h1>
                <p className="text-sm text-blue-100 mt-1">Patient ID: {patient.patientId || 'N/A'}</p>
              </div>
              <div className="flex space-x-3 mt-4 sm:mt-0">
                <Link
                  to={`/patients/${patient._id}/edit`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  <PencilIcon className="h-4 w-4 mr-1.5" /> Edit
                </Link>
                <Link
                  to={`/reports/create?patientId=${patient._id}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <DocumentTextIcon className="h-4 w-4 mr-1.5" /> Create Report
                </Link>
              </div>
            </div>
          </div>
          <div className="px-6 py-5 border-t border-gray-200">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{patient.fullName}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{patient.email || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">{patient.phone}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Age</dt>
                <dd className="mt-1 text-sm text-gray-900">{patient.age}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">{patient.gender}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Registered On</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(patient.createdAt, DATE_FORMATS.DD_MM_YYYY)}</dd>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Address</dt>
                <dd className="mt-1 text-sm text-gray-900">{patient.address || 'N/A'}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Referred By Dr.</dt>
                <dd className="mt-1 text-sm text-gray-900">{patient.referringDoctor?.name || 'N/A'}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Previous Reports Section */}
        <div className="mt-8 bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200/80">
          <div className="bg-gradient-to-r from-teal-500 to-green-500 p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Previous Reports</h2>
          </div>
          <div className="p-6">
            {reportsLoading && <div className="py-6"><LoadingSpinner /></div>}
            {reportsError && <p className="text-red-600 bg-red-50 p-3 rounded-md text-sm">{reportsError}</p>}
            {!reportsLoading && !reportsError && reports.length === 0 && (
              <div className="text-center py-8">
                <DocumentTextIcon className="mx-auto h-10 w-10 text-gray-400" />
                <p className="mt-3 text-sm text-gray-500">No reports found for this patient.</p>
              </div>
            )}
            {!reportsLoading && !reportsError && reports.length > 0 && (
              <ul className="divide-y divide-gray-200">
                {reports.map((report) => (
                  <li key={report._id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-grow mb-2 sm:mb-0">
                      <p className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                        <Link to={`/reports/${report._id}/print`} target="_blank" className="hover:underline">
                          {report.testInfo?.name || `Report ID: ${report.reportId || report._id}`}
                        </Link>
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Date: {formatDate(report.testInfo?.sampleCollectionDate || report.createdAt, DATE_FORMATS.DD_MM_YYYY)}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Status: <span className={`capitalize px-1.5 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full ${
                          report.status === 'verified' ? 'bg-green-100 text-green-700' :
                          report.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          report.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>{report.status || 'N/A'}</span>
                      </p>
                    </div>
                    <div className="flex space-x-2 flex-shrink-0 mt-2 sm:mt-0">
                      <Link
                        to={`/reports/${report._id}/print`}
                        target="_blank"
                        className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
                        title="View/Print Report"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </Link>
                      <Link
                        to={`/reports/${report._id}/print`}
                        target="_blank"
                        className="p-1.5 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-full transition-colors"
                        title="Print Report"
                      >
                        <PrinterIcon className="h-5 w-5" />
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
             { !reportsLoading && !reportsError && reports.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 text-right">
                    <Link 
                        to={`/patients/${patientMongoId}/reports`}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                        View All Reports &rarr;
                    </Link>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
