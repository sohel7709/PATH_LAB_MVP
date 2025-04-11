import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExclamationCircleIcon, PrinterIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
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
  const [isDownloading, setIsDownloading] = useState(false);
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

  const handleDownload = async () => {
    if (!reportRef.current) return;
    
    setIsDownloading(true);
    try {
      // Create a clone of the report element to modify for PDF generation
      const reportClone = reportRef.current.cloneNode(true);
      
      // Find and remove warning messages in the clone
      const warningElements = reportClone.querySelectorAll('.header-warning, .footer-warning');
      warningElements.forEach(el => {
        // Replace warning with empty space div of same height
        const emptySpace = document.createElement('div');
        emptySpace.style.height = '50px'; // Reduced height
        emptySpace.style.width = '100%';
        el.parentNode.replaceChild(emptySpace, el);
      });
      
      // Also remove placeholder elements
      const placeholderElements = reportClone.querySelectorAll('.report-header-placeholder, .report-footer-placeholder');
      placeholderElements.forEach(el => el.remove());
      
      // Apply optimizations for single-page PDF
      reportClone.style.width = '210mm'; // A4 width
      reportClone.style.margin = '0';
      reportClone.style.padding = '5mm'; // Reduced padding
      reportClone.style.boxSizing = 'border-box';
      reportClone.style.backgroundColor = '#ffffff';
      reportClone.style.fontSize = '9pt'; // Smaller font size
      
      // Ensure header image uses full width
      const headerImage = reportClone.querySelector('.header-image');
      if (headerImage) {
        headerImage.style.width = '100%';
        headerImage.style.maxWidth = '100%';
        headerImage.style.maxHeight = '20mm';
        headerImage.style.objectFit = 'contain';
      }
      
      // Ensure header and footer containers use full width
      const headerContainer = reportClone.querySelector('.report-header');
      if (headerContainer) {
        headerContainer.style.width = '100%';
        headerContainer.style.textAlign = 'center';
      }
      
      const footerContainer = reportClone.querySelector('.footer');
      if (footerContainer) {
        footerContainer.style.width = '100%';
        footerContainer.style.textAlign = 'center';
      }
      
      // Reduce spacing in the report
      const tableElements = reportClone.querySelectorAll('table');
      tableElements.forEach(table => {
        table.style.fontSize = '8pt';
        const cells = table.querySelectorAll('td, th');
        cells.forEach(cell => {
          cell.style.padding = '3px';
        });
      });
      
      // Reduce margins and spacing
      const patientInfo = reportClone.querySelector('.patient-info');
      if (patientInfo) {
        patientInfo.style.margin = '2mm 0';
        patientInfo.style.padding = '2mm 0';
      }
      
      const signatureSection = reportClone.querySelector('.signature-section');
      if (signatureSection) {
        signatureSection.style.margin = '5mm 0 3mm 0';
      }
      
      // Temporarily add the clone to the document to capture it
      reportClone.style.position = 'absolute';
      reportClone.style.left = '-9999px';
      document.body.appendChild(reportClone);
      
      // Use html2canvas to capture the modified report
      const canvas = await html2canvas(reportClone, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        windowWidth: 800,
        windowHeight: 1100, // Reduced height
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      // Remove the clone from the document
      document.body.removeChild(reportClone);
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      // Set PDF properties
      pdf.setProperties({
        title: `Medical Report - ${report.patientInfo?.name || 'Patient'}`,
        subject: `${report.testInfo?.name || 'Medical Test'} Report`,
        creator: 'Pathology Lab System',
        author: report.lab?.name || 'Medical Laboratory'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      
      // Scale the image to fit on a single page
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calculate the aspect ratio of the image
      const aspectRatio = imgHeight / imgWidth;
      
      // Calculate the height based on the width to ensure it fits on one page
      const pdfHeight = pdfWidth * aspectRatio;
      
      // Add the image to the PDF with proper dimensions
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      
      // Use patient name for the filename if available
      const patientName = report.patientInfo?.name || `Patient_${id}`;
      const testName = report.testInfo?.name?.replace(/\s+/g, '_') || 'Medical_Test';
      const date = new Date().toISOString().split('T')[0];
      const safePatientName = patientName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      
      pdf.save(`${safePatientName}_${testName}_${date}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

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
                margin: 5mm !important;
              }
              
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
                font-size: 9pt !important;
              }
              
              /* Ensure header image uses full width */
              .header-image {
                width: 100% !important;
                max-width: 100% !important;
                max-height: 20mm !important;
                object-fit: contain !important;
              }
              
              /* Ensure header and footer containers use full width */
              .report-header, .footer {
                width: 100% !important;
                text-align: center !important;
                display: block !important;
              }
              
              /* Hide placeholders when printing */
              .report-header-placeholder, .report-footer-placeholder {
                display: none !important;
              }
              
              /* Force single page */
              * {
                page-break-inside: avoid !important;
              }
            }
          `}
        </style>
        <ReportTemplate reportData={reportData} />
      </div>
    </div>
  );
}
