import React from 'react';

const ViewTemplateModal = ({ template, onClose }) => {
  if (!template) {
    return null; // Don't render if no template is provided
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">View Template: {template.name}</h2>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="font-mono text-sm bg-gray-100 p-4 rounded-md whitespace-pre-wrap break-words">
          {JSON.stringify(template.jsonSchema, null, 2)}
        </div>
        <div className="mt-6 text-right">
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewTemplateModal;
