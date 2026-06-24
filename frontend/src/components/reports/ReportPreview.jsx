import React from 'react';
import { useReportGenerator } from '../../hooks/useReportGenerator';

// Live preview of the official report. Uses the SAME generator the real report
// uses (useReportGenerator), so the selected header design (classic / centered /
// modern / minimal), footer and styling are all reflected accurately.
const ReportPreview = ({ settings }) => {
  // Sample report data shaped exactly like a real report document so the
  // generator renders header, patient block, results table and footer.
  const sampleReport = {
    patientInfo: {
      designation: 'Mr.',
      name: 'John Doe',
      age: '45',
      gender: 'male',
      patientId: 'P-98765',
      phone: '9876543210',
    },
    testInfo: {
      name: 'Complete Blood Count',
      sampleCollectionDate: new Date().toISOString(),
      sampleType: 'Blood',
      referenceDoctor: 'Dr. Smith',
      sampleId: 'SAMPLE-PREVIEW-0001',
    },
    createdAt: new Date().toISOString(),
    lab: { name: settings?.header?.labName || 'Pathology Laboratory' },
    results: [
      { templateId: 'preview-cbc', templateName: 'Complete Blood Count', parameter: 'Haemoglobin', value: '14.5', unit: 'g/dL', referenceRange: '13.0 - 17.0', flag: 'normal' },
      { templateId: 'preview-cbc', templateName: 'Complete Blood Count', parameter: 'Total WBC Count', value: '12500', unit: '/cumm', referenceRange: '4000 - 11000', flag: 'high' },
      { templateId: 'preview-cbc', templateName: 'Complete Blood Count', parameter: 'Platelet Count', value: '90000', unit: '/cumm', referenceRange: '150000 - 410000', flag: 'low' },
      { templateId: 'preview-cbc', templateName: 'Complete Blood Count', parameter: 'RBC Count', value: '5.2', unit: 'mill/cumm', referenceRange: '4.5 - 6.5', flag: 'normal' },
    ],
    testNotes: '',
    templateNotes: {},
  };

  const reportHtml = useReportGenerator(sampleReport, settings, 'official');

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Report Preview</h3>
        <p className="text-sm text-gray-500 mt-1">
          Live preview using the selected header design. Sample data is for illustration only.
        </p>
        <div className="mt-5 flex justify-center overflow-auto">
          <div
            style={{
              width: '210mm',
              minHeight: '297mm',
              backgroundColor: 'white',
              boxShadow: '0 0 10px rgba(0,0,0,0.15)',
              position: 'relative',
              overflow: 'hidden',
            }}
            dangerouslySetInnerHTML={{ __html: reportHtml }}
          />
        </div>
      </div>
    </div>
  );
};

export default ReportPreview;
