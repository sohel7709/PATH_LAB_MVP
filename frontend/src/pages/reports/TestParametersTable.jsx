import React from "react";
import { dropdownParams } from "./TestParametersUtils";

export default function TestParametersTable({
  formData,
  selectedTemplate,
  hasSections,
  showCRPTest,
  setShowCRPTest,
  patientGender,
  patientAge,
  getRowBackgroundColor,
  handleParameterChange,
  addParameter,
  removeParameter
}) {
  return (
    <section className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-blue-700 border-b border-blue-100 pb-2 flex-grow">
          Test Parameters
        </h2>
        {selectedTemplate === 'custom' && (
          <button
            type="button"
            onClick={addParameter}
            className="ml-4 px-4 py-2 rounded-lg border border-transparent bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium shadow hover:from-blue-700 hover:to-blue-600 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Add Parameter
          </button>
        )}
      </div>
      {formData.testParameters.length === 0 ? (
        <div className="mt-4 text-sm text-gray-500 bg-blue-50 p-4 rounded-lg border border-blue-100">
          {selectedTemplate ? 'No parameters defined for this template.' : 'Please select a test template to see parameters.'}
        </div>
      ) : (
        <div className="mt-4 bg-white rounded-lg border border-blue-100 overflow-hidden shadow-sm">
          {hasSections ? (
            (() => {
              const sectionedParams = formData.testParameters.reduce((acc, param) => {
                const section = param.section || 'Default';
                if (!acc[section]) acc[section] = [];
                acc[section].push(param);
                return acc;
              }, {});
              const hasCRPSection = !!sectionedParams["CRP test"];
              return Object.entries(sectionedParams).map(([section, parameters], sectionIndex) => {
                let checkbox = null;
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
                if (section === "CRP test" && !showCRPTest) {
                  return null;
                }
                return (
                  <div key={sectionIndex} className="mb-6">
                    {checkbox}
                    <h4 className="text-md font-medium text-blue-600 bg-blue-50 px-4 py-2 border-b border-blue-100">{section}</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-blue-100">
                        <thead className="bg-blue-50">
                          <tr>
                            <th scope="col" className="py-3 pl-4 pr-3 text-left text-sm font-semibold text-gray-700 sm:pl-6">Parameter</th>
                            <th scope="col" className="px-3 py-3 text-left text-sm font-semibold text-gray-700">Value</th>
                            <th scope="col" className="px-3 py-3 text-left text-sm font-semibold text-gray-700">Unit</th>
                            <th scope="col" className="px-3 py-3 text-left text-sm font-semibold text-gray-700">Reference Range</th>
                            <th scope="col" className="relative py-3 pl-3 pr-4 sm:pr-6">
                              {selectedTemplate === 'custom' && <span className="sr-only">Actions</span>}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-50">
                          {parameters
                            .filter(param => !(section === "Default" && param.name === "SERUM FOR C - REACTIVE PROTEINS"))
                            .map((param, paramIndex) => {
                              const globalIndex = formData.testParameters.findIndex(p =>
                                p.name === param.name && p.section === param.section
                              );
                              if (param.isHeader) {
                                return (
                                  <tr key={`header-${section}-${paramIndex}`} className="bg-blue-100">
                                    <td className="py-3 px-4 text-sm font-semibold text-blue-800 sm:pl-6">
                                      {param.name}
                                    </td>
                                    <td className="px-3 py-3" colSpan={selectedTemplate === 'custom' ? 4 : 3}></td>
                                  </tr>
                                );
                              }
                              if (section === "Default" && param.name === "SERUM FOR C - REACTIVE PROTEINS") {
                                return (
                                  <tr key={`crp-checkbox-${paramIndex}`}>
                                    <td className="py-3 pr-3 text-sm font-medium text-gray-900 pl-4 sm:pl-6">
                                      <label>
                                        <input
                                          type="checkbox"
                                          checked={showCRPTest}
                                          onChange={() => setShowCRPTest(v => !v)}
                                          style={{ marginRight: "8px" }}
                                        />
                                        {param.name}
                                      </label>
                                    </td>
                                    <td className="px-3 py-3 text-sm"></td>
                                    <td className="px-3 py-3 text-sm text-gray-500"></td>
                                    <td className="px-3 py-3 text-sm text-gray-500"></td>
                                    {selectedTemplate === 'custom' && (
                                      <td className="relative py-3 pl-3 pr-4 text-right text-sm font-medium sm:pr-6"></td>
                                    )}
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
                                  {selectedTemplate === 'custom' && (
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
                  </div>
                );
              });
            })()
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-blue-100">
                <thead className="bg-blue-50">
                  <tr>
                    <th scope="col" className="py-3 pl-4 pr-3 text-left text-sm font-semibold text-gray-700 sm:pl-6">Parameter</th>
                    <th scope="col" className="px-3 py-3 text-left text-sm font-semibold text-gray-700">Value</th>
                    <th scope="col" className="px-3 py-3 text-left text-sm font-semibold text-gray-700">Unit</th>
                    <th scope="col" className="px-3 py-3 text-left text-sm font-semibold text-gray-700">Reference Range</th>
                    <th scope="col" className="relative py-3 pl-3 pr-4 sm:pr-6">
                      {selectedTemplate === 'custom' && <span className="sr-only">Actions</span>}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  {formData.testParameters.map((param, index) => {
                    if (param.isHeader) {
                      return (
                        <tr key={`header-flat-${index}`} className="bg-blue-100">
                          <td className="py-3 px-4 text-sm font-semibold text-blue-800 sm:pl-6">
                            {param.name}
                          </td>
                          <td className="px-3 py-3" colSpan={selectedTemplate === 'custom' ? 4 : 3}></td>
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
                          {selectedTemplate === 'custom' ? (
                            <input
                              type="text"
                              value={param.name}
                              onChange={(e) => handleParameterChange(index, 'name', e.target.value)}
                              placeholder="Parameter name"
                              className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                            />
                          ) : (
                            param.name
                          )}
                        </td>
                        <td className="px-3 py-3 text-sm">
                          {Object.prototype.hasOwnProperty.call(dropdownParams, param.name) && selectedTemplate !== 'custom' ? (
                            <select
                              value={param.value}
                              onChange={(e) => handleParameterChange(index, 'value', e.target.value)}
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
                              onChange={(e) => handleParameterChange(index, 'value', e.target.value)}
                              className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                            />
                          )}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-500">
                          {selectedTemplate === 'custom' ? (
                            <input
                              type="text"
                              value={param.unit}
                              onChange={(e) => handleParameterChange(index, 'unit', e.target.value)}
                              placeholder="Unit"
                              className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                            />
                          ) : (
                            param.unit
                          )}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-500">
                          {selectedTemplate === 'custom' ? (
                            <input
                              type="text"
                              value={param.referenceRange}
                              onChange={(e) => handleParameterChange(index, 'referenceRange', e.target.value)}
                              placeholder="e.g. 10-20"
                              className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                            />
                          ) : (
                            param.referenceRange
                          )}
                        </td>
                        {selectedTemplate === 'custom' && (
                          <td className="relative py-3 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <button
                              type="button"
                              onClick={() => removeParameter(index)}
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
          )}
        </div>
      )}
    </section>
  );
}
