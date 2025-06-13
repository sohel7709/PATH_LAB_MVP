/**
 * Print Styles Utility
 * 
 * This utility injects a print-specific stylesheet into the document
 * that forces all content to be black-only with no borders when printing.
 */

export const injectPrintStyles = () => {
  // Check if print styles are already injected
  if (document.getElementById('black-only-print-styles')) {
    return;
  }

  // Create a style element
  const style = document.createElement('style');
  style.id = 'black-only-print-styles';
  style.media = 'print';
  
  // Define print-specific CSS
  style.textContent = `
    /* Force black text and white background for all elements */
    * {
      color: black !important;
      background-color: white !important;
      border-color: black !important;
      box-shadow: none !important;
      text-shadow: none !important;
    }
    
    /* Remove all borders from tables */
    table, th, td {
      border: none !important;
      border-collapse: collapse !important;
    }
    
    /* Hide navigation and UI elements */
    nav, .sidebar, button, .btn, .nav, .navbar, .header, .footer, 
    .no-print, [role="navigation"], [role="banner"], [role="complementary"] {
      display: none !important;
    }
    
    /* Ensure full width content */
    body, .container, .content, main, .main-content {
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    
    /* Highlight abnormal values with underline only */
    .abnormal {
      font-weight: bold !important;
      text-decoration: underline !important;
    }
    
    /* Links should not be colored */
    a, a:link, a:visited {
      color: black !important;
      text-decoration: none !important;
    }
    
    /* Force all text to be visible */
    p, h1, h2, h3, h4, h5, h6, span, div {
      color: black !important;
    }
    
    /* Remove background images */
    * {
      background-image: none !important;
    }
    
    /* Ensure proper page breaks */
    .page-break {
      page-break-before: always;
    }
    
    /* Specific overrides for report elements */
    .report-title, .test-header, .test-name {
      color: black !important;
      font-weight: bold !important;
    }
    
    /* Override any table styling */
    .test-table, .test-results {
      border: none !important;
    }
    
    .test-table th, .test-table td, 
    .test-header, .test-row, 
    .test-name, .test-result, .test-unit, .test-range {
      border: none !important;
      color: black !important;
    }
  `;
  
  // Append the style element to the document head
  document.head.appendChild(style);
  
  console.log('Black-only print styles injected');
};

export const removePrintStyles = () => {
  const style = document.getElementById('black-only-print-styles');
  if (style) {
    style.remove();
    console.log('Black-only print styles removed');
  }
};
