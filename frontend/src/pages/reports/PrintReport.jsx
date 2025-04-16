import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExclamationCircleIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { reports, labReportSettings } from '../../utils/api';
import ReportTemplate from '../../components/reports/ReportTemplate';

export default function PrintReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [labSettings, setLabSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPrinting] = useState(false);
  // Removed isDownloading state
  // Removed isDownloadingServerPdf state as it's no longer needed
  const [showHeader, setShowHeader] = useState(true);
  const [showFooter, setShowFooter] = useState(true);
  const reportRef = useRef(null);

  useEffect(() => {
    fetchReportData();
  }, [id]);

  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch the report data
      const reportResponse = await reports.getById(id);
      const reportData = reportResponse.data || reportResponse;
      
      // Fetch the lab settings
      const labId = reportData.lab;
      const settingsResponse = await labReportSettings.getSettings(labId);
      const settingsData = settingsResponse.data || settingsResponse;
      
      setReport(reportData);
      setLabSettings(settingsData);
      setError('');
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError(err.message || 'Failed to load report');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };
  
  // Removed PDF download functions

  // Prepare the data for the ReportTemplate component
  const prepareReportData = () => {
    if (!report || !labSettings) return null;
    
    return {
      // Header data
      headerImage: labSettings.header?.headerImage || '',
      labName: labSettings.header?.labName || 'Pathology Laboratory',
      doctorName: labSettings.header?.doctorName || 'Dr. Consultant',
      address: labSettings.header?.address || '',
      phone: labSettings.header?.phone || '',
      showHeader: showHeader,
      
      // Patient data
      patientName: report.patientInfo?.name || 'N/A',
      patientAge: report.patientInfo?.age || 'N/A',
      patientGender: report.patientInfo?.gender || 'N/A',
      patientId: report.patientInfo?.patientId || report._id?.substring(0, 8) || 'N/A',
      
      // Sample data
      sampleCollectionDate: new Date(report.testInfo?.sampleCollectionDate || report.createdAt).toLocaleDateString(),
      sampleType: report.testInfo?.sampleType || 'Blood',
      referringDoctor: report.testInfo?.referenceDoctor || 'N/A',
      
      // Test data
      testName: report.testInfo?.name || 'COMPLETE BLOOD COUNT (CBC)',
      testResults: report.results?.map(param => ({
        name: param.parameter || param.name,
        result: param.value,
        unit: param.unit,
        referenceRange: param.referenceRange,
        isAbnormal: param.flag === 'high' || param.flag === 'low' || param.flag === 'critical'
      })) || [],
      
      // Signature data
      signatureImage: labSettings.footer?.signature || '',
      verifiedBy: labSettings.footer?.verifiedBy || 'Consultant',
      designation: labSettings.footer?.designation || 'Pathologist',
      
      // Footer data
      footerImage: labSettings.footer?.footerImage || '',
      showFooter: showFooter,
      
      // Styling
      styling: labSettings.styling || {
        primaryColor: '#007bff',
        secondaryColor: '#6c757d',
        fontFamily: 'Arial, sans-serif',
        fontSize: 12
      }
    };
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

  const reportData = prepareReportData();
  
  if (!reportData) {
    return <div>Failed to prepare report data</div>;
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
            onClick={() => navigate(`/reports/${id}/edit`)}
            className="btn-secondary mr-3"
          >
            Edit Report
          </button>
          {/* Download PDF button removed as per user request */}
          {/* Removed Client PDF Download Button */}
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

      {/* Report Options - Hidden when printing */}
      <div className="mt-4 bg-white p-4 rounded-lg shadow-sm print:hidden">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Report Options</h3>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center">
            <input
              id="showHeader"
              name="showHeader"
              type="checkbox"
              checked={showHeader}
              onChange={(e) => setShowHeader(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="showHeader" className="ml-2 block text-sm text-gray-900">
              Show Header
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="showFooter"
              name="showFooter"
              type="checkbox"
              checked={showFooter}
              onChange={(e) => setShowFooter(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="showFooter" className="ml-2 block text-sm text-gray-900">
              Show Footer
            </label>
          </div>
          <div className="text-sm text-gray-500 italic">
            Note: Header and footer will only be shown if they are configured in lab settings
          </div>
        </div>
      </div>

      {/* Printable Report */}
      <div 
        ref={reportRef}
        className="mt-8 bg-white shadow-sm print:shadow-none print:mt-0 print-report-container"
        style={{
          width: '100%', // Full width
          maxWidth: '210mm', // A4 width
          margin: '0 auto',
          pageBreakInside: 'avoid',
          boxSizing: 'border-box',
          padding: '0',
          border: '1px solid #eee'
        }}
      >
        <style>
          {`
            @media print {
              .print-report-container {
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                page-break-after: avoid !important;
                page-break-before: avoid !important;
              }
              
              @page {
                size: A4 portrait;
                margin: 0 !important;
                padding: 0 !important;
              }
              
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                height: 100% !important;
                overflow: hidden !important;
              }
              
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
                font-size: 10pt !important;
              }
              
              /* Ensure header image uses full width */
              .header-image {
                width: 100% !important;
                max-width: 100% !important;
                height: 480px !important; /* 480px @ 300 DPI */
                object-fit: contain !important;
              }
              
              /* Ensure header and footer containers use full width */
              .report-header, .footer {
                width: 100% !important;
                text-align: center !important;
                display: block !important;
              }
              
              /* Hide placeholders when printing */
              .header-warning, .footer-warning {
                display: none !important;
              }
              
              /* Force single page */
              * {
                page-break-inside: avoid !important;
              }
              
              /* Ensure content fits on one page */
              .report-content {
                position: absolute !important;
                top: 480px !important; /* 480px @ 300 DPI */
                bottom: 200px !important; /* 200px @ 300 DPI */
                left: 0 !important;
                right: 0 !important;
                padding: 5mm !important;
                overflow: hidden !important;
                min-height: 2828px !important; /* 2828px @ 300 DPI */
              }
              
              /* Fixed header */
              .report-header {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                height: 480px !important; /* 480px @ 300 DPI */
                z-index: 100 !important;
              }
              
              /* Fixed footer */
              .footer {
                position: fixed !important;
                bottom: 0 !important;
                left: 0 !important;
                right: 0 !important;
                height: 200px !important; /* 200px @ 300 DPI */
                z-index: 100 !important;
              }
            }
          `}
        </style>
        <ReportTemplate reportData={reportData} />
      </div>
    </div>
  );
}
