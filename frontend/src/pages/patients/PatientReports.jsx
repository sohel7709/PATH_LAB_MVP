import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon, EyeIcon, PrinterIcon, DocumentMagnifyingGlassIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/helpers'; // Import shared formatDate
import { DATE_FORMATS } from '../../utils/constants'; // Import DATE_FORMATS

export default function PatientReports() {
  const { id: patientMongoId } = useParams();
  const [patient, setPatient] = useState(null);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPatientAndReports = async () => {
      if (!patientMongoId) {
        setError("Patient ID is missing from URL.");
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

        // Step 1: Fetch patient details
        try {
          const patientData = await api.patients.getById(patientMongoId);
          setPatient(patientData); 
          if (patientData && patientData.patientId) {
            patientStringIdToUse = patientData.patientId;
          } else {
            console.warn('[PatientReports] Patient details fetched, but the string patientId (patient.patientId) is missing.', patientData);
            setError('Patient string ID not found in patient details. Cannot fetch reports.');
            // Do not proceed if this critical ID is missing
          }
        } catch (patientFetchError) {
          console.error('[PatientReports] Error fetching patient details:', patientFetchError);
          setError(patientFetchError.message || 'Failed to fetch patient details.');
          // Do not proceed if patient details fail
        }

        // Step 2: Fetch reports only if we have patientStringIdToUse and no prior error
        if (patientStringIdToUse && !error) { 
          try {
            const reportsResponse = await api.reports.getByPatientId(patientStringIdToUse);
            setReports(reportsResponse.data.sort((a, b) => new Date(b.reportDate) - new Date(a.reportDate)));
          } catch (reportsFetchError) {
            console.error('[PatientReports] Error fetching reports:', reportsFetchError);
            setError(reportsFetchError.message || 'Failed to fetch reports.');
          }
        } else if (!error && !patientStringIdToUse) {
            // This case means patient details were fetched (no error from that step), but string ID was missing.
            // setError was already set in the patient details fetching block.
        }
        // If 'error' is already set from patient fetching, we don't overwrite it unless reports fetching also fails.

      } catch (generalError) {
        console.error('[PatientReports] A general error occurred (e.g., API import failed):', generalError);
        setError(generalError.message || 'An unexpected error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatientAndReports();
  }, [patientMongoId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Display error prominently if it exists
  if (error && reports.length === 0) { // Show error full screen if no reports are loaded due to it
    return (
      <div className="min-h-screen bg-red-50 flex flex-col justify-center items-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-semibold text-red-600 mb-4">Error</h2>
          <p className="text-red-500">{error}</p>
          <Link
            to={patientMongoId ? `/patients/${patientMongoId}/details` : "/patients"}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <ArrowLeftIcon className="mr-2 h-5 w-5" />
            {patientMongoId ? "Back to Patient Details" : "Back to Patient List"}
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            to={`/patients/${patientMongoId}/details`}
            className="inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-800"
          >
            <ArrowLeftIcon className="mr-2 h-5 w-5" />
            Back to Patient Details
          </Link>
        </div>

        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
            <h1 className="text-3xl font-bold text-white">
              Reports for {patient ? patient.fullName : `Patient (Loading...)`}
            </h1>
            {patient && <p className="text-sm text-purple-100 mt-1">Patient System ID: {patient.patientId || 'N/A'}</p>}
            {!patient && !isLoading && <p className="text-sm text-purple-100 mt-1">Could not load patient name.</p>}
          </div>

          <div className="p-6">
            {/* Display error message here if reports couldn't be loaded but patient details might have */}
            {error && <p className="text-red-500 mb-4">Error loading reports: {error}</p>}

            {!error && reports.length === 0 && (
              <div className="text-center py-12">
                <DocumentMagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No Reports Found</h3>
                <p className="mt-1 text-sm text-gray-500">This patient does not have any reports yet.</p>
                <div className="mt-6">
                  <Link
                    to={`/reports/create?patientId=${patientMongoId}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Create New Report
                  </Link>
                </div>
              </div>
            )}
            
            {reports.length > 0 && (
              <div className="flow-root">
                <ul className="-mb-8">
                  {reports.map((report, reportIdx) => (
                    <li key={report._id}>
                      <div className="relative pb-8">
                        {reportIdx !== reports.length - 1 ? (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center ring-8 ring-white">
                              <DocumentTextIcon className="h-5 w-5 text-white" aria-hidden="true" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                <Link to={`/reports/${report._id}/print`} target="_blank" className="hover:underline">
                                  {report.testInfo?.name || `Report ID: ${report.reportId || report._id}`}
                                </Link>
                              </p>
                              <p className="text-sm text-gray-500">
                                Date: {formatDate(report.testInfo?.sampleCollectionDate || report.createdAt, DATE_FORMATS.DD_MM_YYYY)}
                              </p>
                              <p className="text-sm text-gray-500">
                                Status: <span className={`capitalize px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  report.status === 'verified' ? 'bg-green-100 text-green-800' :
                                  report.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                  report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>{report.status || 'N/A'}</span>
                              </p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500 flex items-center space-x-2">
                               <Link
                                to={`/reports/${report._id}/print`} // Changed to print page
                                target="_blank" // Open in new tab
                                className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50 transition-colors"
                                title="View/Print Report"
                              >
                                <EyeIcon className="h-5 w-5" />
                              </Link>
                              <Link
                                to={`/reports/${report._id}/print`}
                                target="_blank"
                                className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-50 transition-colors"
                                title="Print Report"
                              >
                                <PrinterIcon className="h-5 w-5" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
