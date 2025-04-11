import React from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

const Inventory = () => {
  return (
    <div className="bg-white shadow-md rounded-lg p-8 max-w-3xl mx-auto mt-8">
      <div className="flex items-center justify-center mb-6">
        <div className="bg-blue-100 p-3 rounded-full">
          <InformationCircleIcon className="h-8 w-8 text-blue-600" aria-hidden="true" />
        </div>
      </div>
      
      <h1 className="text-2xl font-bold text-center text-gray-900 mb-4">Inventory Management</h1>
      
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <InformationCircleIcon className="h-5 w-5 text-blue-500" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              This feature is coming soon! We're working hard to bring you comprehensive inventory management capabilities.
            </p>
          </div>
        </div>
      </div>
      
      <div className="text-center text-gray-600">
        <p className="mb-4">
          The inventory management system will allow you to:
        </p>
        <ul className="text-left max-w-md mx-auto space-y-2 list-disc pl-5 mb-6">
          <li>Track lab supplies and reagents</li>
          <li>Set up automatic reorder notifications</li>
          <li>Monitor expiration dates</li>
          <li>Generate inventory reports</li>
          <li>Manage equipment maintenance schedules</li>
        </ul>
        <p>
          Thank you for your patience as we develop this feature.
        </p>
      </div>
    </div>
  );
};

export default Inventory;
