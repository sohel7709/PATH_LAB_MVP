import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ExclamationCircleIcon, CheckCircleIcon, UserPlusIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { reports, patients } from '../../utils/api';
import { TEST_CATEGORIES, REPORT_STATUS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

// Blood test template with normal ranges
const BLOOD_TEST_TEMPLATE = {
  name: "Complete Blood Count (CBC)",
  category: "HEMATOLOGY",
  parameters: [
    { name: "Hemoglobin", unit: "g%", referenceRange: "Male: 14-16.5, Female: 12-14.5" },
    { name: "RBC Count", unit: "million/cu.mm", referenceRange: "4.0-6.0" },
    { name: "PCV", unit: "%", referenceRange: "35-60" },
    { name: "MCV", unit: "fl", referenceRange: "80-99" },
    { name: "MCH", unit: "pg", referenceRange: "27-31" },
    { name: "MCHC", unit: "%", referenceRange: "32-37" },
    { name: "RDW", unit: "fl", referenceRange: "9-17" },
    { name: "Total WBC Count", unit: "/cu.mm", referenceRange: "4000-10,000" },
    { name: "Neutrophils", unit: "%", referenceRange: "40-70" },
    { name: "Lymphocytes", unit: "%", referenceRange: "20-45" },
    { name: "Eosinophils", unit: "%", referenceRange: "00-06" },
    { name: "Monocytes", unit: "%", referenceRange: "00-08" },
    { name: "Basophils", unit: "%", referenceRange: "00-01" },
    { name: "Platelet Count", unit: "lak/cu.mm", referenceRange: "150000-450000" }
  ]
};

// Test templates
const TEST_TEMPLATES = {
  "CBC": BLOOD_TEST_TEMPLATE,
  "CUSTOM": { name: "Custom Test", category: "PATHOLOGY", parameters: [] }
};

export default function CreateReport() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [patientList, setPatientList] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("CBC");
  
  // Form data state
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    patientAge: '',
    patientGender: '',
    patientPhone: '',
    testName: BLOOD_TEST_TEMPLATE.name,
    category: BLOOD_TEST_TEMPLATE.category,
    collectionDate: new Date().toISOString().split('T')[0],
    reportDate: new Date().toISOString().split('T')[0],
    status: REPORT_STATUS.PENDING,
    notes: '',
    technicianId: user?.id || '',
    labId: user?.lab || '',
    testParameters: BLOOD_TEST_TEMPLATE.parameters.map(param => ({ 
      ...param, 
      value: '' 
    }))
  });

  // Check if patient ID was passed in URL query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const patientId = params.get('patientId');
    
    if (patientId) {
      fetchPatientDetails(patientId);
    }
    
    fetchPatients();
  }, [location]);

  // Fetch patient list
  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      // Handle the case where user or lab might be undefined
      const labId = user?.lab || '';
      const data = await patients.getAll(labId);
      
      // Check if data is valid and has the expected structure
      if (data && Array.isArray(data)) {
        setPatientList(data);
      } else {
        // If data is not in expected format, set an empty array
        console.error('Invalid patient data format:', data);
        setPatientList([]);
        setError('Received invalid patient data format. Using empty patient list.');
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError('Failed to load patient list. Please try again.');
      // Set empty array to prevent undefined errors
      setPatientList([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch patient details by ID
  const fetchPatientDetails = async (id) => {
    try {
      const patientData = await patients.getById(id);
      
      // Handle both MongoDB _id and id formats
      const patientId = patientData._id || patientData.id;
      
      setFormData(prev => ({
        ...prev,
        patientId: patientId,
        patientName: patientData.fullName,
        patientAge: patientData.age,
        patientGender: patientData.gender,
        patientPhone: patientData.phone
      }));
      
      // Clear any previous errors
      setError('');
    } catch (err) {
      console.error('Error fetching patient details:', err);
      setError('Failed to load patient details. Please try again.');
    }
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle patient selection
  const handlePatientSelect = (e) => {
    const selectedPatientId = e.target.value;
    if (selectedPatientId) {
      fetchPatientDetails(selectedPatientId);
    } else {
      // Clear patient fields if "Add New Patient" is selected
      setFormData(prev => ({
        ...prev,
        patientId: '',
        patientName: '',
        patientAge: '',
        patientGender: '',
        patientPhone: ''
      }));
    }
  };

  // Handle test template selection
  const handleTemplateSelect = (e) => {
    const template = e.target.value;
    setSelectedTemplate(template);
    
    const selectedTemplate = TEST_TEMPLATES[template];
    setFormData(prev => ({
      ...prev,
      testName: selectedTemplate.name,
      category: selectedTemplate.category,
      testParameters: selectedTemplate.parameters.map(param => ({ 
        ...param, 
        value: '' 
      }))
    }));
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
    
    // Handle numeric ranges like "10-20"
    const numericMatch = referenceRange.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/);
    if (numericMatch) {
      const min = parseFloat(numericMatch[1]);
      const max = parseFloat(numericMatch[2]);
      const numValue = parseFloat(value);
      
      if (!isNaN(numValue) && !isNaN(min) && !isNaN(max)) {
        return numValue >= min && numValue <= max;
      }
    }
    
    return true;
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Generate a unique sample ID
      const sampleId = `SAMPLE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Format the data according to the Report model structure
      const reportData = {
        patientInfo: {
          name: formData.patientName,
          age: formData.patientAge,
          gender: formData.patientGender,
          contact: {
            phone: formData.patientPhone
          },
          patientId: formData.patientId || `PAT-${Date.now()}`
        },
        testInfo: {
          name: formData.testName,
          category: formData.category,
          description: '',
          method: '',
          sampleType: 'Blood', // Default sample type
          sampleCollectionDate: new Date(formData.collectionDate),
          sampleId: sampleId
        },
        results: formData.testParameters.map(param => ({
          parameter: param.name,
          value: param.value,
          unit: param.unit,
          referenceRange: param.referenceRange,
          flag: 'normal' // Default flag
        })),
        status: formData.status,
        lab: user?.lab,
        technician: user?.id,
        reportMeta: {
          generatedAt: new Date(),
          version: 1
        }
      };
      
      console.log('Submitting report data:', reportData);
      
      // Create report
      const response = await reports.create(reportData);
      
      console.log('Report created successfully:', response);
      
      setSuccess('Report created successfully! Redirecting to reports list...');
      
      // Navigate to reports page immediately
      navigate('/reports');
    } catch (err) {
      console.error('Error creating report:', err);
      setError(err.message || 'Failed to create report. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="min-w-0 flex-1 flex items-center">
          <DocumentTextIcon className="h-10 w-10 text-blue-600 mr-4" />
          <div>
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Create New Report
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Create a new patient report with test results
            </p>
          </div>
        </div>
      </div>

      <form className="space-y-8" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">{success}</h3>
              </div>
            </div>
          </div>
        )}

        {/* Patient Information */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Patient Information</h3>
            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <label htmlFor="patientSelect" className="block text-sm font-medium text-gray-700">
                  Select Patient
                </label>
                <div className="mt-1">
                  <select
                    id="patientSelect"
                    name="patientSelect"
                              className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    onChange={handlePatientSelect}
                    value={formData.patientId || ''}
                  >
                    <option value="">Add New Patient</option>
                    {patientList.map(patient => {
                      // Handle both MongoDB _id and id formats
                      const patientId = patient._id || patient.id;
                      return (
                        <option key={patientId} value={patientId}>
                          {patient.fullName} - {patient.phone}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="patientName" className="block text-sm font-medium text-gray-700">
                  Full name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="patientName"
                    id="patientName"
                    required
                    value={formData.patientName}
                    onChange={handleChange}
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="patientAge" className="block text-sm font-medium text-gray-700">
                  Age
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="patientAge"
                    id="patientAge"
                    required
                    min="0"
                    max="150"
                    value={formData.patientAge}
                    onChange={handleChange}
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="patientGender" className="block text-sm font-medium text-gray-700">
                  Gender
                </label>
                <div className="mt-1">
                  <select
                    id="patientGender"
                    name="patientGender"
                    required
                    value={formData.patientGender}
                    onChange={handleChange}
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="patientPhone" className="block text-sm font-medium text-gray-700">
                  Phone number
                </label>
                <div className="mt-1">
                  <input
                    type="tel"
                    name="patientPhone"
                    id="patientPhone"
                    required
                    value={formData.patientPhone}
                    onChange={handleChange}
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Test Information */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Test Information</h3>
            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="testTemplate" className="block text-sm font-medium text-gray-700">
                  Test Template
                </label>
                <div className="mt-1">
                  <select
                    id="testTemplate"
                    name="testTemplate"
                    required
                    value={selectedTemplate}
                    onChange={handleTemplateSelect}
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="CBC">Complete Blood Count (CBC)</option>
                    <option value="CUSTOM">Custom Test</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="testName" className="block text-sm font-medium text-gray-700">
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
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <div className="mt-1">
                  <select
                    id="category"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleChange}
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  >
                    {Object.entries(TEST_CATEGORIES).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="collectionDate" className="block text-sm font-medium text-gray-700">
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
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Test Parameters */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Test Parameters</h3>
              {selectedTemplate === "CUSTOM" && (
                <button
                  type="button"
                  onClick={addParameter}
                  className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Add Parameter
                </button>
              )}
            </div>
            
            <div className="mt-6 overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Parameter</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Value</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Unit</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Reference Range</th>
                    {selectedTemplate === "CUSTOM" && (
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {formData.testParameters.map((param, index) => {
                    const isNormal = isValueNormal(param.value, param.referenceRange);
                    
                    return (
                      <tr key={index} className={!isNormal ? 'bg-red-50' : ''}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {selectedTemplate === "CUSTOM" ? (
                            <input
                              type="text"
                              required
                              value={param.name}
                              onChange={(e) => handleParameterChange(index, 'name', e.target.value)}
                className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                            />
                          ) : (
                            param.name
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <input
                            type="text"
                            required
                            value={param.value}
                            onChange={(e) => handleParameterChange(index, 'value', e.target.value)}
                            className={`block w-full rounded-md border bg-white py-2 px-3 shadow-sm focus:ring-blue-500 sm:text-sm ${
                              !isNormal 
                                ? 'border-red-300 focus:border-red-500 text-red-900' 
                                : 'border-gray-300 focus:border-blue-500 focus:outline-none'
                            }`}
                          />
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {selectedTemplate === "CUSTOM" ? (
                            <input
                              type="text"
                              required
                              value={param.unit}
                              onChange={(e) => handleParameterChange(index, 'unit', e.target.value)}
                className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                            />
                          ) : (
                            param.unit
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {selectedTemplate === "CUSTOM" ? (
                            <input
                              type="text"
                              required
                              value={param.referenceRange}
                              onChange={(e) => handleParameterChange(index, 'referenceRange', e.target.value)}
                className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                            />
                          ) : (
                            param.referenceRange
                          )}
                        </td>
                        {selectedTemplate === "CUSTOM" && (
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            {index > 0 && (
                              <button
                                type="button"
                                onClick={() => removeParameter(index)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Additional Notes</h3>
            <div className="mt-6">
              <textarea
                name="notes"
                id="notes"
                rows={4}
                value={formData.notes}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="Add any additional notes, observations, or diagnosis..."
              />
            </div>
          </div>
        </div>

        {/* Report Status */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Report Status</h3>
            <div className="mt-6">
              <select
                id="status"
                name="status"
                required
                value={formData.status}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              >
                {Object.entries(REPORT_STATUS).map(([key, value]) => (
                  <option key={key} value={value}>
                    {value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/reports')}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="ml-3 inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isLoading ? 'Creating...' : 'Create Report'}
          </button>
        </div>
      </form>
    </div>
  );
}
