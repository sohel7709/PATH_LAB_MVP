import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExclamationCircleIcon, PrinterIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
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
  const [showHeaderFooter, setShowHeaderFooter] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const reportRef = useRef(null);

  useEffect(() => {
    fetchReportData();
  }, [id]);

  console.log('Lab settings:', labSettings);
  console.log('Error:', error);
  console.log('Is loading:', isLoading);
  console.log('Is printing:', isPrinting);
  console.log('Is downloading:', isDownloading);
  console.log('Show header footer:', showHeaderFooter);

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

  const handlePrint = async () => {
    try {
      if (!reportRef.current) {
        alert('Report content is not available for printing.');
        return;
      }
      
      // Create a simplified version of the report for printing
      const simplifiedReport = document.createElement('div');
      simplifiedReport.style.width = '210mm';
      // Adjust padding for pre-printed letterhead when header/footer are not shown
      // When showHeaderFooter is false, we're printing on pre-printed letterhead
      // so we need to leave space for the pre-printed header and footer
      const topPadding = showHeaderFooter ? '40mm' : '45mm'; // More space for pre-printed header
      const bottomPadding = showHeaderFooter ? '35mm' : '40mm'; // More space for pre-printed footer
      simplifiedReport.style.padding = `${topPadding} 15mm ${bottomPadding} 15mm`;
      simplifiedReport.style.boxSizing = 'border-box';
      simplifiedReport.style.fontFamily = 'Arial, sans-serif';
      simplifiedReport.style.fontSize = '11pt';
      simplifiedReport.style.position = 'relative';
      
      // Add horizontal line at the top
      const topLine = document.createElement('div');
      topLine.style.borderTop = '2px solid black';
      topLine.style.width = '100%';
      topLine.style.marginBottom = '10px'; // Reduced from 20px
      simplifiedReport.appendChild(topLine);
      
      // Add patient info
      const patientInfo = document.createElement('div');
      patientInfo.style.display = 'grid';
      patientInfo.style.gridTemplateColumns = '1fr 1fr';
      patientInfo.style.gap = '10mm';
      patientInfo.style.marginBottom = '10px'; // Reduced from 20px
      
      // Left column
      const leftCol = document.createElement('div');
      leftCol.innerHTML = `
        <div style="margin-bottom: 5px;"><strong>Patient Name:</strong> ${report.patientInfo?.name || 'N/A'}</div>
        <div style="margin-bottom: 5px;"><strong>Age/Gender:</strong> ${report.patientInfo?.age || 'N/A'} Years / ${report.patientInfo?.gender || 'N/A'}</div>
        <div style="margin-bottom: 5px;"><strong>Patient ID:</strong> ${report.patientInfo?.patientId || report._id?.substring(0, 8) || 'N/A'}</div>
      `;
      
      // Right column
      const rightCol = document.createElement('div');
      rightCol.innerHTML = `
        <div style="margin-bottom: 5px;"><strong>Sample Collection:</strong> ${new Date(report.testInfo?.sampleCollectionDate || report.createdAt).toLocaleDateString()}</div>
        <div style="margin-bottom: 5px;"><strong>Sample Type:</strong> ${report.testInfo?.sampleType || 'Blood'}</div>
        <div style="margin-bottom: 5px;"><strong>Referring Doctor:</strong> ${report.testInfo?.referenceDoctor || 'N/A'}</div>
      `;
      
      patientInfo.appendChild(leftCol);
      patientInfo.appendChild(rightCol);
      simplifiedReport.appendChild(patientInfo);
      
      // Add bottom line after patient info
      const bottomLine = document.createElement('div');
      bottomLine.style.borderTop = '2px solid black';
      bottomLine.style.width = '100%';
      bottomLine.style.marginBottom = '10px'; // Reduced from 20px
      simplifiedReport.appendChild(bottomLine);
      
      // Add test title
      const title = document.createElement('div');
      title.textContent = report.testInfo?.name || 'Complete Blood Count Parameters';
      title.style.textAlign = 'center';
      title.style.fontWeight = 'bold';
      title.style.fontSize = '14pt';
      title.style.marginBottom = '10px'; // Reduced from 20px
      simplifiedReport.appendChild(title);
      
      // Add test results table
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.marginBottom = '20px';
      
      // Add table header
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      
      const headers = ['Test', 'Result', 'Unit', 'Reference Range'];
      const widths = ['40%', '15%', '10%', '35%'];
      
      headers.forEach((header, index) => {
        const th = document.createElement('th');
        th.textContent = header;
        th.style.border = '1px solid black';
        th.style.borderStyle = 'solid';
        th.style.borderColor = 'black';
        th.style.borderWidth = '1px';
        th.style.padding = '6px 10px';
        th.style.textAlign = 'left';
        th.style.fontWeight = 'bold';
        th.style.width = widths[index];
        headerRow.appendChild(th);
      });
      
      thead.appendChild(headerRow);
      table.appendChild(thead);
      
      // Add table body
      const tbody = document.createElement('tbody');
      
      if (report.results && report.results.length > 0) {
        report.results.forEach(param => {
          const row = document.createElement('tr');
          
          // Test name cell
          const nameCell = document.createElement('td');
          nameCell.textContent = param.parameter || param.name;
          nameCell.style.border = '1px solid black';
          nameCell.style.borderStyle = 'solid';
          nameCell.style.borderColor = 'black';
          nameCell.style.borderWidth = '1px';
          nameCell.style.padding = '6px 10px';
          row.appendChild(nameCell);
          
          // Result cell
          const resultCell = document.createElement('td');
          resultCell.textContent = param.value;
          // Bold abnormal values in downloaded PDF
          if (param.flag === 'high' || param.flag === 'low' || param.flag === 'critical') {
            resultCell.style.fontWeight = 'bold';
          }
      // Bold abnormal results
      if (param.flag === 'high' || param.flag === 'low' || param.flag === 'critical') {
        resultCell.style.fontWeight = 'bold';
      }
          resultCell.style.border = '1px solid black';
          resultCell.style.borderStyle = 'solid';
          resultCell.style.borderColor = 'black';
          resultCell.style.borderWidth = '1px';
          resultCell.style.padding = '6px 10px';
          if (param.flag === 'high' || param.flag === 'low' || param.flag === 'critical') {
            resultCell.style.fontWeight = 'bold';
          }
          row.appendChild(resultCell);
          
          // Unit cell
          const unitCell = document.createElement('td');
          unitCell.textContent = param.unit;
          unitCell.style.border = '1px solid black';
          unitCell.style.borderStyle = 'solid';
          unitCell.style.borderColor = 'black';
          unitCell.style.borderWidth = '1px';
          unitCell.style.padding = '6px 10px';
          row.appendChild(unitCell);
          
          // Reference range cell
          const rangeCell = document.createElement('td');
          rangeCell.textContent = param.referenceRange;
          rangeCell.style.border = '1px solid black';
          rangeCell.style.borderStyle = 'solid';
          rangeCell.style.borderColor = 'black';
          rangeCell.style.borderWidth = '1px';
          rangeCell.style.padding = '6px 10px';
          row.appendChild(rangeCell);
          
          tbody.appendChild(row);
        });
      } else {
        const emptyRow = document.createElement('tr');
        const emptyCell = document.createElement('td');
        emptyCell.colSpan = 4;
        emptyCell.textContent = 'No test parameters available';
        emptyCell.style.textAlign = 'center';
        emptyCell.style.padding = '6px';
        emptyCell.style.border = '1px solid black';
        emptyRow.appendChild(emptyCell);
        tbody.appendChild(emptyRow);
      }
      
      table.appendChild(tbody);
      simplifiedReport.appendChild(table);
      
      // Dynamically load html2pdf if not loaded
      if (typeof window.html2pdf === 'undefined') {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
          script.async = true;
          script.onload = resolve;
          script.onerror = () => reject(new Error('Failed to load html2pdf library'));
          document.body.appendChild(script);
        });
      }
      
      // Create a temporary container for the simplified report
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.top = '-10000px';
      tempContainer.style.left = '-10000px';
      tempContainer.appendChild(simplifiedReport);
      document.body.appendChild(tempContainer);
      
      // Generate PDF
      const opt = {
        margin: 0,
        filename: `${report.patientInfo?.name || 'Patient'}_Report.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      // Generate PDF and open in new window for printing
      const pdfBlob = await window.html2pdf().set(opt).from(simplifiedReport).outputPdf('blob');
      
      // Clean up temporary container
      document.body.removeChild(tempContainer);
      
      // Open the PDF in a new window for printing
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl);
      
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
      } else {
        alert('Please allow popups for this website to enable printing.');
      }
    } catch (error) {
      console.error('Error printing report:', error);
      alert('Failed to print report. Please try again.');
    }
  };
  
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Check if html2pdf is available
      if (typeof window.html2pdf === 'undefined') {
        // If html2pdf is not loaded, dynamically load it
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.async = true;
        script.onload = () => {
          generatePDF();
        };
        document.body.appendChild(script);
      } else {
        generatePDF();
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
      setIsDownloading(false);
    }
  };

  const generatePDF = async () => {
    try {
      if (!reportRef.current) {
        alert('Report content is not available for downloading.');
        return;
      }
      
      // Create a simplified version of the report for downloading
      const simplifiedReport = document.createElement('div');
      simplifiedReport.style.width = '210mm';
      // Adjust padding for pre-printed letterhead when header/footer are not shown
      // When showHeaderFooter is false, we're printing on pre-printed letterhead
      // so we need to leave space for the pre-printed header and footer
      const topPadding = showHeaderFooter ? '40mm' : '45mm'; // More space for pre-printed header
      const bottomPadding = showHeaderFooter ? '35mm' : '40mm'; // More space for pre-printed footer
      simplifiedReport.style.padding = `${topPadding} 15mm ${bottomPadding} 15mm`;
      simplifiedReport.style.boxSizing = 'border-box';
      simplifiedReport.style.fontFamily = 'Arial, sans-serif';
      simplifiedReport.style.fontSize = '11pt';
      simplifiedReport.style.position = 'relative';
      
      // Add horizontal line at the top
      const topLine = document.createElement('div');
      topLine.style.borderTop = '2px solid black';
      topLine.style.width = '100%';
      topLine.style.marginBottom = '10px'; // Reduced from 20px
      simplifiedReport.appendChild(topLine);
      
      // Add patient info
      const patientInfo = document.createElement('div');
      patientInfo.style.display = 'grid';
      patientInfo.style.gridTemplateColumns = '1fr 1fr';
      patientInfo.style.gap = '10mm';
      patientInfo.style.marginBottom = '10px'; // Reduced from 20px
      
      // Left column
      const leftCol = document.createElement('div');
      leftCol.innerHTML = `
        <div style="margin-bottom: 5px;"><strong>Patient Name:</strong> ${report.patientInfo?.name || 'N/A'}</div>
        <div style="margin-bottom: 5px;"><strong>Age/Gender:</strong> ${report.patientInfo?.age || 'N/A'} Years / ${report.patientInfo?.gender || 'N/A'}</div>
        <div style="margin-bottom: 5px;"><strong>Patient ID:</strong> ${report.patientInfo?.patientId || report._id?.substring(0, 8) || 'N/A'}</div>
      `;
      
      // Right column
      const rightCol = document.createElement('div');
      rightCol.innerHTML = `
        <div style="margin-bottom: 5px;"><strong>Sample Collection:</strong> ${new Date(report.testInfo?.sampleCollectionDate || report.createdAt).toLocaleDateString()}</div>
        <div style="margin-bottom: 5px;"><strong>Sample Type:</strong> ${report.testInfo?.sampleType || 'Blood'}</div>
        <div style="margin-bottom: 5px;"><strong>Referring Doctor:</strong> ${report.testInfo?.referenceDoctor || 'N/A'}</div>
      `;
      
      patientInfo.appendChild(leftCol);
      patientInfo.appendChild(rightCol);
      simplifiedReport.appendChild(patientInfo);
      
      // Add bottom line after patient info
      const bottomLine = document.createElement('div');
      bottomLine.style.borderTop = '2px solid black';
      bottomLine.style.width = '100%';
      bottomLine.style.marginBottom = '10px'; // Reduced from 20px
      simplifiedReport.appendChild(bottomLine);
      
      // Add test title
      const title = document.createElement('div');
      title.textContent = report.testInfo?.name || 'Complete Blood Count Parameters';
      title.style.textAlign = 'center';
      title.style.fontWeight = 'bold';
      title.style.fontSize = '14pt';
      title.style.marginBottom = '10px'; // Reduced from 20px
      simplifiedReport.appendChild(title);
      
      // Add test results table
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.marginBottom = '20px';
      
      // Add table header
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      
      const headers = ['Test', 'Result', 'Unit', 'Reference Range'];
      const widths = ['40%', '15%', '10%', '35%'];
      
      headers.forEach((header, index) => {
        const th = document.createElement('th');
        th.textContent = header;
        th.style.border = '1px solid black';
        th.style.borderStyle = 'solid';
        th.style.borderColor = 'black';
        th.style.borderWidth = '1px';
        th.style.padding = '6px 10px';
        th.style.textAlign = 'left';
        th.style.fontWeight = 'bold';
        th.style.width = widths[index];
        headerRow.appendChild(th);
      });
      
      thead.appendChild(headerRow);
      table.appendChild(thead);
      
      // Add table body
      const tbody = document.createElement('tbody');
      
      if (report.results && report.results.length > 0) {
        report.results.forEach(param => {
          const row = document.createElement('tr');
          
          // Test name cell
          const nameCell = document.createElement('td');
          nameCell.textContent = param.parameter || param.name;
          nameCell.style.border = '1px solid black';
          nameCell.style.borderStyle = 'solid';
          nameCell.style.borderColor = 'black';
          nameCell.style.borderWidth = '1px';
          nameCell.style.padding = '6px 10px';
          row.appendChild(nameCell);
          
          // Result cell
          const resultCell = document.createElement('td');
          resultCell.textContent = param.value;
          resultCell.style.border = '1px solid black';
          resultCell.style.borderStyle = 'solid';
          resultCell.style.borderColor = 'black';
          resultCell.style.borderWidth = '1px';
          resultCell.style.padding = '6px 10px';
          if (param.flag === 'high' || param.flag === 'low' || param.flag === 'critical') {
            resultCell.style.fontWeight = 'bold';
          }
          row.appendChild(resultCell);
          
          // Unit cell
          // Reference range cell
          const rangeCell = document.createElement('td');
          rangeCell.textContent = param.referenceRange;
          rangeCell.style.border = '1px solid black';
          rangeCell.style.padding = '6px 10px';
          row.appendChild(rangeCell);
          
          tbody.appendChild(row);
        });
      } else {
        const emptyRow = document.createElement('tr');
        const emptyCell = document.createElement('td');
        emptyCell.colSpan = 4;
        emptyCell.textContent = 'No test parameters available';
        emptyCell.style.textAlign = 'center';
        emptyCell.style.padding = '6px';
        emptyCell.style.border = '1px solid black';
        emptyRow.appendChild(emptyCell);
        tbody.appendChild(emptyRow);
      }
      
      table.appendChild(tbody);
      simplifiedReport.appendChild(table);
      
      // Create a temporary container for the simplified report
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.top = '-10000px';
      tempContainer.style.left = '-10000px';
      tempContainer.appendChild(simplifiedReport);
      document.body.appendChild(tempContainer);
      
      // Generate PDF
      const opt = {
        margin: 0,
        filename: `${report.patientInfo?.name || 'Patient'}_Report.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      // Generate and save the PDF
      await window.html2pdf().set(opt).from(simplifiedReport).save();
      
      // Clean up temporary container
      document.body.removeChild(tempContainer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
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
      showHeader: showHeaderFooter,
      
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
      signatureImage: showSignature ? (labSettings.footer?.signature || '') : '',
      verifiedBy: showSignature ? (labSettings.footer?.verifiedBy || 'Consultant') : '',
      designation: showSignature ? (labSettings.footer?.designation || 'Pathologist') : '',
      
      // Footer data
      footerImage: labSettings.footer?.footerImage || '',
      showFooter: showHeaderFooter,
      showSignature: showSignature,
      
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
              id="showHeaderFooter"
              name="showHeaderFooter"
              type="checkbox"
              checked={showHeaderFooter}
              onChange={(e) => setShowHeaderFooter(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="showHeaderFooter" className="ml-2 block text-sm text-gray-900">
              Show Header and Footer (uncheck for pre-printed letterhead)
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="showSignature"
              name="showSignature"
              type="checkbox"
              checked={showSignature}
              onChange={(e) => setShowSignature(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="showSignature" className="ml-2 block text-sm text-gray-900">
              Show Signature
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
          width: '210mm', // A4 width
          height: '297mm', // A4 height
          margin: '0 auto',
          pageBreakInside: 'avoid',
          boxSizing: 'border-box',
          padding: '0',
          position: 'relative',
          overflow: 'hidden'
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
                box-shadow: none !important;
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
                height: auto !important;
                overflow: visible !important;
              }
              
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
                font-size: 12pt !important;
              }
              
              /* Ensure header image uses full width */
              .header-image {
                width: 100% !important;
                max-width: 100% !important;
                height: auto !important;
                object-fit: contain !important;
              }
              
              /* Ensure header and footer containers use full width */
              .report-header, .footer {
                width: 100% !important;
                text-align: center !important;
                display: block !important;
                position: static !important;
                height: auto !important;
                z-index: auto !important;
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
                position: static !important;
                top: auto !important;
                bottom: auto !important;
                left: auto !important;
                right: auto !important;
                padding: 10mm !important; /* Inner padding for content */
                overflow: visible !important;
              }
              
              /* Add top margin before patient details for pre-printed letterhead */
              .patient-info {
                margin-top: 25mm !important;
              }
              
              /* Remove fixed positioning for header, footer, and doctor sign */
              .doctor-sign {
                position: static !important;
                bottom: auto !important;
                left: auto !important;
                right: auto !important;
                height: auto !important;
                text-align: center !important;
                z-index: auto !important;
                border-top: none !important;
                padding-top: 0 !important;
                font-size: 12pt !important;
                font-weight: bold !important;
              }
            }
          `}
        </style>
        <ReportTemplate reportData={reportData} />
      </div>
    </div>
  );
}
