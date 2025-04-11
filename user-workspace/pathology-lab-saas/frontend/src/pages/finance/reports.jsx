import React from 'react';
import { InformationCircleIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const FinancialReports = () => {
  return (
    <div className="bg-white shadow-md rounded-lg p-8 max-w-3xl mx-auto mt-8">
      <div className="flex items-center justify-center mb-6">
        <div className="bg-green-100 p-3 rounded-full">
          <ChartBarIcon className="h-8 w-8 text-green-600" aria-hidden="true" />
        </div>
      </div>
      
      <h1 className="text-2xl font-bold text-center text-gray-900 mb-4">Financial Reports</h1>
      
      <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <InformationCircleIcon className="h-5 w-5 text-green-500" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-green-700">
              This feature is coming soon! We're working hard to bring you comprehensive financial reporting capabilities.
            </p>
          </div>
        </div>
      </div>
      
      <div className="text-center text-gray-600">
        <p className="mb-4">
          The financial reporting system will allow you to:
        </p>
        <ul className="text-left max-w-md mx-auto space-y-2 list-disc pl-5 mb-6">
          <li>Generate revenue reports by test type, doctor, or time period</li>
          <li>Track expenses and calculate profit margins</li>
          <li>Analyze payment collection efficiency</li>
          <li>Monitor insurance claim status</li>
          <li>Export financial data for accounting purposes</li>
          <li>Create custom financial dashboards</li>
        </ul>
        <p>
          Thank you for your patience as we develop this feature.
        </p>
      </div>
    </div>
  );
};

export default FinancialReports;
