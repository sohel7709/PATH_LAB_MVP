import { useState } from 'react';

// Custom hook to handle PDF generation, printing, and downloading
export const useReportPdf = (report, reportHtml) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Function to load the html2pdf library dynamically
  const loadHtml2Pdf = async () => {
    if (typeof window.html2pdf === 'undefined') {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.async = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load html2pdf library'));
        document.body.appendChild(script);
      });
    }
    return Promise.resolve(); // Already loaded
  };

  // Common PDF generation options
  const getPdfOptions = (filename) => ({
    margin: [50, 0, 40, 0], // Adjusted bottom margin: [Top 50mm, Right 0, Bottom 40mm, Left 0]
    filename: filename || 'Report.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
      logging: false,
      onclone: (clonedDoc) => {
        // Find the main container within the cloned document
        const clonedPrintContainer = clonedDoc.body.firstChild; // Assuming the report div is the first child
        if (clonedPrintContainer && clonedPrintContainer.style) {
          // Ensure the cloned container doesn't inherit fixed off-screen positioning
          clonedPrintContainer.style.position = 'static';
          clonedPrintContainer.style.top = 'auto';
          clonedPrintContainer.style.left = 'auto';
          clonedPrintContainer.style.height = 'auto'; // Allow natural height
          clonedPrintContainer.style.minHeight = '297mm'; // Still suggest A4 height
        } else {
          console.warn('Could not find cloned container or its style for PDF generation adjustments.');
        }
      }
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  });

  // Function to handle printing
  const printPdf = async () => {
    if (!report || !reportHtml) {
      alert('Report data or HTML structure is not ready for printing.');
      return;
    }
    setIsPrinting(true);
    try {
      await loadHtml2Pdf();

      // Create a temporary element from the HTML string
      const tempElement = document.createElement('div');
      tempElement.innerHTML = reportHtml; // Use the generated HTML string
      const printElement = tempElement.firstChild; // Get the actual report element

      if (!printElement) {
        throw new Error('Failed to create element from report HTML for printing.');
      }

      // Temporarily append to DOM for html2pdf
      const tempContainer = document.createElement('div');
      // Use fixed positioning off-screen as before
      tempContainer.style.position = 'fixed'; 
      tempContainer.style.top = '-10000px'; 
      tempContainer.style.left = '-10000px';
      tempContainer.appendChild(printElement);
      document.body.appendChild(tempContainer);

      const filename = `${report.patientInfo?.name || 'Patient'}_Report_${report._id}.pdf`;
      const opt = getPdfOptions(filename);

      const pdfBlob = await window.html2pdf().set(opt).from(printElement).outputPdf('blob');

      document.body.removeChild(tempContainer); // Clean up

      const pdfUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl);

      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
          // Optional: Update report status after printing attempt
          // try { await apiReports.update(report._id, { status: 'completed' }); }
          // catch (err) { console.error('Failed to update report status:', err); }
        });
      } else {
        alert('Please allow popups for this website to enable printing.');
      }
    } catch (error) {
      console.error('Error generating or printing report:', error);
      alert(`Failed to generate or print report: ${error.message}`);
    } finally {
      setIsPrinting(false);
    }
  };

  // Function to handle downloading
  const downloadPdf = async () => {
    if (!report || !reportHtml) {
      alert('Report data or HTML structure is not ready for download.');
      return;
    }
    setIsDownloading(true);
    try {
      await loadHtml2Pdf();

      // Create a temporary element from the HTML string
      const tempElement = document.createElement('div');
      tempElement.innerHTML = reportHtml; // Use the generated HTML string
      const downloadElement = tempElement.firstChild; // Get the actual report element

      if (!downloadElement) {
        throw new Error('Failed to create element from report HTML for download.');
      }

      // Temporarily append to DOM for html2pdf
      const tempContainer = document.createElement('div');
      // Use fixed positioning off-screen as before
      tempContainer.style.position = 'fixed';
      tempContainer.style.top = '-10000px';
      tempContainer.style.left = '-10000px';
      tempContainer.appendChild(downloadElement);
      document.body.appendChild(tempContainer);
      
      const filename = `${report.patientInfo?.name || 'Patient'}_Report_${report._id}.pdf`;
      const opt = getPdfOptions(filename);

      await window.html2pdf().set(opt).from(downloadElement).save();

      document.body.removeChild(tempContainer); // Clean up

    } catch (error) {
      console.error('Error generating PDF for download:', error);
      alert(`Failed to generate PDF for download: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  return { printPdf, downloadPdf, isPrinting, isDownloading };
};
