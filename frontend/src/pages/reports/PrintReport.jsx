import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExclamationCircleIcon, PrinterIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
// Renamed imports to avoid potential conflicts and indicate usage
import { reports as apiReports, labReportSettings as apiLabSettings } from '../../utils/api'; 

export default function PrintReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [labSettings, setLabSettings] = useState(null); // Keep labSettings if needed for buildPrintHtmlStructure
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPrinting, setIsPrinting] = useState(false); // Renamed setter for clarity if needed later
  const [isDownloading, setIsDownloading] = useState(false);
  const reportRef = useRef(null); // Ref for the container div
  const [reportHtml, setReportHtml] = useState(''); // State to hold generated HTML for preview

  // Define fetchReportData function
  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      setError(''); // Clear previous errors
      
      // Fetch the report data
      const reportResponse = await apiReports.getById(id); // Use renamed import
      const reportData = reportResponse.data || reportResponse;
      
      // Fetch the lab settings
      const labId = reportData.lab;
      const settingsResponse = await apiLabSettings.getSettings(labId); // Use renamed import
      const settingsData = settingsResponse.data || settingsResponse;
      
      setReport(reportData);
      setLabSettings(settingsData); // Keep setting labSettings
      
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError(err.message || 'Failed to load report');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchReportData();
  }, [id]);

  // Function to check if a value is outside the reference range
  const isOutsideRange = (value, referenceRange) => {
    if (!value || !referenceRange) return false;
    const cleanValue = value.toString().replace(/,/g, '');
    const cleanRange = referenceRange.toString().replace(/,/g, '');
    const numValue = parseFloat(cleanValue);
    if (isNaN(numValue)) return false;
    try {
      if (cleanRange.includes('-') || cleanRange.includes('–')) {
        const separator = cleanRange.includes('-') ? '-' : '–';
        const [min, max] = cleanRange.split(separator).map(v => parseFloat(v.trim()));
        if (!isNaN(min) && !isNaN(max)) return numValue < min || numValue > max;
      } else if (cleanRange.startsWith('<') || cleanRange.startsWith('<')) { // Combined check for <
        const maxString = cleanRange.startsWith('<') ? cleanRange.substring(4) : cleanRange.substring(1);
        const max = parseFloat(maxString.trim());
        return !isNaN(max) && numValue >= max;
      } else if (cleanRange.startsWith('≤')) {
        const max = parseFloat(cleanRange.substring(1).trim());
        return !isNaN(max) && numValue > max;
      } else if (cleanRange.startsWith('>') || cleanRange.startsWith('>')) { // Combined check for >
        const minString = cleanRange.startsWith('>') ? cleanRange.substring(4) : cleanRange.substring(1);
        const min = parseFloat(minString.trim());
        return !isNaN(min) && numValue <= min;
      } else if (cleanRange.startsWith('≥')) {
        const min = parseFloat(cleanRange.substring(1).trim());
        return !isNaN(min) && numValue < min;
      } else if (cleanRange.toLowerCase().includes('less than')) {
        const max = parseFloat(cleanRange.toLowerCase().replace('less than', '').trim());
        return !isNaN(max) && numValue >= max;
      } else if (cleanRange.toLowerCase().includes('greater than')) {
        const min = parseFloat(cleanRange.toLowerCase().replace('greater than', '').trim());
        return !isNaN(min) && numValue <= min;
      }
    } catch (error) { console.warn('Invalid reference range:', referenceRange, error); }
    return false;
  };

  // Prepare data structure needed by the build function
  const prepareReportData = () => {
    if (!report) {
      console.log("Report data missing, cannot prepare.");
      return null; 
    }
    
    const grouped = (report.results || []).reduce((acc, param) => {
      const key = param.templateId || 'unknown'; 
      if (!acc[key]) {
        const defaultName = report.testInfo?.name || 'Test Results'; 
        acc[key] = {
          templateName: param.templateName || (key !== 'unknown' ? `Test Group (ID: ${key})` : defaultName), 
          parameters: []
        };
      }
      acc[key].parameters.push({
        parameter: param.parameter || param.name, 
        value: param.value,                       
        unit: param.unit,
        referenceRange: param.referenceRange,
        isSubparameter: param.isSubparameter,
        notes: param.notes, 
        flag: param.flag 
      });
      return acc;
    }, {});

    const finalGroupedResults = Object.values(grouped);
    
    return {
        groupedResults: finalGroupedResults,
        testNotes: report.testNotes || '' 
    };
  }; 

  // Helper function to build the HTML structure
  const buildPrintHtmlStructure = (currentReport, groupedResults, testNotes) => {
    if (!currentReport) return null;

    const printContainer = document.createElement('div');
    printContainer.style.width = '210mm';
    printContainer.style.minHeight = '297mm'; 
    printContainer.style.padding = '60mm 15mm 30mm 15mm'; 
    printContainer.style.boxSizing = 'border-box';
    printContainer.style.fontFamily = 'Arial, sans-serif';
    printContainer.style.backgroundColor = 'white';
    printContainer.style.position = 'relative'; 
    printContainer.style.borderTop = '2px solid black'; 

    // Patient Info (Flex layout with center space for QR)
    const patientInfoDiv = document.createElement('div');
    patientInfoDiv.style.display = 'flex';
    patientInfoDiv.style.justifyContent = 'space-between'; 
    patientInfoDiv.style.alignItems = 'flex-start'; 
    patientInfoDiv.style.fontSize = '11pt';
    patientInfoDiv.style.marginBottom = '15px';
    patientInfoDiv.style.padding = '10px 0'; 
    patientInfoDiv.style.borderTop = '2px solid black'; 
    patientInfoDiv.style.borderBottom = '2px solid black'; 

    const leftPatientCol = document.createElement('div');
    leftPatientCol.innerHTML = `
      <div style="margin-bottom: 4px;"><strong>Patient Name:</strong> ${currentReport.patientInfo?.name || 'N/A'}</div>
      <div style="margin-bottom: 4px;"><strong>Age/Gender:</strong> ${currentReport.patientInfo?.age || 'N/A'} / ${currentReport.patientInfo?.gender || 'N/A'}</div>
      <div><strong>Patient ID:</strong> ${currentReport.patientInfo?.patientId || 'N/A'}</div>
    `;

    const centerPatientCol = document.createElement('div');
    centerPatientCol.style.width = '50px'; 
    centerPatientCol.style.height = '50px'; 
    centerPatientCol.style.flexShrink = '0'; 

    const rightPatientCol = document.createElement('div');
    rightPatientCol.style.textAlign = 'right'; 
    rightPatientCol.innerHTML = `
      <div style="margin-bottom: 4px;"><strong>Report Date:</strong> ${new Date(currentReport.createdAt).toLocaleDateString()}</div>
      <div><strong>Ref. Doctor:</strong> ${currentReport.testInfo?.referenceDoctor || 'N/A'}</div>
    `;

    patientInfoDiv.appendChild(leftPatientCol);
    patientInfoDiv.appendChild(centerPatientCol); 
    patientInfoDiv.appendChild(rightPatientCol);
    printContainer.appendChild(patientInfoDiv);

    // Test Results Section (Using Table)
    if (groupedResults && groupedResults.length > 0) {
      groupedResults.forEach((group, groupIndex) => {
        const groupHeading = document.createElement('div');
        groupHeading.textContent = group.templateName;
        groupHeading.style.fontSize = '14pt';
        groupHeading.style.fontWeight = 'bold';
        groupHeading.style.textAlign = 'center';
        groupHeading.style.marginTop = '15px';
        groupHeading.style.marginBottom = '10px';
        printContainer.appendChild(groupHeading);

        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.marginBottom = '15px'; 
        table.style.border = '1px solid black'; 

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const headers = ['Parameter', 'Result', 'Unit', 'Reference Range'];
        const widths = ['40%', '20%', '10%', '30%']; 
        const alignments = ['left', 'center', 'center', 'left']; 

        headers.forEach((header, index) => {
          const th = document.createElement('th');
          th.textContent = header;
          th.style.border = '1px solid black'; 
          th.style.padding = '6px 8px';
          th.style.textAlign = alignments[index]; 
          th.style.fontWeight = 'bold';
          th.style.fontSize = '11pt';
          th.style.width = widths[index];
          th.style.verticalAlign = 'middle'; 
          headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        if (group.parameters && group.parameters.length > 0) {
          group.parameters.forEach(param => {
            const isAbnormal = param.flag === 'high' || param.flag === 'low' || param.flag === 'critical' || isOutsideRange(param.value, param.referenceRange);
            const row = document.createElement('tr');

            const nameCell = document.createElement('td');
            nameCell.textContent = param.parameter || param.name;
            nameCell.style.border = '1px solid black';
            nameCell.style.padding = '6px 8px';
            nameCell.style.fontSize = '11pt';
            nameCell.style.textAlign = 'left'; 
            nameCell.style.verticalAlign = 'top';
            row.appendChild(nameCell);

            const resultCell = document.createElement('td');
            resultCell.textContent = param.value !== null && param.value !== undefined ? param.value : '';
            resultCell.style.border = '1px solid black';
            resultCell.style.padding = '6px 8px';
            resultCell.style.textAlign = 'center'; 
            resultCell.style.fontWeight = isAbnormal ? 'bold' : 'normal';
            resultCell.style.fontSize = '11pt';
            resultCell.style.verticalAlign = 'top';
            row.appendChild(resultCell);

            const unitCell = document.createElement('td');
            unitCell.textContent = param.unit || '';
            unitCell.style.border = '1px solid black';
            unitCell.style.padding = '6px 8px';
            unitCell.style.textAlign = 'center'; 
            unitCell.style.fontSize = '11pt';
            unitCell.style.verticalAlign = 'top';
            row.appendChild(unitCell);

            const rangeCell = document.createElement('td');
            rangeCell.style.border = '1px solid black';
            rangeCell.style.padding = '6px 8px';
            rangeCell.style.textAlign = 'left'; 
            rangeCell.style.fontSize = '10pt';
            rangeCell.style.verticalAlign = 'top';

            const rangeText = document.createTextNode(param.referenceRange || '');
            rangeCell.appendChild(rangeText);

            if (param.notes) {
               const noteSpan = document.createElement('span');
               noteSpan.textContent = ` (${param.notes})`;
               noteSpan.style.fontStyle = 'italic';
               noteSpan.style.marginLeft = '5px';
               noteSpan.style.display = 'block'; 
               rangeCell.appendChild(noteSpan);
            }
            row.appendChild(rangeCell);

            tbody.appendChild(row);
          });
        } else {
           const emptyRow = document.createElement('tr');
           const emptyCell = document.createElement('td');
           emptyCell.colSpan = 4;
           emptyCell.textContent = 'No parameters in this group.';
           emptyCell.style.textAlign = 'center';
           emptyCell.style.padding = '6px 8px';
           emptyCell.style.border = '1px solid black';
           emptyRow.appendChild(emptyCell);
           tbody.appendChild(emptyRow);
        }
        table.appendChild(tbody);
        printContainer.appendChild(table);

         if (groupIndex === 0 && testNotes) {
           const notesDiv = document.createElement('div'); 
           notesDiv.style.marginTop = '15px';
           notesDiv.style.fontSize = '10pt';
           notesDiv.style.fontStyle = 'italic';
           notesDiv.innerHTML = `<strong>Notes:</strong> ${testNotes}`; 
           printContainer.appendChild(notesDiv);
         }
      });
    } else {
      const noResults = document.createElement('div');
      noResults.textContent = 'No test results available.';
      noResults.style.textAlign = 'center';
      noResults.style.marginTop = '20px';
      printContainer.appendChild(noResults);
    }

    // REMOVED: Signature Section

    return printContainer; 
  };

  // Effect to update the on-screen preview when report data changes
  useEffect(() => {
    if (report && labSettings) { // Ensure report and labSettings are loaded
      const preparedData = prepareReportData();
      if (preparedData) {
        const htmlElement = buildPrintHtmlStructure(report, preparedData.groupedResults, preparedData.testNotes);
        if (htmlElement) {
          setReportHtml(htmlElement.outerHTML); // Store the HTML string for preview
        }
      }
    }
  }, [report, labSettings]); // Re-run when report or labSettings change


  const handlePrint = async () => {
    // Use setIsPrinting if you want to disable the button during the process
    setIsPrinting(true); // Example usage
    try {
      if (!report) {
        alert('Report data is not loaded yet.');
        return;
      }
      const preparedData = prepareReportData();
      if (!preparedData) {
        alert('Failed to prepare report data for printing.');
        return;
      }
      
      const printElement = buildPrintHtmlStructure(report, preparedData.groupedResults, preparedData.testNotes);
      if (!printElement) {
         alert('Failed to build HTML structure for printing.');
         return;
      }

      // --- PDF Generation (using the generated element) ---
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

      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.top = '-10000px'; 
      tempContainer.style.left = '-10000px';
      tempContainer.appendChild(printElement); 
      document.body.appendChild(tempContainer);

      const opt = {
        margin: 0, 
        filename: `${report.patientInfo?.name || 'Patient'}_Report_${report._id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2, 
          useCORS: true,
          letterRendering: true,
          logging: false,
           onclone: (clonedDoc) => {
             const clonedPrintContainer = clonedDoc.querySelector('div'); 
             if (clonedPrintContainer) {
               clonedPrintContainer.style.height = '297mm';
             }
           }
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      const pdfBlob = await window.html2pdf().set(opt).from(printElement).outputPdf('blob');

      document.body.removeChild(tempContainer); 

      const pdfUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl);

      if (printWindow) {
        printWindow.addEventListener('load', async () => {
          printWindow.print();
          // try { await apiReports.update(id, { status: 'completed' }); } // Use renamed import
          // catch (err) { console.error('Failed to update report status:', err); }
        });
      } else {
        alert('Please allow popups for this website to enable printing.');
      }
    } catch (error) {
      console.error('Error generating or printing report:', error);
      alert(`Failed to generate or print report: ${error.message}`);
    } finally {
       setIsPrinting(false); // Reset printing state
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
       if (!report) {
        alert('Report data is not loaded yet.');
        setIsDownloading(false);
        return;
      }
      const preparedData = prepareReportData();
      if (!preparedData) {
        alert('Failed to prepare report data for download.');
        setIsDownloading(false);
        return;
      }
      
      const downloadElement = buildPrintHtmlStructure(report, preparedData.groupedResults, preparedData.testNotes);
       if (!downloadElement) {
         alert('Failed to build HTML structure for download.');
         setIsDownloading(false);
         return;
      }

      // Check if html2pdf is available
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
      
      // Use the generated HTML element for PDF generation
      const opt = {
        margin: 0, 
        filename: `${report.patientInfo?.name || 'Patient'}_Report_${report._id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2, 
          useCORS: true,
          letterRendering: true,
          logging: false,
           onclone: (clonedDoc) => {
             const clonedPrintContainer = clonedDoc.querySelector('div'); 
             if (clonedPrintContainer) {
               clonedPrintContainer.style.height = '297mm';
             }
           }
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // Need to temporarily append to DOM for html2pdf to work correctly with complex styles
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.top = '-10000px'; 
      tempContainer.style.left = '-10000px';
      tempContainer.appendChild(downloadElement); 
      document.body.appendChild(tempContainer);

      await window.html2pdf().set(opt).from(downloadElement).save();

      document.body.removeChild(tempContainer); // Clean up

    } catch (error) {
      console.error('Error generating PDF for download:', error);
      alert('Failed to generate PDF for download. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

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
          margin: '0 auto', 
          overflow: 'hidden' // Hide potential overflow in preview
        }}
        // Render the generated HTML string for preview
        dangerouslySetInnerHTML={{ __html: reportHtml }} 
      >
        {/* Removed inline style tag and ReportTemplate component */}
      </div>
    </div>
  ); // End of main return statement
} // End of PrintReport component
