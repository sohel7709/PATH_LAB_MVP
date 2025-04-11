import React from 'react';
import PropTypes from 'prop-types';

const ReportTemplate = ({ reportData }) => {
  const {
    // Header data
    headerImage,
    labName,
    doctorName,
    address,
    phone,
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
    
    // Styling
    styling = {
      primaryColor: '#007bff',
      secondaryColor: '#6c757d',
      fontFamily: 'Arial, sans-serif',
      fontSize: 12
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
        margin: 5mm !important; /* Reduced margin for A4 paper */
      }
      
      html, body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background-color: white !important;
      }
      
      .report-container {
        margin: 0 auto !important;
        padding: 0 !important;
        width: 100% !important;
        height: auto !important;
        box-shadow: none !important;
        overflow: visible !important;
        font-size: 9pt !important; /* Smaller font size to fit on one page */
        max-width: 100% !important; /* Full width */
        box-sizing: border-box !important;
        page-break-after: avoid !important;
        page-break-before: avoid !important;
      }
      
      /* Ensure header and footer are visible when printing */
      .report-header, .footer, .signature-section {
        display: block !important;
        visibility: visible !important;
        page-break-inside: avoid !important;
        width: 100% !important;
      }
      
      /* Optimize header */
      .report-header {
        margin-bottom: 5mm !important;
        text-align: center !important;
        width: 100% !important;
      }
      
      /* Optimize header image */
      .header-image {
        max-height: 20mm !important;
        margin: 0 auto !important;
        width: 100% !important;
      }
      
      /* Ensure images are visible */
      .header-image, .footer img, .signature-image {
        display: block !important;
        visibility: visible !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* Hide any UI elements that shouldn't be in the printed report */
      nav, header, button, .print-controls, .print-hidden, .report-header-placeholder, .report-footer-placeholder, .header-warning, .footer-warning {
        display: none !important;
      }
      
      /* Optimize patient info section */
      .patient-info {
        margin: 2mm 0 !important;
        padding: 2mm 0 !important;
        width: 100% !important;
        border-bottom: 1pt solid #007bff !important;
      }
      
      /* Optimize test title */
      .test-title {
        margin: 3mm 0 !important;
        text-align: center !important;
        font-size: 12pt !important;
        font-weight: bold !important;
      }
      
      /* Optimize table for printing */
      .test-data {
        page-break-inside: avoid !important;
        margin: 0 !important;
        width: 100% !important;
        border-collapse: collapse !important;
        font-size: 8pt !important; /* Smaller font size for table */
      }
      
      .test-data th {
        padding: 3px !important;
        font-size: 8pt !important;
        background-color: #f5f5f5 !important;
        border: 1px solid #ddd !important;
        color: #007bff !important;
        font-weight: bold !important;
        text-align: left !important;
      }
      
      .test-data td {
        padding: 3px !important;
        font-size: 8pt !important;
        border: 1px solid #ddd !important;
      }
      
      /* Ensure abnormal values are visible when printing */
      td[style*="fontWeight: bold"] {
        color: black !important;
        font-weight: bold !important;
        background-color: #fff0f0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      
      /* Optimize signature section */
      .signature-section {
        margin: 5mm 0 3mm 0 !important;
        display: flex !important;
        justify-content: flex-end !important;
        width: 100% !important;
      }
      
      .signature-container {
        width: 40mm !important;
        text-align: center !important;
      }
      
      /* Optimize footer */
      .footer {
        margin-top: 3mm !important;
        padding-top: 2mm !important;
        border-top: 1pt solid #007bff !important;
        width: 100% !important;
      }
      
      /* Force single page */
      .report-container * {
        page-break-inside: avoid !important;
      }
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />
      <div className="report-container" style={{ fontFamily: styling.fontFamily, fontSize: `${styling.fontSize}pt` }}>
      {/* Header Section */}
      <div className="report-header" style={{ width: '100%', display: showHeader ? 'block' : 'none' }}>
        {headerImage ? (
          <div style={{ width: '100%', textAlign: 'center', overflow: 'hidden' }}>
            <img 
              src={headerImage} 
              alt="Lab Header" 
              className="header-image"
              style={{ 
                width: '100%', 
                maxHeight: '150px', 
                objectFit: 'contain',
                display: 'block',
                margin: '0 auto'
              }}
            />
          </div>
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

      {/* Patient Information */}
      <div className="patient-info" style={{
        marginTop: '10px',
        display: 'flex',
        justifyContent: 'space-between',
        padding: '10px 20px',
        borderBottom: `2px solid ${styling.primaryColor}`
      }}>
        <div className="patient-info-left" style={{ width: '48%' }}>
          <div className="info-row" style={{ marginBottom: '5px' }}>
            <span className="info-label" style={{ fontWeight: 'bold', display: 'inline-block', marginRight: '5px' }}>Patient Name:</span>
            <span>{patientName || 'N/A'}</span>
          </div>
          <div className="info-row" style={{ marginBottom: '5px' }}>
            <span className="info-label" style={{ fontWeight: 'bold', display: 'inline-block', marginRight: '5px' }}>Age/Gender:</span>
            <span>{patientAge || 'N/A'} Years / {patientGender || 'N/A'}</span>
          </div>
          <div className="info-row" style={{ marginBottom: '5px' }}>
            <span className="info-label" style={{ fontWeight: 'bold', display: 'inline-block', marginRight: '5px' }}>Patient ID:</span>
            <span>{patientId || 'N/A'}</span>
          </div>
        </div>
        <div className="patient-info-right" style={{ width: '48%' }}>
          <div className="info-row" style={{ marginBottom: '5px' }}>
            <span className="info-label" style={{ fontWeight: 'bold', display: 'inline-block', marginRight: '5px' }}>Sample Collection:</span>
            <span>{sampleCollectionDate || 'N/A'}</span>
          </div>
          <div className="info-row" style={{ marginBottom: '5px' }}>
            <span className="info-label" style={{ fontWeight: 'bold', display: 'inline-block', marginRight: '5px' }}>Sample Type:</span>
            <span>{sampleType || 'Blood'}</span>
          </div>
          <div className="info-row" style={{ marginBottom: '5px' }}>
            <span className="info-label" style={{ fontWeight: 'bold', display: 'inline-block', marginRight: '5px' }}>Referring Doctor:</span>
            <span>{referringDoctor || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Test Title */}
      <div className="test-title" style={{
        textAlign: 'center',
        fontSize: '16pt',
        fontWeight: 'bold',
        margin: '20px 0',
        color: styling.primaryColor
      }}>
        {testName || 'COMPLETE BLOOD COUNT (CBC)'}
      </div>

      {/* Test Results Table */}
      <table className="test-data" style={{
        width: '100%',
        borderCollapse: 'collapse',
        margin: '0',
        border: '1px solid #ddd'
      }}>
        <thead>
          <tr>
            <th style={{
              backgroundColor: '#f5f5f5',
              fontWeight: 'bold',
              textAlign: 'left',
              padding: '8px',
              border: '1px solid #ddd',
              color: styling.primaryColor
            }}>Test</th>
            <th style={{
              backgroundColor: '#f5f5f5',
              fontWeight: 'bold',
              textAlign: 'left',
              padding: '8px',
              border: '1px solid #ddd',
              color: styling.primaryColor
            }}>Result</th>
            <th style={{
              backgroundColor: '#f5f5f5',
              fontWeight: 'bold',
              textAlign: 'left',
              padding: '8px',
              border: '1px solid #ddd',
              color: styling.primaryColor
            }}>Unit</th>
            <th style={{
              backgroundColor: '#f5f5f5',
              fontWeight: 'bold',
              textAlign: 'left',
              padding: '8px',
              border: '1px solid #ddd',
              color: styling.primaryColor
            }}>Reference Range</th>
          </tr>
        </thead>
        <tbody>
          {testResults && testResults.length > 0 ? (
            testResults.map((param, index) => {
              const abnormal = isOutsideRange(param.result, param.referenceRange) || param.isAbnormal;
              return (
                <tr key={index}>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{param.name}</td>
                  <td style={{ 
                    padding: '8px', 
                    border: '1px solid #ddd',
                    color: abnormal ? 'black' : 'inherit',
                    fontWeight: abnormal ? 'bold' : 'normal',
                    backgroundColor: abnormal ? '#fff0f0' : 'transparent'
                  }}>
                    {param.result}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{param.unit}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{param.referenceRange}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center', padding: '8px', border: '1px solid #ddd' }}>
                No test parameters available
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Signature Section */}
      <div className="signature-section" style={{
        display: 'flex',
        justifyContent: 'flex-end',
        margin: '40px 20px 20px 0'
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
          <div className="signature-name" style={{ fontWeight: 'bold', marginTop: '5px' }}>
            Dr. {verifiedBy || 'Consultant'}
          </div>
          <div className="signature-designation" style={{ fontSize: '10pt', color: '#666' }}>
            {designation || 'Pathologist'}
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="footer" style={{
        width: '100%',
        marginTop: 'auto',
        borderTop: `2px solid ${styling.primaryColor}`,
        paddingTop: '10px',
        backgroundColor: '#f9f9f9',
        display: showFooter ? 'block' : 'none'
      }}>
        {footerImage ? (
          <div style={{ width: '100%', textAlign: 'center', overflow: 'hidden' }}>
            <img 
              src={footerImage} 
              alt="Footer" 
              style={{ 
                width: '100%', 
                maxHeight: '100px', 
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
            border: '1px solid #ffeeba',
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
