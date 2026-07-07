import { useState } from 'react';

// Custom hook to handle PDF generation, printing, and downloading
export const useReportPdf = (report, reportHtml, printMode = "official", plainTopMargin = 40) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // "plain" mode leaves blank space at the top for pre-printed letterhead;
  // match the PDF export margin to the on-screen plain-mode margin the user set.
  const topMargin = printMode === "plain" ? plainTopMargin : 5;

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
    margin: [topMargin, 0, 5, 0], // Top adapts to print mode; content height drives page count
    filename: filename || 'Report.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
      logging: false,
      onclone: (clonedDoc) => {
        const clonedPrintContainer = clonedDoc.body.firstChild;
        if (clonedPrintContainer && clonedPrintContainer.style) {
          clonedPrintContainer.style.position = 'static';
          clonedPrintContainer.style.top = 'auto';
          clonedPrintContainer.style.left = 'auto';
          // Let the element shrink to its actual content height so html2pdf
          // doesn't add extra blank space that forces a second page.
          clonedPrintContainer.style.height = 'auto';
          clonedPrintContainer.style.minHeight = 'unset';
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
          // catch (err) {  }
        });
      } else {
        alert('Please allow popups for this website to enable printing.');
      }
    } catch (error) {
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
            alert(`Failed to generate PDF for download: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  return { printPdf, downloadPdf, isPrinting, isDownloading };
};
