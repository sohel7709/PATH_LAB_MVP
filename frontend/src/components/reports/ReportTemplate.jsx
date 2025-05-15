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
    // testName, // We'll use templateName from groupedResults
    // testResults, // Replaced by groupedResults
    groupedResults, // Expect grouped results from backend/parent component

    // Overall notes (if any, separate from parameter notes)
    testNotes,

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
  const isOutsideRange = (value, referenceRange, patientGender) => {
    if (!value || !referenceRange) return false;

    const cleanValue = value.toString().replace(/,/g, '');
    let cleanRange = referenceRange.toString().replace(/,/g, '');
    const numValue = parseFloat(cleanValue);
    if (isNaN(numValue)) return false;

    // Attempt to parse gender-specific ranges
    const maleRangeMatch = cleanRange.match(/Male:\s*([\d.]+)\s*-\s*([\d.]+)/i);
    const femaleRangeMatch = cleanRange.match(/Female:\s*([\d.]+)\s*-\s*([\d.]+)/i);

    let targetRange = null;

    if (patientGender && patientGender.toLowerCase() === 'male' && maleRangeMatch) {
      targetRange = `${maleRangeMatch[1]}-${maleRangeMatch[2]}`;
    } else if (patientGender && patientGender.toLowerCase() === 'female' && femaleRangeMatch) {
      targetRange = `${femaleRangeMatch[1]}-${femaleRangeMatch[2]}`;
    }

    if (targetRange) {
      cleanRange = targetRange; // Use the gender-specific range
    }
    // If no gender-specific range matched or patientGender is not provided,
    // cleanRange remains the original (or already parsed if it was simple)

    try {
      // Handle range format: "10-20" or "10–20" (with en dash)
      // This part now processes either the original range or the extracted gender-specific range
      if (cleanRange.includes('-') || cleanRange.includes('–')) {
        const separator = cleanRange.includes('-') ? '-' : '–';
        const parts = cleanRange.split(separator);
        // Ensure we only take the first two parts if there are multiple hyphens (e.g. in "Male: X-Y Female: A-B")
        // and a gender-specific range wasn't successfully extracted above.
        if (parts.length >= 2) {
            const min = parseFloat(parts[0].trim());
            const max = parseFloat(parts[1].trim());
            if (!isNaN(min) && !isNaN(max)) {
              return numValue < min || numValue > max;
            }
        }
        // If not a simple X-Y after potential gender parsing, or if parsing failed, it might be a complex string not meant for this logic.
        // Or, if it was a gendered string and no specific gender matched, we might not want to evaluate.
        // For now, if it's not a simple X-Y after this point, return false (not abnormal by this check)
        // unless it's a single-sided range like <X or >X.
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
      console.warn('Invalid reference range format or parsing error:', referenceRange, error);
    }
    return false; // Default to not abnormal if range format is not recognized or parsing fails
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

          {/* Test Results - Iterate over groupedResults from props */}
          {(groupedResults && groupedResults.length > 0) ? (
            groupedResults.map((group, groupIndex) => (
              <div key={groupIndex} className="test-group" style={{ marginBottom: '15px', pageBreakInside: 'avoid' }}>
                {/* Template Name Header - Ensure it uses group.templateName */}
                <h3 style={{ textAlign: 'center', fontWeight: 'bold', margin: '10px 0', fontSize: '13pt' }}>
                  {group.templateName} {/* Directly use the templateName from the group object */}
                </h3>
                {/* Parameters Table for this Template */}
                <table className="test-data" style={{
                  width: 'calc(100% - 2px)', // Adjusted width slightly
            borderCollapse: 'collapse',
            margin: '0',
            border: '1px solid black',
            tableLayout: 'fixed'
          }}>
            {!reportData.hideTableHeadingAndReference && (
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
            )}
                <tbody>
                  {group.parameters && group.parameters.length > 0 ? (
                    group.parameters.map((param, index) => {
                      // Check if the parameter itself is marked as a header
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
                          {param.name || param.parameter} {/* Use name or fallback to parameter */}
                        </td>
                      </tr>
                    );
                  } else {
                    // Determine if the result is abnormal based on flags or range check
                    const abnormal = param.flag === 'high' || param.flag === 'low' || param.flag === 'critical' || isOutsideRange(param.value, param.referenceRange, patientGender);
                    const isSub = param.isSubparameter; // Check if it's a subparameter for indentation

                    return (
                      <tr key={`${groupIndex}-param-${index}`}>
                        {/* Parameter Name */}
                        <td style={{
                          padding: isSub ? '6px 10px 6px 25px' : '6px 10px', // Indent subparameters
                          border: '1px solid black',
                          fontSize: '11pt',
                          verticalAlign: 'middle'
                        }}>{param.parameter || param.name}</td> {/* Use parameter or fallback to name */}

                        {/* Result Value */}
                        <td style={{
                          padding: '6px 10px',
                          border: '1px solid black',
                          color: abnormal ? 'black' : 'inherit',
                          fontWeight: abnormal ? 'bold' : 'normal',
                          backgroundColor: abnormal ? '#fff0f0' : 'transparent',
                          fontSize: '11pt',
                          verticalAlign: 'middle'
                        }}>
                          {/* Display value, handle potential null/undefined */}
                          {param.value !== null && param.value !== undefined ? param.value : ''}
                        </td>

                        {/* Unit */}
                        <td style={{
                          padding: '6px 10px',
                          border: '1px solid black',
                          fontSize: '11pt',
                          verticalAlign: 'middle'
                        }}>{param.unit || ''}</td>

                        {/* Reference Range */}
                        {!reportData.hideTableHeadingAndReference && (
                        <td style={{
                          padding: '6px 10px',
                          border: '1px solid black',
                          fontSize: '11pt',
                          verticalAlign: 'middle'
                        }}>
                          {param.referenceRange || ''}
                          {/* Display parameter-specific notes if they exist */}
                          {param.notes && (
                            <span style={{ display: 'block', fontSize: '10pt', fontStyle: 'italic', marginTop: '2px' }}>
                              {param.notes}
                            </span>
                          )}
                        </td>
                        )}
                      </tr>
                    );
                  }
                })
              ) : (
                // Display if a group has no parameters
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '6px', border: '1px solid black' }}>
                    No parameters found for this section.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {/* Render overall notes AFTER the first group's table */}
          {groupIndex === 0 && testNotes && (
            <div className="mt-4" style={{ marginTop: '10px', fontSize: '11pt', pageBreakInside: 'avoid', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
              <h4 style={{ fontWeight: 'bold', marginBottom: '4px' }}>Notes:</h4>
              <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{testNotes}</p>
            </div>
          )}
        </div>
      ))
    ) : (
      // Display if no groupedResults are provided at all
      <div style={{ textAlign: 'center', padding: '10px', border: '1px solid #ccc', marginTop: '10px' }}>
        No test results available to display.
      </div>
    )}

          {/* REMOVED: Overall Notes Section moved to render after the first group */}

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
    // testName: PropTypes.string, // Removed, using templateName from group
    groupedResults: PropTypes.arrayOf( // Expecting groupedResults
      PropTypes.shape({
        templateName: PropTypes.string,
        parameters: PropTypes.arrayOf(
          PropTypes.shape({
            parameter: PropTypes.string, // Changed from name
            value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // Changed from result
            unit: PropTypes.string,
            referenceRange: PropTypes.string,
            flag: PropTypes.string, // Added flag for abnormality check
            isHeader: PropTypes.bool, // Added isHeader
            isSubparameter: PropTypes.bool, // Added isSubparameter
            notes: PropTypes.string // Added parameter-specific notes
          })
        )
      })
    ),
    testNotes: PropTypes.string, // Overall notes

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
