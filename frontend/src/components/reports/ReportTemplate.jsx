import React from 'react';
import PropTypes from 'prop-types';

const ReportTemplate = ({ reportData }) => {
  const {
    // Header data
    headerImage,
    showHeader = true,
    
    // Patient data
    patientName,
    patientAge,
    patientGender,
    patientId,
    
    // Sample data
    reportDate,
    referringDoctor,
    
    // Test data
    testName,
    testResults,
    
    // Signature data
    signatureImage,
    verifiedBy,
    designation,
    
    // Footer data
    footerImage,
    showFooter = true,
    showSignature = true,
    
    // Styling
    styling = {
      primaryColor: '#000000', // Changed to black for better printing
      secondaryColor: '#000000',
      fontFamily: 'Arial, sans-serif',
      fontSize: 12 // Default screen font size
    }
  } = reportData || {};

  // Function to check if a value is outside the reference range
  const isOutsideRange = (value, referenceRange) => {
    if (!value || !referenceRange) return false;
    
    // Clean the value and reference range by removing commas
    const cleanValue = value.toString().replace(/,/g, '');
    const cleanRange = referenceRange.toString().replace(/,/g, '');
    
    const numValue = parseFloat(cleanValue);
    if (isNaN(numValue)) return false;

    try {
      // Handle range format: "10-20" or "10–20" (with en dash)
      if (cleanRange.includes('-') || cleanRange.includes('–')) {
        const separator = cleanRange.includes('-') ? '-' : '–';
        const [min, max] = cleanRange.split(separator).map(v => parseFloat(v.trim()));
        
        // Check if min and max are valid numbers
        if (!isNaN(min) && !isNaN(max)) {
          return numValue < min || numValue > max;
        }
        return false;
      } 
      // Handle less than format: "<10"
      else if (cleanRange.startsWith('<')) { // Use < for HTML entity
        const max = parseFloat(cleanRange.substring(1).trim());
        return !isNaN(max) && numValue >= max;
      } 
      // Handle less than or equal format: "≤10"
      else if (cleanRange.startsWith('≤')) {
        const max = parseFloat(cleanRange.substring(1).trim());
        return !isNaN(max) && numValue > max;
      } 
      // Handle greater than format: ">20"
      else if (cleanRange.startsWith('>')) { // Use > for HTML entity
        const min = parseFloat(cleanRange.substring(1).trim());
        return !isNaN(min) && numValue <= min;
      } 
      // Handle greater than or equal format: "≥5"
      else if (cleanRange.startsWith('≥')) {
        const min = parseFloat(cleanRange.substring(1).trim());
        return !isNaN(min) && numValue < min;
      }
      // Handle "less than" text format
      else if (cleanRange.toLowerCase().includes('less than')) {
        const max = parseFloat(cleanRange.toLowerCase().replace('less than', '').trim());
        return !isNaN(max) && numValue >= max;
      }
      // Handle "greater than" text format
      else if (cleanRange.toLowerCase().includes('greater than')) {
        const min = parseFloat(cleanRange.toLowerCase().replace('greater than', '').trim());
        return !isNaN(min) && numValue <= min;
      }
    } catch (error) {
      console.warn('Invalid reference range:', referenceRange, error);
    }
    return false;
  };

  // Define print styles
  const printStyles = `
    @media print {
      @page {
        size: A4 portrait;
        margin: 0 !important; /* Margins handled by padding */
        padding: 0 !important;
      }
      
      html, body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: 100% !important; /* Needed for fixed positioning context */
        background-color: white !important;
        font-size: 12pt !important; /* Set base print font size */
        font-family: ${styling.fontFamily || 'Arial, sans-serif'} !important;
        overflow: hidden !important;
        position: relative !important;
      }
      
      .report-container {
        margin: 0 !important; 
        padding-top: 35mm !important; /* Space for fixed header */
        padding-bottom: 30mm !important; /* Space for fixed footer */
        padding-left: 5mm !important; 
        padding-right: 5mm !important;
        width: 210mm !important; /* A4 width */
        height: 297mm !important; /* A4 height */
        box-sizing: border-box !important;
        box-shadow: none !important;
        overflow: hidden !important;
        page-break-after: avoid !important;
        page-break-before: avoid !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
      }

      /* Fixed Header */
      .report-header {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        height: 35mm !important; /* Fixed header height */
        padding: 5mm !important; /* Internal padding */
        box-sizing: border-box !important;
        width: 100% !important;
        overflow: hidden !important;
        page-break-after: avoid !important;
        background-color: white !important; /* Ensure background */
        z-index: 10 !important;
      }
      .header-image {
        width: 100% !important;
        height: 100% !important;
        object-fit: contain !important; 
        display: block !important; 
        margin: 0 !important; 
        padding: 0 !important; 
        vertical-align: top !important; 
      }
       .header-warning {
         font-size: 10pt !important;
         padding: 5mm !important;
       }


      /* Fixed Footer */
      .footer {
        position: fixed !important;
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
        height: 30mm !important; /* Fixed footer height */
        padding: 5mm !important; /* Internal padding */
        box-sizing: border-box !important;
        width: 100% !important;
        overflow: hidden !important;
        page-break-before: avoid !important;
        background-color: white !important; /* Ensure background */
        z-index: 10 !important;
        border-top: 1pt solid ${styling.primaryColor || '#007bff'} !important;
      }
       .footer img {
         width: 100% !important;
         height: 100% !important;
         object-fit: contain !important;
         display: block !important;
         margin: 0 !important;
         padding: 0 !important;
         vertical-align: bottom !important;
       }
       .footer-warning {
         font-size: 10pt !important;
         padding: 5mm !important;
       }

      /* Content Area Adjustments */
      .patient-info {
        margin: 0 0 2mm 0 !important; /* Minimal bottom margin */
        padding: 0 !important; 
        width: 100% !important;
        border-bottom: 1pt solid ${styling.primaryColor || '#007bff'} !important;
        font-size: 12pt !important; /* Standard font size */
        line-height: 1.3 !important; 
      }
      .patient-info .info-row {
         margin-bottom: 1mm !important; 
      }
      .patient-info .info-label {
         font-weight: bold !important;
         margin-right: 5px !important;
      }
      
      .test-title {
        margin: 2mm 0 !important; 
        padding: 0 !important; 
        text-align: center !important;
        font-size: 14pt !important; /* Larger title */
        font-weight: bold !important;
      }
      
      .test-data {
        margin: 0 !important;
        width: 100% !important;
        border-collapse: collapse !important;
        font-size: 12pt !important; /* Standard font size */
        table-layout: fixed !important; /* Fixed table layout for better width control */
        border: 1px solid black !important;
      }
      
      .test-data td {
        padding: 3mm !important; /* Increased padding */
        border: 1px solid black !important;
        vertical-align: middle !important; /* Center content vertically */
        font-size: 12pt !important; /* Ensure consistent font size */
       }
       
       .test-data th {
         padding: 3mm !important; /* Increased padding */
         border: 2px solid black !important;
         vertical-align: middle !important; /* Center content vertically */
         font-size: 12pt !important; /* Ensure consistent font size */
         color: ${styling.primaryColor || '#007bff'} !important;
         font-weight: bold !important;
         text-align: left !important;
       }
       
       /* Ensure table borders are visible */
       .test-data, .test-data th, .test-data td {
         border-style: solid !important;
         border-color: black !important;
         border-width: 1px !important;
       }
       
       .test-data th {
         border-width: 1px !important;
       }
       
       .test-data td {
         border-width: 1px !important;
       }

      td[style*="fontWeight: bold"] {
        color: black !important;
        font-weight: bold !important;
        background-color: #fff0f0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      
      .signature-section {
        margin: 5mm 0 0 0 !important; /* Only top margin */
        padding: 0 !important; 
        display: flex !important;
        justify-content: flex-end !important;
        width: 100% !important;
        page-break-inside: avoid !important;
      }
      
      .signature-container {
        width: 50mm !important; 
        text-align: center !important;
      }
      .signature-container img {
         height: 15mm !important; 
         margin-bottom: 1mm !important;
      }
       .signature-container .signature-name {
         font-size: 12pt !important; 
         margin-top: 1mm !important;
         line-height: 1.2 !important;
       }
       .signature-container .signature-designation {
         font-size: 12pt !important; 
         line-height: 1.2 !important;
       }
       .signature-container div[style*="border-bottom"] { /* Placeholder line */
          height: 15mm !important; 
          margin-bottom: 1mm !important;
       }

      /* Hide UI elements */
      nav, header, button, .print-controls, .print-hidden, .report-header-placeholder, .report-footer-placeholder {
        display: none !important;
      }
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />
      {/* Use screen styles for non-print view */}
      <div className="report-container" style={{ 
        fontFamily: styling.fontFamily, 
        fontSize: `12pt`,
        width: '210mm',
        margin: '0 auto'
      }}>
        {/* Header Section */}
        <div className="report-header" style={{ 
          width: '100%', 
          display: 'block', /* Always reserve space even when not showing content */
          position: 'relative',
          height: '35mm', /* Fixed header height */
          overflow: 'hidden',
          visibility: showHeader ? 'visible' : 'hidden' /* Hide content but keep space */
        }}>
          {headerImage ? (
            <img 
              src={headerImage} 
              alt="Lab Header" 
              className="header-image"
              style={{ 
                width: '100%', 
                height: '100%',
                objectFit: 'contain',
                display: 'block',
                margin: '0 auto' 
              }}
            />
          ) : (
            // Show warning message if header data is not available
            <div className="header-warning" style={{ 
              padding: '15px', 
              backgroundColor: '#fff3cd', 
              color: '#856404',
              border: '1px solid #ffeeba',
              borderRadius: '4px',
              textAlign: 'center',
              margin: '10px 0'
            }}>
              <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>⚠️ Header Not Available</p>
              <p style={{ fontSize: '0.9em' }}>Please configure header in lab settings</p>
            </div>
          )}
        </div>

        {/* Content area with patient info and test results */}
        <div className="report-content" style={{
          position: 'relative',
          top: showHeader ? '35mm' : '0',
          paddingTop: '5mm',
          paddingBottom: showFooter ? '30mm' : '5mm',
          paddingLeft: '5mm',
          paddingRight: '5mm',
          overflow: 'hidden',
          border: 'none' /* Ensure no border on the content container */
        }}>
          {/* Horizontal line above patient info */}
          <div style={{
            borderTop: '2px solid black',
            marginBottom: '8px',
            width: '100%'
          }}></div>

          {/* Patient Information */}
          <div className="patient-info" style={{
            marginTop: '0',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            columnGap: '10mm',
            padding: '5px 0 5px 0',
            borderBottom: '2px solid black',
            fontSize: '11pt',
            lineHeight: '1.3'
          }}>
            <div className="patient-info-left" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div className="info-row" style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <span className="info-label" style={{ fontWeight: 'bold', minWidth: '110px' }}>Patient Name:</span>
                <span>{patientName || 'N/A'}</span>
              </div>
              <div className="info-row" style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <span className="info-label" style={{ fontWeight: 'bold', minWidth: '110px' }}>Age/Gender:</span>
                <span>{patientAge || 'N/A'} Years / {patientGender || 'N/A'}</span>
              </div>
              <div className="info-row" style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <span className="info-label" style={{ fontWeight: 'bold', minWidth: '110px' }}>Patient ID:</span>
                <span>{patientId || 'N/A'}</span>
              </div>
            </div>
            <div className="patient-info-right" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div className="info-row" style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <span className="info-label" style={{ fontWeight: 'bold', minWidth: '110px' }}>Report Date:</span>
                <span>{reportDate || 'N/A'}</span>
              </div>
              <div className="info-row" style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <span className="info-label" style={{ fontWeight: 'bold', minWidth: '110px' }}>Referring Doctor:</span>
                <span>{referringDoctor || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Test Title */}
          <div className="test-title" style={{
            textAlign: 'center',
            fontSize: '14pt', 
            fontWeight: 'bold',
            margin: '15px 0 10px 0', // Adjusted margin
            color: styling.primaryColor
          }}>
            {testName || 'COMPLETE BLOOD COUNT (CBC)'}
          </div>

          {/* Test Results Table */}
          <table className="test-data" style={{
            width: '100%',
            borderCollapse: 'collapse',
            margin: '0',
            border: '1px solid black',
            tableLayout: 'fixed' // Ensure fixed layout for consistent layout
          }}>
            <thead>
              <tr>
                <th style={{
                  fontWeight: 'bold',
                  textAlign: 'left',
                  padding: '6px 10px',
                  border: '1px solid black',
                  borderCollapse: 'collapse',
                  color: styling.primaryColor,
                  fontSize: '11pt',
                  verticalAlign: 'middle',
                  width: '40%'
                }}>Test</th>
                <th style={{
                  fontWeight: 'bold',
                  textAlign: 'left',
                  padding: '6px 10px',
                  border: '1px solid black',
                  borderCollapse: 'collapse',
                  color: styling.primaryColor,
                  fontSize: '11pt',
                  verticalAlign: 'middle',
                  width: '15%'
                }}>Result</th>
                <th style={{
                  fontWeight: 'bold',
                  textAlign: 'left',
                  padding: '6px 10px',
                  border: '1px solid black',
                  borderCollapse: 'collapse',
                  color: styling.primaryColor,
                  fontSize: '11pt',
                  verticalAlign: 'middle',
                  width: '10%'
                }}>Unit</th>
                <th style={{
                  fontWeight: 'bold',
                  textAlign: 'left',
                  padding: '6px 10px',
                  border: '1px solid black',
                  borderCollapse: 'collapse',
                  color: styling.primaryColor,
                  fontSize: '11pt',
                  verticalAlign: 'middle',
                  width: '35%'
                }}>Reference Range</th>
              </tr>
            </thead>
            <tbody>
              {testResults && testResults.length > 0 ? (
                testResults.map((param, index) => {
                  const abnormal = isOutsideRange(param.result, param.referenceRange) || param.isAbnormal;
                  return (
                    <tr key={index}>
                      <td style={{ 
                        padding: '6px 10px', 
                        border: '1px solid black',
                        fontSize: '11pt',
                        verticalAlign: 'middle'
                      }}>{param.name}</td>
                      <td style={{ 
                        padding: '6px 10px', 
                        border: '1px solid black',
                        color: abnormal ? 'black' : 'inherit',
                        fontWeight: abnormal ? 'bold' : 'normal',
                        backgroundColor: abnormal ? '#fff0f0' : 'transparent',
                        fontSize: '11pt',
                        verticalAlign: 'middle'
                      }}>
                        {param.result === '-' ? '' : param.result}
                      </td>
                      <td style={{ 
                        padding: '6px 10px', 
                        border: '1px solid black',
                        fontSize: '11pt',
                        verticalAlign: 'middle'
                      }}>{param.unit}</td>
                      <td style={{ 
                        padding: '6px 10px', 
                        border: '1px solid black',
                        fontSize: '11pt',
                        verticalAlign: 'middle'
                      }}>{param.referenceRange}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '6px', border: '1px solid black' }}>
                    No test parameters available
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {showSignature && (
            <div className="signature-section" style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: 'auto', /* Push to bottom of content */
              marginBottom: '10mm',
              width: '100%'
            }}>
              <div className="signature-container" style={{
                textAlign: 'center',
                width: '200px' 
              }}>
                {signatureImage ? (
                  <div style={{ width: '100%', textAlign: 'center', overflow: 'hidden' }}>
                    <img 
                      src={signatureImage} 
                      alt="Signature" 
                      className="signature-image"
                      style={{ 
                        height: '60px', 
                        objectFit: 'contain',
                        display: 'block',
                        margin: '0 auto'
                      }}
                    />
                  </div>
                ) : (
                  <div style={{ height: '60px', borderBottom: '1px solid #000' }}></div> 
                )}
                <div className="signature-name" style={{ fontWeight: 'bold', marginTop: '5px', fontSize: '12pt' }}> 
                  Dr. {verifiedBy || 'Consultant'}
                </div>
                <div className="signature-designation" style={{ fontSize: '12pt', color: '#666' }}> 
                  {designation || 'Pathologist'}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer Section */}
        <div className="footer" style={{
          width: '100%',
          position: 'absolute',
          bottom: '0',
          left: '0',
          right: '0',
          borderTop: `1px solid black`,
          height: '30mm', /* Fixed footer height */
          overflow: 'hidden',
          display: 'block', /* Always reserve space even when not showing content */
          visibility: showFooter ? 'visible' : 'hidden' /* Hide content but keep space */
        }}>
          {footerImage ? (
            <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
              <img 
                src={footerImage} 
                alt="Footer" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain',
                  display: 'block',
                  margin: '0 auto'
                }}
              />
            </div>
          ) : (
            // Show warning message if footer data is not available
            <div className="footer-warning" style={{ 
              padding: '15px', 
              backgroundColor: '#fff3cd', 
              color: '#856404',
              border: '1px solid black',
              borderRadius: '4px',
              textAlign: 'center',
              margin: '10px 0'
            }}>
              <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>⚠️ Footer Not Available</p>
              <p style={{ fontSize: '0.9em' }}>Please configure footer in lab settings</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

ReportTemplate.propTypes = {
  reportData: PropTypes.shape({
    // Header data
    headerImage: PropTypes.string,
    labName: PropTypes.string,
    doctorName: PropTypes.string,
    address: PropTypes.string,
    phone: PropTypes.string,
    
    // Patient data
    patientName: PropTypes.string,
    patientAge: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    patientGender: PropTypes.string,
    patientId: PropTypes.string,
    
    // Sample data
    reportDate: PropTypes.string,
    referringDoctor: PropTypes.string,
    
    // Test data
    testName: PropTypes.string,
    testResults: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        result: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        unit: PropTypes.string,
        referenceRange: PropTypes.string,
        isAbnormal: PropTypes.bool
      })
    ),
    
    // Signature data
    signatureImage: PropTypes.string,
    verifiedBy: PropTypes.string,
    designation: PropTypes.string,
    
    // Footer data
    footerImage: PropTypes.string,
    
    // Styling
    styling: PropTypes.shape({
      primaryColor: PropTypes.string,
      secondaryColor: PropTypes.string,
      fontFamily: PropTypes.string,
      fontSize: PropTypes.number
    })
  })
};

export default ReportTemplate;
