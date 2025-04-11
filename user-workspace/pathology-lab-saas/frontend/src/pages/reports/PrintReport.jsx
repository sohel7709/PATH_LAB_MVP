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
      // Use html2canvas to capture the report
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 800,
        windowHeight: 1200,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
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
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calculate the ratio to fit the image within the PDF page
      // We're using a slightly smaller area to ensure margins are respected
      const ratio = Math.min((pdfWidth) / imgWidth, (pdfHeight) / imgHeight);
      
      // Center the image horizontally
      const imgX = 0;
      const imgY = 0;
      
      // Add the image to the PDF
      pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
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
        className="mt-8 bg-white shadow-sm print:shadow-none print:mt-0 print-report-container"
        style={{
          maxWidth: '210mm', // A4 width
          margin: '0 auto',
          pageBreakInside: 'avoid'
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
              }
              
              @page {
                size: A4 portrait;
                margin: 0;
              }
            }
          `}
        </style>
        <ReportTemplate reportData={reportData} />
      </div>
    </div>
  );
}
