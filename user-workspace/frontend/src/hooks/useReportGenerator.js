import { useState, useEffect } from 'react';
import { reports as api } from '../utils/api'; // Corrected import path

// Custom hook to generate the report HTML structure by fetching it from the backend
export const useReportGenerator = (report) => { // report object is passed, primarily for its _id
  const [reportHtml, setReportHtml] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (report && report._id) {
      const fetchReportHtml = async () => {
        setIsLoading(true);
        setError(null);
        try {
          // The report data fetched by PrintReport.jsx (and passed as `report` prop here)
          // should now contain all necessary fields due to changes in `getReport` controller,
          // including qrCodeDataUrl. The /html endpoint will use this.
          const htmlString = await api.getHtmlById(report._id);
          setReportHtml(htmlString);
        } catch (err) {
          console.error("Error fetching report HTML:", err);
          setError(err.message || 'Failed to load report HTML for printing.');
          setReportHtml('<p>Error loading report preview.</p>'); // Fallback HTML
        } finally {
          setIsLoading(false);
        }
      };

      fetchReportHtml();
    } else {
      setReportHtml(''); // Clear HTML if no report or report ID
    }
  }, [report]); // Re-run when the report object changes

  // Return the HTML string, and potentially loading/error states if needed by the component
  return { reportHtml, isLoadingReportHtml: isLoading, reportHtmlError: error };
};
