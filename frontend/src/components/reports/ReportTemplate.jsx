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
    sampleCollectionDate,
    sampleType,
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
        if (!isNaN(min) && !isNaN(max)) {
          return numValue < min || numValue > max;
        }
        return false;
      }
      // Handle less than format: "<10"
      else if (cleanRange.startsWith('<')) {
        const max = parseFloat(cleanRange.substring(1).trim());
        return !isNaN(max) && numValue >= max;
      }
      // Handle less than or equal format: "≤10"
      else if (cleanRange.startsWith('≤')) {
        const max = parseFloat(cleanRange.substring(1).trim());
        return !isNaN(max) && numValue > max;
      }
      // Handle greater than format: ">20"
      else if (cleanRange.startsWith('>')) {
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
        margin: 10mm !important;
      }
      html, body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        background-color: white !important;
        font-size: 12pt !important;
        font-family: ${styling.fontFamily || 'Arial, sans-serif'} !important;
      }
      .report-container {
        width: 100% !important;
        margin: 0 !important;
        padding-top: 35mm !important;
        padding-bottom: 30mm !important;
        box-sizing: border-box !important;
        box-shadow: none !important;
        min-height: calc(297mm - 20mm);
      }
      .report-header {
        position: fixed !important;
        top: 10mm !important;
        left: 10mm !important;
        right: 10mm !important;
        height: 35mm !important;
        padding: 5mm !important;
        box-sizing: border-box !important;
        background-color: white !important;
        z-index: 10 !important;
        page-break-inside: avoid !important;
        overflow: hidden !important;
      }
      .header-image {
        width: 100% !important;
        height: 100% !important;
        object-fit: contain !important;
        display: block !important;
        margin: 0 auto !important;
        vertical-align: top !important;
      }
      .header-warning {
        font-size: 10pt !important;
        padding: 5mm !important;
        text-align: center !important;
      }
      .footer {
        position: fixed !important;
        bottom: 10mm !important;
        left: 10mm !important;
        right: 10mm !important;
        height: 30mm !important;
        padding: 5mm !important;
        box-sizing: border-box !important;
        background-color: white !important;
        z-index: 10 !important;
        border-top: 1pt solid black !important;
        page-break-inside: avoid !important;
        overflow: hidden !important;
      }
      .footer img {
        width: 100% !important;
        height: 100% !important;
        object-fit: contain !important;
        display: block !important;
        margin: 0 auto !important;
        vertical-align: bottom !important;
      }
      .footer-warning {
        font-size: 10pt !important;
        padding: 5mm !important;
        text-align: center !important;
      }
      .report-content {
        padding: 0 !important;
        margin: 0 !important;
        page-break-inside: auto !important;
      }
      .patient-info {
        margin: 0 0 3mm 0 !important;
        padding: 3mm 0 !important;
        width: 100% !important;
        border-bottom: 1pt solid black !important;
        font-size: 12pt !important;
        line-height: 1.4 !important;
        page-break-inside: avoid !important;
      }
      .patient-info .info-row {
        margin-bottom: 2mm !important;
      }
      .patient-info .info-label {
        font-weight: bold !important;
        margin-right: 6px !important;
        min-width: 100px !important;
        display: inline-block !important;
      }
      .test-title {
        margin: 5mm 0 3mm 0 !important;
        padding: 0 !important;
        text-align: center !important;
        font-size: 14pt !important;
        font-weight: bold !important;
        page-break-after: avoid !important;
      }
      .test-data {
        margin: 0 !important;
        width: 100% !important;
        border-collapse: collapse !important;
        font-size: 12pt !important;
        table-layout: fixed !important;
        page-break-inside: auto !important;
      }
      .test-data th, .test-data td {
        padding: 3mm !important;
        vertical-align: middle !important;
        font-size: 12pt !important;
        border: 1px solid black !important;
      }
      .test-data th {
        color: black !important;
        font-weight: bold !important;
        text-align: left !important;
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
        margin: 6mm 0 0 0 !important;
        padding: 0 !important;
        display: flex !important;
        justify-content: flex-end !important;
        width: 100% !important;
        page-break-inside: avoid !important;
        page-break-before: auto !important;
      }
      .signature-container {
        width: 55mm !important;
        text-align: center !important;
      }
      .signature-container img {
        height: 18mm !important;
        margin-bottom: 1mm !important;
        object-fit: contain;
        display: block;
        margin-left: auto;
        margin-right: auto;
      }
      .signature-container .signature-name {
        font-size: 12pt !important;
        margin-top: 1mm !important;
        line-height: 1.3 !important;
      }
      .signature-container .signature-designation {
        font-size: 12pt !important;
        line-height: 1.3 !important;
      }
      .signature-container div[style*="border-bottom"] {
        height: 18mm !important;
        margin-bottom: 1mm !important;
      }
      nav, header, button, .print-controls, .print-hidden, .report-header-placeholder, .report-footer-placeholder {
        display: none !important;
      }
      tr {
        page-break-inside: avoid !important;
      }
      table {
        page-break-inside: auto !important;
        page-break-after: auto !important;
      }
      thead { display: table-header-group !important; }
      tfoot { display: table-footer-group !important; }
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />
      <div className="report-container" style={{
        fontFamily: styling.fontFamily,
        fontSize: '12pt',
        width: '210mm',
        margin: '0 auto'
      }}>
        {/* Header Section */}
        <div className="report-header">
          {showHeader && headerImage ? (
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
            showHeader && !headerImage && (
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
            )
          )}
          {!showHeader && null}
        </div>

        {/* Content area */}
        <div className="report-content" style={{ border: 'none' }}>
          <div style={{
            borderTop: '2px solid black',
            marginBottom: '8px',
            width: '100%'
          }}></div>

          {/* Patient Information */}
          <div className="patient-info" style={{
            marginTop: '0',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            columnGap: '20px',
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
            <div className="patient-info-center" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div className="info-row" style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <span className="info-label" style={{ fontWeight: 'bold', minWidth: '110px' }}>Sample Collection:</span>
                <span>{sampleCollectionDate || 'N/A'}</span>
              </div>
              <div className="info-row" style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <span className="info-label" style={{ fontWeight: 'bold', minWidth: '110px' }}>Sample Type:</span>
                <span>{sampleType || 'Blood'}</span>
              </div>
            </div>
            <div className="patient-info-right" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
            margin: '15px 0 10px 0',
            color: styling.primaryColor
          }}>
            {/* Test Name - Keep original combined name for context? Or remove? */}
            {/* {testName || 'COMPLETE BLOOD COUNT (CBC)'} */}
          </div>

          {/* Test Results - Grouped by Template */}
          {(() => {
            // Group results by templateId
            const grouped = (testResults || []).reduce((acc, param) => {
              const key = param.templateId || 'unknown'; // Group unknown IDs together
              if (!acc[key]) {
                // Attempt to find template name (might need better data source)
                // For now, use section name or placeholder if templateId exists
                const sectionName = param.section && param.section !== 'Default' ? param.section : (testName || 'Test Results'); // Placeholder logic
                acc[key] = { 
                  templateName: key !== 'unknown' ? `Test Group (ID: ${key})` : sectionName, // Placeholder name
                  parameters: [] 
                };
              }
              acc[key].parameters.push(param);
              return acc;
            }, {});

            // Convert grouped object to array
            const groupedResultsArray = Object.values(grouped);

            return groupedResultsArray.map((group, groupIndex) => (
              <div key={groupIndex} className="test-group" style={{ marginBottom: '15px', pageBreakInside: 'avoid' }}>
                {/* Template Name Header */}
                <h3 style={{ textAlign: 'center', fontWeight: 'bold', margin: '10px 0', fontSize: '13pt' }}>
                  {group.templateName}
                </h3>
                {/* Parameters Table for this Template */}
                <table className="test-data" style={{
                  width: 'calc(100% - 2px)', // Adjusted width slightly
            borderCollapse: 'collapse',
            margin: '0',
            border: '1px solid black',
            tableLayout: 'fixed'
          }}>
            <thead>
              <tr>
                <th style={{
                  fontWeight: 'bold',
                  textAlign: 'left',
                  padding: '6px 10px',
                  border: '1px solid black',
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
                  width: '15%'
                }}>Result</th>
                <th style={{
                  fontWeight: 'bold',
                  textAlign: 'left',
                  padding: '6px 10px',
                  border: '1px solid black',
                  width: '10%'
                }}>Unit</th>
                <th style={{
                  fontWeight: 'bold',
                  textAlign: 'left',
                  padding: '6px 10px',
                  border: '1px solid black',
                  color: styling.primaryColor,
                  fontSize: '11pt',
                  verticalAlign: 'middle',
                  width: '35%'
                }}>Reference Range</th>
              </tr>
            </thead>
            <tbody>
              {group.parameters && group.parameters.length > 0 ? (
                group.parameters.map((param, index) => {
                  if (param.isHeader) {
                    return (
                      <tr key={`${groupIndex}-header-${index}`}>
                        <td colSpan="4" style={{
                          fontWeight: 'bold',
                          padding: '8px 10px',
                          border: '1px solid black',
                          backgroundColor: '#f0f0f0',
                          fontSize: '11pt',
                          verticalAlign: 'middle'
                        }}>
                          {param.name}
                        </td>
                      </tr>
                    );
                  } else {
                    const abnormal = isOutsideRange(param.result, param.referenceRange) || param.isAbnormal;
                    const isSub = param.isSubparameter; // Use isSubparameter from param
                    return (
                      <tr key={`${groupIndex}-param-${index}`}>
                        <td style={{
                          padding: isSub ? '6px 10px 6px 25px' : '6px 10px', // Apply indent for subparameters
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
                          {param.result && param.result !== '-' ? param.result : ''}
                        </td>
                        <td style={{
                          padding: '6px 10px',
                          border: '1px solid black',
                          fontSize: '11pt',
                          verticalAlign: 'middle'
                        }}>{param.unit || ''}</td>
                        <td style={{
                          padding: '6px 10px',
                          border: '1px solid black',
                          fontSize: '11pt',
                          verticalAlign: 'middle'
                        }}>
                          {param.referenceRange || ''}
                          {/* Display inline notes if they exist on the parameter */}
                          {param.notes && (
                            <span style={{ display: 'block', fontSize: '10pt', fontStyle: 'italic', marginTop: '2px' }}>
                              {param.notes}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  }
                })
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '6px', border: '1px solid black' }}>
                    No parameters for this group
                  </td>
                </tr>
              )}
            </tbody>
              </table>
              </div>
            ));
          })()}

          {/* Overall Notes Section */}
          {reportData.testNotes && (
            <div className="mt-4" style={{ marginTop: '10px', fontSize: '11pt', pageBreakInside: 'avoid', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
              <h4 style={{ fontWeight: 'bold', marginBottom: '4px' }}>Notes:</h4>
              {reportData.testNotes && (
                <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{reportData.testNotes}</p>
              )}
              {reportData.parameterNotes && (
                <p style={{ whiteSpace: 'pre-wrap', margin: reportData.testNotes ? '8px 0 0 0' : 0 }}>
                  {reportData.parameterNotes}
                </p>
              )}
              
              {/* Special handling for test results with notes */}
              {reportData.testResults && reportData.testResults.some(result => result.notes) && (
                <div style={{ marginTop: '8px' }}>
                  {reportData.testResults
                    .filter(result => result.notes && !result.isHeader)
                    .map((result, idx) => (
                      <p key={idx} style={{ whiteSpace: 'pre-wrap', margin: '4px 0' }}>
                        <strong>{result.name}:</strong> {result.notes}
                      </p>
                    ))}
                </div>
              )}
            </div>
          )}

          {showSignature && (
            <div className="signature-section" style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: '38px',
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
        <div className="footer">
          {showFooter && footerImage ? (
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
            showFooter && !footerImage && (
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
            )
          )}
          {!showFooter && null}
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
    sampleCollectionDate: PropTypes.string,
    sampleType: PropTypes.string,
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
