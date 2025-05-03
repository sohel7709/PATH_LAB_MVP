import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExclamationCircleIcon, PrinterIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { reports as apiReports } from '../../utils/api'; // Removed labReportSettings import
import { useReportGenerator } from '../../hooks/useReportGenerator'; // Import the generator hook
import { useReportPdf } from '../../hooks/useReportPdf'; // Import the PDF hook

export default function PrintReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  // const [labSettings, setLabSettings] = useState(null); // No longer needed directly here
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const reportRef = useRef(null); // Ref for the container div (keep if needed for other purposes)

  // Use the custom hooks
  const reportHtml = useReportGenerator(report); // Get HTML string from the hook
  const { printPdf, downloadPdf, isPrinting, isDownloading } = useReportPdf(report, reportHtml); // Get PDF functions and states

  // Define fetchReportData function (only fetches report now)
  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      setError(''); // Clear previous errors

      // Fetch the report data
      const reportResponse = await apiReports.getById(id);
      console.log("PrintReport - Raw API response:", reportResponse); // DEBUG LOG 1
      const reportData = reportResponse.data || reportResponse;
      console.log("PrintReport - Extracted reportData:", JSON.stringify(reportData, null, 2)); // DEBUG LOG 2

      // Fetch the lab settings - STILL NEEDED for useReportGenerator implicitly via report object
      // const labId = reportData.lab; // Assuming reportData contains lab ID
      // if (labId) {
      //   const settingsResponse = await apiLabSettings.getSettings(labId);
      //   const settingsData = settingsResponse.data || settingsResponse;
      //   // NOTE: We don't set labSettings state anymore, but the report object might need it
      //   // If useReportGenerator needs specific settings not in the main report object,
      //   // we might need to pass them separately or adjust the hook.
      //   // For now, assuming 'report' contains all necessary info.
      // } else {
      //   console.warn("Lab ID not found in report data, cannot fetch settings.");
      // }

      setReport(reportData);
      // setLabSettings(settingsData); // No longer needed here

    } catch (err) {
      console.error('Error fetching report:', err); // Updated error message
      setError(err.message || 'Failed to load report');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchReportData();
  }, [id]);

  // REMOVED: isOutsideRange function (moved to utils)
  // REMOVED: prepareReportData function (moved to useReportGenerator hook)
  // REMOVED: buildPrintHtmlStructure function (moved to useReportGenerator hook)
  // REMOVED: useEffect for generating reportHtml (handled by useReportGenerator hook)
  // REMOVED: handlePrint function (moved to useReportPdf hook)
  // REMOVED: handleDownload function (moved to useReportPdf hook)


  // Render loading state
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{error}</h3>
          </div>
        </div>
      </div>
    );
  }

  // Render message if report state is still null after loading
  if (!report) {
     return <div>Loading report data...</div>;
  }

  // Main component return statement
  return (
    <div>
      {/* Header - Hidden when printing */}
      <div className="md:flex md:items-center md:justify-between print:hidden">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Print Report
          </h2>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <button
            type="button"
            onClick={() => navigate(`/reports/${id}/edit`)}
            className="btn-secondary mr-3"
          >
            Edit Report
          </button>
          <button
            type="button"
            onClick={downloadPdf} // Use function from hook
            disabled={isDownloading}
            className={`btn-secondary mr-3 ${isDownloading ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            <ArrowDownTrayIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            {isDownloading ? 'Downloading...' : 'Download PDF'}
          </button>
          <button
            type="button"
            onClick={printPdf} // Use function from hook
            disabled={isPrinting}
            className={`btn-primary ${isPrinting ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            <PrinterIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            {isPrinting ? 'Printing...' : 'Print'}
          </button>
        </div>
      </div>

      {/* Report Options - Hidden when printing */}
      <div className="mt-4 bg-white p-4 rounded-lg shadow-sm print:hidden">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Report Options</h3>
        <div className="flex flex-wrap gap-6">
           {/* Removed Show Header/Footer/Signature options as layout is now fixed */}
           <div className="text-sm text-gray-500 italic">
             Print preview below uses the fixed report layout.
           </div>
        </div>
      </div>

      {/* Printable Report Preview Area */}
      <div
        ref={reportRef} // Keep ref on the outer container if needed elsewhere
        className="mt-8 bg-white shadow-sm print:shadow-none print:mt-0" 
        // Apply A4 dimensions and centering for preview
        style={{ 
           width: '210mm', 
           minHeight: '297mm', // Use minHeight for preview
           margin: '0 auto' 
           // overflow: 'hidden' // REMOVED: This can interfere with fixed positioning inside
         }}
         // Render the generated HTML string for preview
        dangerouslySetInnerHTML={{ __html: reportHtml }} 
      >
        {/* Removed inline style tag and ReportTemplate component */}
      </div>
    </div>
  ); // End of main return statement
} // End of PrintReport component
