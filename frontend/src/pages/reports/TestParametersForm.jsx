import { useState, useEffect } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { testTemplates } from '../../utils/api';
import { TEST_CATEGORIES, REPORT_STATUS } from '../../utils/constants';

export default function TestParametersForm({ 
  formData, 
  setFormData, 
  patientGender,
  setError
}) {
  // Using _isLoading to avoid ESLint warning since it's used in setIsLoading
  const [_isLoading, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [availableTemplates, setAvailableTemplates] = useState([]);
  // Using _templateDetails to avoid ESLint warning since it's used in setTemplateDetails
  const [_templateDetails, setTemplateDetails] = useState(null);
  const [hasSections, setHasSections] = useState(false);

  // Fetch available test templates
  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      // Get user role from localStorage for debugging
      const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
      const userRole = userFromStorage.role || '';
      console.log('Current user role:', userRole);
      
      // Use the appropriate API method based on user role
      let response;
      
      // Use the appropriate API method based on user role
      console.log('Using standard API method for role:', userRole);
      response = await testTemplates.getAll();
      console.log('Standard API response:', response);
      
      if (response && response.data) {
        setAvailableTemplates(response.data);
        
        // If templates are available, select the first one by default
        if (response.data.length > 0) {
          const firstTemplate = response.data[0];
          setSelectedTemplate(firstTemplate._id);
          await fetchTemplateDetails(firstTemplate._id);
        } else {
          // If no templates are available, set up for custom test
          setSelectedTemplate('custom');
          setFormData(prev => ({
            ...prev,
            testName: 'Custom Test',
            category: 'pathology',
            sampleType: '',
            testParameters: []
          }));
          setTemplateDetails(null);
          setHasSections(false);
        }
      } else {
        console.error('Invalid response format:', response);
        setError('Failed to load test templates. Invalid response format.');
        setSelectedTemplate('custom');
      }
    } catch (err) {
      console.error('Error fetching test templates:', err);
      setError(`Failed to load test templates: ${err.message || 'Unknown error'}`);
      
      // Set up for custom test in case of error
      setSelectedTemplate('custom');
      setFormData(prev => ({
        ...prev,
        testName: 'Custom Test',
        category: 'pathology',
        sampleType: '',
        testParameters: []
      }));
      setTemplateDetails(null);
      setHasSections(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch template details by ID
  const fetchTemplateDetails = async (templateId) => {
    if (!templateId) return;
    
    try {
      setIsLoading(true);
      
      // Get user role from localStorage for debugging
      const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
      const userRole = userFromStorage.role || '';
      console.log('Fetching template details for role:', userRole);
      
      // Use the appropriate API method based on user role
      let response;
      
      // Fetch template details for all user roles
      console.log('Using standard API method for template details');
      response = await testTemplates.getById(templateId, userRole);
      console.log('Standard API template details response:', response);
  
      if (response && response.data) {
        const template = response.data;
        setTemplateDetails(template);
  
        // Check if template has sections
        const hasTemplateSections = template.sections && Object.keys(template.sections).length > 0;
        setHasSections(hasTemplateSections);
  
        // Update form data with template details
        let parameters = [];
  
        if (hasTemplateSections) {
          // Flatten sections into parameters for the form
          Object.entries(template.sections).forEach(([sectionName, sectionParams]) => {
            sectionParams.forEach(param => {
              parameters.push({
                name: param.parameter,
                value: '',
                unit: param.unit || '',
                referenceRange: param.reference_range || '',
                section: sectionName
              });
            });
          });
        } else if (template.fields && template.fields.length > 0) {
          // Use fields directly
          parameters = template.fields.map(field => ({
            name: field.parameter,
            value: '',
            unit: field.unit || '',
            referenceRange: field.reference_range || ''
          }));
        }
  
        setFormData(prev => ({
          ...prev,
          testName: template.name,
          category: template.category,
          sampleType: template.sampleType,
          testParameters: parameters
        }));
      }
    } catch (err) {
      console.error('Error fetching template details:', err);
      setError(`Failed to load template details: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle test template selection
  const handleTemplateSelect = async (e) => {
    const templateId = e.target.value;
    setSelectedTemplate(templateId);
    
    if (templateId && templateId !== 'custom') {
      await fetchTemplateDetails(templateId);
    } else {
      // Reset form for custom template
      setFormData(prev => ({
        ...prev,
        testName: 'Custom Test',
        category: 'pathology',
        sampleType: '',
        testParameters: []
      }));
      setTemplateDetails(null);
      setHasSections(false);
    }
  };

  // Handle parameter value changes
  const handleParameterChange = (index, field, value) => {
    const newParameters = [...formData.testParameters];
    newParameters[index] = {
      ...newParameters[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      testParameters: newParameters
    }));
  };

  // Add custom parameter
  const addParameter = () => {
    setFormData(prev => ({
      ...prev,
      testParameters: [
        ...prev.testParameters,
        { name: '', value: '', unit: '', referenceRange: '' }
      ]
    }));
  };

  // Remove parameter
  const removeParameter = (index) => {
    setFormData(prev => ({
      ...prev,
      testParameters: prev.testParameters.filter((_, i) => i !== index)
    }));
  };

  // Check if value is within normal range
  const isValueNormal = (value, referenceRange) => {
    if (!value || !referenceRange) return true;
    
    // Debug logging
    console.log(`Checking value: ${value} against range: ${referenceRange}`);
    
    // Convert value to number (remove commas if present)
    const numValue = parseFloat(value.toString().replace(/,/g, ''));
    if (isNaN(numValue)) return true; // If value is not a number, consider it normal
    
    console.log(`Parsed value: ${numValue}`);
    
    // Handle gender-specific ranges like "M: 13.5–18.0; F: 11.5–16.4"
    const genderMatch = referenceRange.match(/M:\s*(\d+\.?\d*)[–-](\d+\.?\d*);\s*F:\s*(\d+\.?\d*)[–-](\d+\.?\d*)/);
    if (genderMatch) {
      const maleMin = parseFloat(genderMatch[1]);
      const maleMax = parseFloat(genderMatch[2]);
      const femaleMin = parseFloat(genderMatch[3]);
      const femaleMax = parseFloat(genderMatch[4]);
      
      console.log(`Gender match - Male range: ${maleMin}-${maleMax}, Female range: ${femaleMin}-${femaleMax}`);
      
      // Use the appropriate range based on patient gender
      if (patientGender === 'male' && !isNaN(maleMin) && !isNaN(maleMax)) {
        return numValue >= maleMin && numValue <= maleMax;
      } else if (patientGender === 'female' && !isNaN(femaleMin) && !isNaN(femaleMax)) {
        return numValue >= femaleMin && numValue <= femaleMax;
      } else {
        // If gender is not specified or is 'other', use the wider range
        const minValue = Math.min(maleMin, femaleMin);
        const maxValue = Math.max(maleMax, femaleMax);
        
        if (!isNaN(minValue) && !isNaN(maxValue)) {
          return numValue >= minValue && numValue <= maxValue;
        }
      }
    }
    
    // Clean the reference range by removing commas
    const cleanRange = referenceRange.replace(/,/g, '');
    console.log(`Cleaned range: ${cleanRange}`);
    
    // Handle numeric ranges like "10-20" or "10–20" (with en dash) or "10 - 20" (with spaces)
    const numericMatch = cleanRange.match(/(\d+\.?\d*)\s*[–-]\s*(\d+\.?\d*)/);
    if (numericMatch) {
      const min = parseFloat(numericMatch[1]);
      const max = parseFloat(numericMatch[2]);
      
      console.log(`Numeric match - Range: ${min}-${max}, Value: ${numValue}`);
      
      if (!isNaN(min) && !isNaN(max)) {
        const result = numValue >= min && numValue <= max;
        console.log(`Is value normal? ${result}`);
        return result;
      }
    }
    
    // Handle "Up to X" format
    const upToMatch = cleanRange.match(/Up\s+to\s+(\d+\.?\d*)/i);
    if (upToMatch) {
      const max = parseFloat(upToMatch[1]);
      
      if (!isNaN(max)) {
        return numValue <= max;
      }
    }
    
    // Handle ranges with < or > symbols like "<5" or ">10"
    const lessThanMatch = cleanRange.match(/\s*<\s*(\d+\.?\d*)/);
    if (lessThanMatch) {
      const max = parseFloat(lessThanMatch[1]);
      
      if (!isNaN(max)) {
        return numValue < max;
      }
    }
    
    const greaterThanMatch = cleanRange.match(/\s*>\s*(\d+\.?\d*)/);
    if (greaterThanMatch) {
      const min = parseFloat(greaterThanMatch[1]);
      
      if (!isNaN(min)) {
        return numValue > min;
      }
    }
    
    // Debug log for unmatched reference ranges
    console.log('Unmatched reference range format:', referenceRange);
    return true;
  };
  
  // Get row background color based on value
  const getRowBackgroundColor = (value, referenceRange) => {
    if (!value || !referenceRange) return '';
    
    return isValueNormal(value, referenceRange) 
      ? '' 
      : 'bg-red-200 text-red-800 font-medium';
  };

  // Fetch templates when component mounts
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <>
      {/* Test Template Selection */}
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
                    {template.name} - {template.category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Test Information */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-blue-700 mb-4 border-b border-blue-100 pb-2">
          Test Information
        </h2>
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <label htmlFor="testName" className="block text-sm font-medium text-gray-700 mb-1">
              Test Name
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="testName"
                id="testName"
                required
                value={formData.testName}
                onChange={handleChange}
                className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <div className="mt-1">
              <select
                id="category"
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              >
                <option value="">Select category</option>
                {Object.entries(TEST_CATEGORIES).map(([key, value]) => (
                  <option key={key} value={value}>
                    {key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="sampleType" className="block text-sm font-medium text-gray-700 mb-1">
              Sample Type
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="sampleType"
                id="sampleType"
                required
                value={formData.sampleType}
                onChange={handleChange}
                className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="collectionDate" className="block text-sm font-medium text-gray-700 mb-1">
              Collection Date
            </label>
            <div className="mt-1">
              <input
                type="date"
                name="collectionDate"
                id="collectionDate"
                required
                value={formData.collectionDate}
                onChange={handleChange}
                className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="reportDate" className="block text-sm font-medium text-gray-700 mb-1">
              Report Date
            </label>
            <div className="mt-1">
              <input
                type="date"
                name="reportDate"
                id="reportDate"
                required
                value={formData.reportDate}
                onChange={handleChange}
                className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <div className="mt-1">
              <select
                id="status"
                name="status"
                required
                value={formData.status}
                onChange={handleChange}
                className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              >
                {Object.entries(REPORT_STATUS).map(([key, value]) => (
                  <option key={key} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Test Parameters */}
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
              // Group parameters by section
              Object.entries(
                formData.testParameters.reduce((acc, param) => {
                  const section = param.section || 'Default';
                  if (!acc[section]) acc[section] = [];
                  acc[section].push(param);
                  return acc;
                }, {})
              ).map(([section, parameters], sectionIndex) => (
                <div key={sectionIndex} className="mb-6">
                  <h4 className="text-md font-medium text-blue-600 bg-blue-50 px-4 py-2 border-b border-blue-100">{section}</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-blue-100">
                      <thead className="bg-blue-50">
                        <tr>
                          <th scope="col" className="py-3 pl-4 pr-3 text-left text-sm font-semibold text-gray-700 sm:pl-6">Parameter</th>
                          <th scope="col" className="px-3 py-3 text-left text-sm font-semibold text-gray-700">Value</th>
                          <th scope="col" className="px-3 py-3 text-left text-sm font-semibold text-gray-700">Unit</th>
                          <th scope="col" className="px-3 py-3 text-left text-sm font-semibold text-gray-700">Reference Range</th>
                          {selectedTemplate === 'custom' && (
                            <th scope="col" className="relative py-3 pl-3 pr-4 sm:pr-6">
                              <span className="sr-only">Actions</span>
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-50">
                        {parameters.map((param, paramIndex) => {
                          const globalIndex = formData.testParameters.findIndex(p => 
                            p.name === param.name && p.section === param.section
                          );
                          return (
                            <tr 
                              key={paramIndex} 
                              className={getRowBackgroundColor(param.value, param.referenceRange)}
                            >
                              <td className="py-3 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                {param.name}
                              </td>
                              <td className="px-3 py-3 text-sm">
                                <input
                                  type="text"
                                  value={param.value}
                                  onChange={(e) => handleParameterChange(globalIndex, 'value', e.target.value)}
                                  className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                                />
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
              ))
            ) : (
              // Flat list of parameters
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-blue-100">
                  <thead className="bg-blue-50">
                    <tr>
                      <th scope="col" className="py-3 pl-4 pr-3 text-left text-sm font-semibold text-gray-700 sm:pl-6">Parameter</th>
                      <th scope="col" className="px-3 py-3 text-left text-sm font-semibold text-gray-700">Value</th>
                      <th scope="col" className="px-3 py-3 text-left text-sm font-semibold text-gray-700">Unit</th>
                      <th scope="col" className="px-3 py-3 text-left text-sm font-semibold text-gray-700">Reference Range</th>
                      {selectedTemplate === 'custom' && (
                        <th scope="col" className="relative py-3 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-50">
                    {formData.testParameters.map((param, index) => (
                      <tr 
                        key={index}
                        className={getRowBackgroundColor(param.value, param.referenceRange)}
                      >
                        <td className="py-3 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
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
                          <input
                            type="text"
                            value={param.value}
                            onChange={(e) => handleParameterChange(index, 'value', e.target.value)}
                            className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                          />
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
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Notes */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-blue-700 mb-4 border-b border-blue-100 pb-2">
          Additional Notes
        </h2>
        <div className="mt-4">
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={formData.notes}
            onChange={handleChange}
            className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
            placeholder="Add any additional notes or observations here..."
          />
        </div>
      </section>
    </>
  );
}
