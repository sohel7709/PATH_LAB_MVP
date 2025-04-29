import React from "react";

export default function TestTemplateSelector({ 
  selectedTemplate, 
  availableTemplates, 
  handleTemplateSelect 
}) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold text-blue-700 mb-4 border-b border-blue-100 pb-2">
        Test Template
      </h2>
      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
        <div className="sm:col-span-6">
          <label htmlFor="templateSelect" className="block text-sm font-medium text-gray-700 mb-1">
            Select Test Template
          </label>
          <div className="mt-1">
            <select
              id="templateSelect"
              name="templateSelect"
              className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              onChange={handleTemplateSelect}
              value={selectedTemplate}
            >
              <option value="">Select a template</option>
              <option value="custom">Custom Test</option>
              {availableTemplates.map(template => (
                <option key={template._id} value={template._id}>
                  {template.templateName || template.name} ({template.shortName})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </section>
  );
}
