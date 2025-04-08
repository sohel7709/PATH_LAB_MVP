import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExclamationCircleIcon, PrinterIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { reports } from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function PrintReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const reportRef = useRef(null);

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const data = await reports.getById(id);
      setReport(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
      
      // Update report status to indicate it was printed
      updateReportStatus('printed');
    }, 500);
  };

  const handleDownload = async () => {
    if (!reportRef.current) return;
    
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;
      
      pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`Report_${id}.pdf`);
      
      // Update report status to indicate it was downloaded
      updateReportStatus('downloaded');
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const updateReportStatus = async (action) => {
    try {
      // Only update if we have a report
      if (!report) return;
      
      // Create a copy of the report with updated audit information
      const updatedReport = {
        ...report,
        auditTrail: [
          ...(report.auditTrail || []),
          {
            action: action,
            timestamp: new Date().toISOString(),
            user: 'current-user' // In a real app, this would be the current user's ID
          }
        ]
      };
      
      // Update the report
      await reports.update(id, updatedReport);
    } catch (err) {
      console.error(`Error updating report ${action} status:`, err);
    }
  };

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

  if (!report) {
    return <div>Report not found</div>;
  }

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
            onClick={() => navigate(`/reports/${id}`)}
            className="btn-secondary mr-3"
          >
            Back to Report
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className={`btn-secondary mr-3 ${isDownloading ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            <ArrowDownTrayIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            {isDownloading ? 'Downloading...' : 'Download PDF'}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            disabled={isPrinting}
            className={`btn-primary ${isPrinting ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            <PrinterIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            {isPrinting ? 'Printing...' : 'Print'}
          </button>
        </div>
      </div>

      {/* Printable Report */}
      <div 
        ref={reportRef}
        className="mt-8 bg-white p-8 shadow-sm print:shadow-none print:p-0 print:mt-0"
      >
        {/* Report Header */}
        <div className="border-b border-gray-200 pb-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">LABORATORY REPORT</h1>
              <p className="text-sm text-gray-500">Report ID: {report.id}</p>
            </div>
            <div className="text-right">
              <img 
                src="/logo.svg" 
                alt="Lab Logo" 
                className="h-12 w-auto inline-block" 
              />
              <p className="text-sm font-semibold mt-2">Pathology Lab Services</p>
              <p className="text-xs text-gray-500">123 Medical Center Drive</p>
              <p className="text-xs text-gray-500">Phone: (555) 123-4567</p>
            </div>
          </div>
        </div>

        {/* Patient Information */}
        <div className="mt-6 border-b border-gray-200 pb-5">
          <h2 className="text-lg font-medium text-gray-900">Patient Information</h2>
          <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <p className="text-sm font-medium text-gray-500">Patient Name</p>
              <p className="mt-1 text-sm text-gray-900">{report.patientName || report.patientInfo?.name || 'N/A'}</p>
            </div>
            <div className="sm:col-span-1">
              <p className="text-sm font-medium text-gray-500">Age</p>
              <p className="mt-1 text-sm text-gray-900">{report.patientAge || report.patientInfo?.age || 'N/A'}</p>
            </div>
            <div className="sm:col-span-1">
              <p className="text-sm font-medium text-gray-500">Gender</p>
              <p className="mt-1 text-sm text-gray-900">
                {report.patientGender 
                  ? report.patientGender.charAt(0).toUpperCase() + report.patientGender.slice(1) 
                  : report.patientInfo?.gender 
                    ? report.patientInfo.gender.charAt(0).toUpperCase() + report.patientInfo.gender.slice(1) 
                    : 'N/A'}
              </p>
            </div>
            <div className="sm:col-span-1">
              <p className="text-sm font-medium text-gray-500">Phone</p>
              <p className="mt-1 text-sm text-gray-900">{report.patientPhone || report.patientInfo?.contact?.phone || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Test Information */}
        <div className="mt-6 border-b border-gray-200 pb-5">
          <h2 className="text-lg font-medium text-gray-900">Test Information</h2>
          <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-2">
              <p className="text-sm font-medium text-gray-500">Test Name</p>
              <p className="mt-1 text-sm text-gray-900">{report.testName || report.testInfo?.name || 'N/A'}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm font-medium text-gray-500">Category</p>
              <p className="mt-1 text-sm text-gray-900">{report.category || report.testInfo?.category || 'N/A'}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm font-medium text-gray-500">Collection Date</p>
              <p className="mt-1 text-sm text-gray-900">
                {report.collectionDate 
                  ? formatDate(report.collectionDate)
                  : report.testInfo?.sampleCollectionDate 
                    ? formatDate(report.testInfo.sampleCollectionDate) 
                    : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="mt-6 border-b border-gray-200 pb-5">
          <h2 className="text-lg font-medium text-gray-900">Test Results</h2>
          <div className="mt-4 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Parameter</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Value</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Unit</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Reference Range</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {report.testParameters && report.testParameters.length > 0 ? (
                  report.testParameters.map((param, index) => (
                    <tr key={index}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{param.name}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{param.value}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{param.unit}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{param.referenceRange}</td>
                    </tr>
                  ))
                ) : report.results && report.results.length > 0 ? (
                  report.results.map((param, index) => (
                    <tr key={index}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{param.parameter}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{param.value}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{param.unit}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{param.referenceRange}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-4 text-center text-sm text-gray-500">No test parameters available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes */}
        {((report.notes && report.notes.length > 0) || (report.comments && report.comments.length > 0)) && (
          <div className="mt-6 border-b border-gray-200 pb-5">
            <h2 className="text-lg font-medium text-gray-900">Notes</h2>
            <div className="mt-4">
              {report.notes && (
                <div className="mb-4">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{report.notes}</p>
                </div>
              )}
              
              {report.comments && report.comments.length > 0 && report.comments.map((comment, index) => (
                <div key={index} className="mb-2">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{comment.text}</p>
                  <p className="text-xs text-gray-500">{formatDate(comment.timestamp)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-5">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Report Status: <span className="font-medium">{report.status}</span></p>
              <p className="text-sm text-gray-500">Report Date: {formatDate(report.createdAt)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Authorized Signature</p>
              <div className="mt-4 h-10 w-40 border-b border-gray-300"></div>
              <p className="mt-1 text-sm text-gray-500">Lab Technician</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
