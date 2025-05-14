import React from 'react';
import ReportTemplate from './ReportTemplate';
import { formatDate } from '../../utils/helpers'; // Adjusted path
import { DATE_FORMATS } from '../../utils/constants'; // Adjusted path

const ReportPreview = ({ settings }) => {
  // Prepare sample data for the preview
  const sampleReportData = {
    // Header data
    headerImage: settings.header.headerImage || '',
    labName: settings.header.labName || 'Pathology Laboratory',
    doctorName: settings.header.doctorName || 'Dr. Consultant',
    address: settings.header.address || 'Lab Address, Main Road, City',
    phone: settings.header.phone || '1234567890',
    
    // Patient data
    patientName: 'John Doe',
    patientAge: '45',
    patientGender: 'Male',
    patientId: 'P-98765',
    
    // Sample data
    sampleCollectionDate: formatDate(new Date(), DATE_FORMATS.DD_MM_YYYY),
    sampleType: 'Blood',
    referringDoctor: 'Dr. Smith',
    
    // Test data
    testName: 'COMPLETE BLOOD COUNT (CBC)',
    testResults: [
      {
        name: 'Hemoglobin',
        result: '14.5',
        unit: 'g/dL',
        referenceRange: '13.0 - 17.0',
        isAbnormal: false
      },
      {
        name: 'WBC Count',
        result: '7.5',
        unit: 'x10³/μL',
        referenceRange: '4.5 - 11.0',
        isAbnormal: false
      }
    ],
    
    // Signature data
    signatureImage: settings.footer.signature || '',
    verifiedBy: settings.footer.verifiedBy || 'Lab Incharge',
    designation: settings.footer.designation || 'Pathologist',
    
    // Footer data
    footerImage: settings.footer.footerImage || '',
    
    // Styling
    styling: settings.styling || {
      primaryColor: '#007bff',
      secondaryColor: '#6c757d',
      fontFamily: 'Arial, sans-serif',
      fontSize: 12
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Report Preview</h3>
        <div className="mt-5 border-2 border-gray-300 p-4" style={{ 
          width: '210mm', 
          minHeight: '297mm', 
          margin: '0 auto',
          backgroundColor: 'white',
          boxShadow: '0 0 10px rgba(0,0,0,0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <ReportTemplate reportData={sampleReportData} />
        </div>
      </div>
    </div>
  );
};

export default ReportPreview;
