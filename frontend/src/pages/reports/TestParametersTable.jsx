import React from "react";

export default function TestParametersTable({
  formData,
  selectedTemplate,
  templateIdToDisplay,
  patientGender,
  patientAge,
  getRowBackgroundColor,
  handleParameterChange,
  addParameter,
  removeParameter
}) {
  const isCustomMode = selectedTemplate && selectedTemplate.includes('custom');

  // Helper function to render a single parameter row (header or data)
  const renderParameterRow = (param, index, isSectionedView) => {
    // Find the original index in the *full* formData array for updates
    const globalIndex = isCustomMode ? index : formData.testParameters.findIndex(p =>
      p.templateId === templateIdToDisplay &&
      p.name === param.name &&
      p.section === param.section &&
      p.unit === param.unit // Assuming name+section+unit is unique within a template
    );

    console.log(`Rendering Param (Index: ${index}, Global: ${globalIndex}):`, JSON.stringify(param)); // DEBUG LOG

    const keyPrefix = isSectionedView ? `param-${param.section}` : 'param-flat';

    // --- Render Parameter Header Row ---
    // Render if isHeader is true AND we are not in custom mode
    if (param.isHeader && !isCustomMode) {
      return (
        <tr key={`${keyPrefix}-header-${index}`} className="bg-gray-100">
          <td colSpan="4" className="py-2 px-4 text-sm font-semibold text-gray-700 sm:pl-6">
            {param.name}
          </td>
        </tr>
      );
    }

    // --- Render Standard Data Row (or editable row in custom mode) ---
    const isSub = param.isSubparameter;
    return (
      <tr
        key={`${keyPrefix}-data-${index}`}
        className={getRowBackgroundColor(param.name, param.value, param.referenceRange, patientGender, patientAge)}
      >
        {/* Parameter Name Column */}
        <td className={`py-3 pr-3 text-sm font-medium text-gray-900 ${isSub ? 'pl-8 sm:pl-10' : 'pl-4 sm:pl-6'}`}>
          {isCustomMode ? (
            <input
              type="text"
              value={param.name || ''}
              onChange={(e) => handleParameterChange(globalIndex, 'name', e.target.value)}
              placeholder="Parameter name"
              className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
            />
          ) : (
            param.name // Display name if not custom
          )}
        </td>

        {/* Value Column */}
        <td className="px-3 py-3 text-sm">
          {/* Render dropdown only if NOT in custom mode and inputType/options are correct */}
          {param.inputType === 'dropdown' && Array.isArray(param.options) && !isCustomMode ? (
            <select
              value={param.value || ''} // Ensure value is controlled
              onChange={(e) => handleParameterChange(globalIndex, 'value', e.target.value)}
              className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
            >
              <option value="">Select...</option>
              {param.options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          ) : (
            <input // Text input for others or custom mode
              type="text"
              value={param.value || ''} // Ensure value is controlled
              onChange={(e) => handleParameterChange(globalIndex, 'value', e.target.value)}
              className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
            />
          )}
        </td>

        {/* Unit Column */}
        <td className="px-3 py-3 text-sm text-gray-500">
          {isCustomMode ? (
            <input
              type="text"
              value={param.unit || ''}
              onChange={(e) => handleParameterChange(globalIndex, 'unit', e.target.value)}
              placeholder="Unit"
              className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
            />
          ) : (
            param.unit
          )}
        </td>

        {/* Reference Range Column */}
        <td className="px-3 py-3 text-sm text-gray-500">
          {isCustomMode ? (
            <input
              type="text"
              value={param.referenceRange || ''}
              onChange={(e) => handleParameterChange(globalIndex, 'referenceRange', e.target.value)}
              placeholder="e.g. 10-20"
              className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
            />
          ) : (
            param.referenceRange
          )}
        </td>

        {/* Actions Column (Custom Mode Only) */}
        {isCustomMode && (
          <td className="relative py-3 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
            <button
              type="button"
              onClick={() => removeParameter(globalIndex)}
              className="text-red-600 hover:text-red-900"
            >
              Remove
            </button>
          </td>
        )}
      </tr>
    );
  };


  return (
    <section className="mb-8">
      {/* Filter parameters based on the templateIdToDisplay prop */}
      {(() => {
        const parametersToDisplay = templateIdToDisplay
          ? formData.testParameters.filter(p => p.templateId === templateIdToDisplay)
          : formData.testParameters; // Show all if no specific template ID is given (e.g., custom)

        // Handle case where no parameters are available
        if (parametersToDisplay.length === 0) {
          const isCustom = selectedTemplate && selectedTemplate.includes('custom');
          const hasSelectedTemplates = selectedTemplate && selectedTemplate.length > 0 && !isCustom;
          return (
            <div className="mt-4 text-sm text-gray-500 bg-blue-50 p-4 rounded-lg border border-blue-100">
              {isCustom
                ? 'Add parameters for your custom test.'
                : (hasSelectedTemplates ? 'No parameters defined for this template.' : 'Please select a test template or add custom parameters.')}
            </div>
          );
        }

        // Determine if the *filtered* parameters have sections
        const displayHasSections = parametersToDisplay.some(p => p.section && p.section !== 'Default');

        return (
          <div className="mt-4 bg-white rounded-lg border border-blue-100 overflow-hidden shadow-sm">
            {displayHasSections && !isCustomMode ? ( // Render sectioned view
              (() => {
                const sectionedParams = parametersToDisplay.reduce((acc, param) => {
                  const section = param.section || 'Default';
                  if (!acc[section]) acc[section] = [];
                  acc[section].push(param);
                  return acc;
                }, {});

                return Object.entries(sectionedParams).map(([section, sectionParameters], sectionIndex) => (
                  <div key={`${templateIdToDisplay}-${section}-${sectionIndex}`} className="mb-6">
                    {/* Render section title only if it's not 'Default' */}
                    {section !== 'Default' && (
                      <h4 className="text-md font-medium text-blue-600 bg-blue-50 px-4 py-2 border-b border-blue-100">{section}</h4>
                    )}
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-blue-100">
                        {/* Render thead only for the first section */}
                        {sectionIndex === 0 && (
                          <thead className="bg-blue-50">
                            <tr>
                              <th scope="col" className="py-3 pl-4 pr-3 text-left text-sm font-semibold text-gray-700 sm:pl-6">Parameter</th>
                              <th scope="col" className="px-3 py-3 text-left text-sm font-semibold text-gray-700">Value</th>
                              <th scope="col" className="px-3 py-3 text-left text-sm font-semibold text-gray-700">Unit</th>
                              <th scope="col" className="px-3 py-3 text-left text-sm font-semibold text-gray-700">Reference Range</th>
                            </tr>
                          </thead>
                        )}
                        <tbody className="divide-y divide-blue-50">
                          {sectionParameters.map((param, paramIndex) => renderParameterRow(param, paramIndex, true))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ));
              })()
            ) : (
              // Render flat table for non-sectioned templates or custom mode
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-blue-100">
                    <thead className="bg-blue-50">
                      <tr>
                        <th scope="col" className="py-3 pl-4 pr-3 text-left text-sm font-semibold text-gray-700 sm:pl-6">Parameter</th>
                        <th scope="col" className="px-3 py-3 text-left text-sm font-semibold text-gray-700">Value</th>
                        <th scope="col" className="px-3 py-3 text-left text-sm font-semibold text-gray-700">Unit</th>
                        <th scope="col" className="px-3 py-3 text-left text-sm font-semibold text-gray-700">Reference Range</th>
                        {isCustomMode && (
                          <th scope="col" className="relative py-3 pl-3 pr-4 sm:pr-6">
                            <span className="sr-only">Actions</span>
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-50">
                      {parametersToDisplay.map((param, index) => renderParameterRow(param, index, false))}
                    </tbody>
                  </table>
                </div>
                {/* Add Parameter Button for Custom Mode */}
                {isCustomMode && (
                  <div className="mt-4 text-right">
                    <button
                      type="button"
                      onClick={addParameter}
                      className="px-4 py-2 rounded-lg border border-transparent bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium shadow hover:from-blue-700 hover:to-blue-600 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      Add Parameter
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })()}
    </section>
  );
}
