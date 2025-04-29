import React from "react";
import { dropdownParams } from "./TestParametersUtils";

export default function TestParametersTable({
  formData,
  selectedTemplate, // This might represent all selected IDs now
  templateIdToDisplay, // ID of the template this instance should display
  // hasSections prop might be less relevant now as we determine sections based on filtered params
  showCRPTest,
  setShowCRPTest,
  patientGender,
  patientAge,
  getRowBackgroundColor,
  handleParameterChange,
  addParameter, // Re-add addParameter prop
  removeParameter
}) {
  const isCustomMode = selectedTemplate && selectedTemplate.includes('custom'); // Define isCustomMode earlier

  return (
    <section className="mb-8">
      {/* Header section removed as it's now rendered per template in TestParametersForm */}
      {/* Filter parameters based on the templateIdToDisplay prop */}
      {(() => {
        const parametersToDisplay = templateIdToDisplay
          ? formData.testParameters.filter(p => p.templateId === templateIdToDisplay)
          : formData.testParameters; // Show all if no specific template ID is given (e.g., custom)

        // Handle case where no parameters are available for the selected template(s)
        if (parametersToDisplay.length === 0) {
          // Check if 'custom' is selected or if templates are selected but have no params
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
        // const isCustomMode = selectedTemplate && selectedTemplate.includes('custom'); // Moved definition inside else block

        return (
          <div className="mt-4 bg-white rounded-lg border border-blue-100 overflow-hidden shadow-sm">
            {displayHasSections && !isCustomMode ? ( // Render sectioned view only if sections exist and not in custom mode
              (() => {
                const sectionedParams = parametersToDisplay.reduce((acc, param) => {
                  const section = param.section || 'Default';
                  if (!acc[section]) acc[section] = [];
                  acc[section].push(param);
                  return acc;
                }, {});
                const hasCRPSection = !!sectionedParams["CRP test"]; // Check within filtered params

                return Object.entries(sectionedParams).map(([section, sectionParameters], sectionIndex) => {
                  let checkbox = null;
                  // Checkbox logic for CRP test
                  if (section === "Default" && hasCRPSection) {
                    checkbox = (
                      <div style={{ margin: "12px 0" }}>
                        <label style={{ fontWeight: 500, color: "#2563eb" }}>
                          <input
                            type="checkbox"
                            checked={showCRPTest}
                            onChange={() => setShowCRPTest(v => !v)}
                            style={{ marginRight: "8px" }}
                          />
                          Show CRP test (SERUM FOR C - REACTIVE PROTEINS)
                        </label>
                      </div>
                    );
                  }
                  // Hide CRP section if checkbox is unchecked
                  if (section === "CRP test" && !showCRPTest) {
                    return null;
                  }

                  return (
                    <div key={`${templateIdToDisplay}-${section}-${sectionIndex}`} className="mb-6">
                      {checkbox}
                      {/* Render section title only if it's not 'Default' or if it's the only section */}
                      {(section !== 'Default' || Object.keys(sectionedParams).length === 1) && (
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
                                {/* Actions column only needed in custom mode, which uses the flat table */}
                              </tr>
                            </thead>
                          )}
                          <tbody className="divide-y divide-blue-50">
                            {sectionParameters
                              .filter(param => !(section === "Default" && param.name === "SERUM FOR C - REACTIVE PROTEINS")) // Filter out CRP from Default if checkbox logic applies
                              .map((param, paramIndex) => {
                                // Find the original index in the *full* formData array for updates
                                const globalIndex = formData.testParameters.findIndex(p =>
                                  p.templateId === templateIdToDisplay &&
                                  p.name === param.name &&
                                  p.section === param.section &&
                                  p.unit === param.unit // Assuming name+section+unit is unique within a template
                                );

                                if (param.isHeader) {
                                  return (
                                    <tr key={`header-${section}-${paramIndex}`} className="bg-blue-100">
                                      <td colSpan={4} className="py-3 px-4 text-sm font-semibold text-blue-800 sm:pl-6">
                                        {param.name}
                                      </td>
                                    </tr>
                                  );
                                }
                                
                                const isSub = param.isSubparameter;
                                return (
                                  <tr
                                    key={`${section}-${paramIndex}`}
                                    className={getRowBackgroundColor(param.name, param.value, param.referenceRange, patientGender, patientAge)}
                                  >
                                    <td className={`py-3 pr-3 text-sm font-medium text-gray-900 ${isSub ? 'pl-8 sm:pl-10' : 'pl-4 sm:pl-6'}`}>
                                      {param.name}
                                    </td>
                                    <td className="px-3 py-3 text-sm">
                                      {Object.prototype.hasOwnProperty.call(dropdownParams, param.name) ? (
                                        <select
                                          value={param.value}
                                          onChange={(e) => handleParameterChange(globalIndex, 'value', e.target.value)}
                                          className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                                        >
                                          <option value="">Select...</option>
                                          {dropdownParams[param.name].map(option => (
                                            <option key={option} value={option}>{option}</option>
                                          ))}
                                        </select>
                                      ) : (
                                        <input
                                          type="text"
                                          value={param.value}
                                          onChange={(e) => handleParameterChange(globalIndex, 'value', e.target.value)}
                                          className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                                        />
                                      )}
                                    </td>
                                    <td className="px-3 py-3 text-sm text-gray-500">
                                      {param.unit}
                                    </td>
                                    <td className="px-3 py-3 text-sm text-gray-500">
                                      {param.referenceRange}
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                });
              })()
            ) : (
              // Render flat table for non-sectioned templates or custom mode
              <> {/* Wrap in fragment to add button */}
                {(() => { // IIFE to define isCustomMode locally
                  const isCustomMode = selectedTemplate && selectedTemplate.includes('custom');
                  return (
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
                    {parametersToDisplay.map((param, index) => {
                      // Find the original index in the *full* formData array for updates
                      // For custom mode, templateIdToDisplay might be null/undefined, so findIndex might need adjustment
                      // Or, rely on the 'index' if we assume custom params are always added at the end
                       const globalIndex = isCustomMode ? index : formData.testParameters.findIndex(p =>
                        p.templateId === templateIdToDisplay &&
                        p.name === param.name &&
                        p.section === param.section && // Assuming section might be undefined in custom mode
                        p.unit === param.unit
                      );

                      if (param.isHeader && !isCustomMode) { // Don't render headers in custom mode flat table
                        return (
                          <tr key={`header-flat-${index}`} className="bg-blue-100">
                            <td colSpan={isCustomMode ? 5 : 4} className="py-3 px-4 text-sm font-semibold text-blue-800 sm:pl-6">
                              {param.name}
                            </td>
                          </tr>
                        );
                      }
                      
                      const isSub = param.isSubparameter;
                      return (
                        <tr
                          key={`flat-${index}`}
                          className={getRowBackgroundColor(param.name, param.value, param.referenceRange, patientGender, patientAge)}
                        >
                          <td className={`py-3 pr-3 text-sm font-medium text-gray-900 ${isSub ? 'pl-8 sm:pl-10' : 'pl-4 sm:pl-6'}`}>
                            {isCustomMode ? (
                              <input
                                type="text"
                                value={param.name}
                                onChange={(e) => handleParameterChange(globalIndex, 'name', e.target.value)}
                                placeholder="Parameter name"
                                className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                              />
                            ) : (
                              param.name
                            )}
                          </td>
                          <td className="px-3 py-3 text-sm">
                            {Object.prototype.hasOwnProperty.call(dropdownParams, param.name) && !isCustomMode ? (
                              <select
                                value={param.value}
                                onChange={(e) => handleParameterChange(globalIndex, 'value', e.target.value)}
                                className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                              >
                                <option value="">Select...</option>
                                {dropdownParams[param.name].map(option => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={param.value}
                                onChange={(e) => handleParameterChange(globalIndex, 'value', e.target.value)}
                                className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                              />
                            )}
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-500">
                            {isCustomMode ? (
                              <input
                                type="text"
                                value={param.unit}
                                onChange={(e) => handleParameterChange(globalIndex, 'unit', e.target.value)}
                                placeholder="Unit"
                                className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                              />
                            ) : (
                              param.unit
                            )}
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-500">
                            {isCustomMode ? (
                              <input
                                type="text"
                                value={param.referenceRange}
                                onChange={(e) => handleParameterChange(globalIndex, 'referenceRange', e.target.value)}
                                placeholder="e.g. 10-20"
                                className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                              />
                            ) : (
                              param.referenceRange
                            )}
                          </td>
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
                    })}
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
                  );
                })()}
              </>
            )}
          </div>
        );
      })()}
    </section>
  );
}
