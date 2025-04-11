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
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return false;

    try {
      if (referenceRange.includes('-')) {
        const [min, max] = referenceRange.split('-').map(Number);
        return numValue < min || numValue > max;
      } else if (referenceRange.startsWith('<')) {
        return numValue >= parseFloat(referenceRange.substring(1));
      } else if (referenceRange.startsWith('>')) {
        return numValue <= parseFloat(referenceRange.substring(1));
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
        margin: 0 !important;
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
        margin: 0 !important;
        padding: 5mm 10mm !important; /* Reduced padding to fit more content on one page */
        width: calc(100% - 20mm) !important; /* Account for padding */
        height: auto !important;
        box-shadow: none !important;
        overflow: visible !important;
        font-size: 10pt !important; /* Slightly smaller font size to fit more content */
        max-height: 277mm !important; /* Maximum height for A4 page minus margins */
      }
      
      /* Ensure header and footer are visible when printing */
      .report-header, .footer, .signature-section {
        display: block !important;
        visibility: visible !important;
        page-break-inside: avoid !important;
      }
      
      /* Make header more compact */
      .report-header {
        margin-bottom: 5mm !important;
      }
      
      /* Make the header image smaller */
      .header-image {
        max-height: 100px !important;
      }
      
      /* Ensure images are visible */
      .header-image, .footer img, .signature-image {
        display: block !important;
        visibility: visible !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* Hide any UI elements that shouldn't be in the printed report */
      nav, header, button, .print-controls, .print-hidden {
        display: none !important;
      }
      
      /* Make patient info more compact */
      .patient-info {
        margin-top: 5mm !important;
        padding: 5mm 0 !important;
      }
      
      /* Make test title more compact */
      .test-title {
        margin: 5mm 0 !important;
      }
      
      /* Optimize table for printing */
      .test-data {
        page-break-inside: avoid !important;
        margin: 5mm 0 !important;
        width: 100% !important;
        max-width: 100% !important;
      }
      
      .test-data th, .test-data td {
        padding: 4px !important;
        font-size: 9pt !important;
      }
      
      /* Make signature section more compact */
      .signature-section {
        margin: 10mm 5mm 5mm 0 !important;
      }
      
      /* Make footer more compact */
      .footer {
        margin-top: 5mm !important;
        padding-top: 5mm !important;
      }
      
      /* Remove browser's default headers and footers */
      @page {
        margin: 0;
      }
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />
      <div className="report-container" style={{ fontFamily: styling.fontFamily, fontSize: `${styling.fontSize}pt` }}>
      {/* Header Section */}
      <div className="report-header">
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
          <div className="lab-info" style={{ 
            display: 'flex', 
            padding: '15px', 
            borderBottom: `2px solid ${styling.primaryColor}`,
            background: `linear-gradient(to right, ${styling.primaryColor}, ${styling.secondaryColor})`,
            color: 'white'
          }}>
            <div className="lab-logo" style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              backgroundColor: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '20px'
            }}>
              <span>LOGO</span>
            </div>
            <div className="lab-details" style={{ flex: 1 }}>
              <h1 className="lab-name" style={{
                fontSize: '24pt',
                fontWeight: 'bold',
                color: 'white',
                textAlign: 'center',
                marginBottom: '10px'
              }}>{labName || 'Pathology Laboratory'}</h1>
              <div className="doctors-info" style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '10px'
              }}>
                <div className="doctor-card" style={{
                  textAlign: 'center',
                  padding: '0 10px',
                  borderRight: '1px solid rgba(255,255,255,0.3)'
                }}>
                  <p className="doctor-name" style={{ fontWeight: 'bold', color: '#ff6b6b' }}>{doctorName || 'Dr. Consultant'}</p>
                  <p>MBBS, DPB (Pathology)</p>
                  <p>Reg. No.12345</p>
                </div>
                <div className="doctor-card" style={{
                  textAlign: 'center',
                  padding: '0 10px',
                  borderRight: '1px solid rgba(255,255,255,0.3)'
                }}>
                  <p className="doctor-name" style={{ fontWeight: 'bold', color: '#ff6b6b' }}>Lab Technician</p>
                  <p>Bsc DMLT</p>
                </div>
                <div className="doctor-card" style={{
                  textAlign: 'center',
                  padding: '0 10px',
                  borderRight: '1px solid rgba(255,255,255,0.3)'
                }}>
                  <p className="doctor-name" style={{ fontWeight: 'bold', color: '#ff6b6b' }}>Lab Technician</p>
                  <p>BSc DMLT</p>
                  <p>Reg No 12345</p>
                </div>
                <div className="doctor-card" style={{
                  textAlign: 'center',
                  padding: '0 10px'
                }}>
                  <p className="doctor-name" style={{ fontWeight: 'bold', color: '#ff6b6b' }}>Lab Technician</p>
                  <p>Lab Technician</p>
                </div>
              </div>
            </div>
          </div>
        )}
        {!headerImage && (
          <div className="lab-address" style={{
            textAlign: 'center',
            marginTop: '10px',
            fontSize: '10pt'
          }}>
            {address || 'Lab Address'}. Phone: {phone || 'N/A'}
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
        margin: '20px',
        maxWidth: 'calc(100% - 40px)'
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
                    color: abnormal ? 'red' : 'inherit',
                    fontWeight: abnormal ? 'bold' : 'normal'
                  }}>{param.result}</td>
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

      {/* Footer */}
      <div className="footer" style={{
        width: '100%',
        marginTop: 'auto',
        borderTop: `2px solid ${styling.primaryColor}`,
        paddingTop: '10px',
        backgroundColor: '#f9f9f9'
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
          <div className="footer-text" style={{
            textAlign: 'center',
            fontSize: '10pt',
            padding: '10px',
            backgroundColor: styling.primaryColor,
            color: 'white'
          }}>
            This is a computer-generated report and does not require a physical signature. The results relate only to the samples tested.
            For any queries, please contact the laboratory at the address/phone number mentioned above.
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
