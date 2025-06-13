import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExclamationCircleIcon } from '@heroicons/react/20/solid';
import { reports } from '../../utils/api';
import { REPORT_STATUS, TEST_CATEGORIES } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

export default function EditReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    patientDesignation: '', // Added patientDesignation
    patientName: '',
    patientAge: '',
    patientGender: '',
    patientPhone: '',
    testName: '',
    category: '',
    collectionDate: '',
    price: '', // Add price field
    status: '',
    notes: '',
    testParameters: []
  });

  // Check if user is a technician (keeping for future reference)
  const { user } = useAuth();
  const _isTechnician = user?.role === 'technician'; // Prefixed with underscore to indicate intentionally unused

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const response = await reports.getById(id);
      
      // Check if the response has a data property (API might return {success: true, data: {...}})
      const data = response.data || response;
      
      console.log('Fetched report data for editing:', data);
      
      // Map the data from the API response to the form fields
      setFormData({
        // Patient Information - handle both flat and nested structures
        patientDesignation: data.patientInfo?.designation || '', // Added patientDesignation
        patientName: data.patientName || (data.patientInfo ? data.patientInfo.name : ''),
        patientAge: data.patientAge || (data.patientInfo ? data.patientInfo.age : ''),
        patientGender: data.patientGender || (data.patientInfo ? data.patientInfo.gender : ''),
        patientPhone: data.patientPhone || (data.patientInfo && data.patientInfo.contact ? data.patientInfo.contact.phone : ''),
        patientId: data.patientInfo?.patientId || '', // Ensure patientId is also populated
        
        // Test Information - handle both flat and nested structures
        testName: data.testName || (data.testInfo ? data.testInfo.name : ''),
        category: data.category || (data.testInfo ? data.testInfo.category : Object.keys(TEST_CATEGORIES)[0]),
        collectionDate: data.collectionDate || 
                       (data.testInfo && data.testInfo.sampleCollectionDate ? 
                        new Date(data.testInfo.sampleCollectionDate).toISOString().split('T')[0] : 
                        new Date().toISOString().split('T')[0]),
        price: data.price || (data.testInfo ? data.testInfo.price : 0), // Populate price
        
        // Other fields
        status: data.status || REPORT_STATUS.PENDING,
        notes: data.notes || '',
        
        // Test Parameters - map from results array if available
        testParameters: data.testParameters || 
                       (data.results && data.results.length > 0 ? 
                        data.results.map(result => ({
                          name: result.parameter || '',
                          value: result.value || '',
                          unit: result.unit || '',
                          referenceRange: result.referenceRange || ''
                        })) : 
                        [{ name: '', value: '', unit: '', referenceRange: '' }])
      });
      
      setError('');
    } catch (err) {
      console.error('Error fetching report for editing:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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

  // Function to check if a value is outside the reference range
  const isOutsideRange = (value, referenceRange) => {
    if (!value || !referenceRange) return false;
    
    // Try to parse the value as a number
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return false;
    
    // Parse reference range - handle different formats
    // Examples: "10-20", "<10", ">20", "≤30", "≥5"
    try {
      if (referenceRange.includes('-')) {
        // Range format: "10-20"
        const [min, max] = referenceRange.split('-').map(v => parseFloat(v.trim()));
        return numValue < min || numValue > max;
      } else if (referenceRange.startsWith('<')) {
        // Less than format: "<10"
        const max = parseFloat(referenceRange.substring(1).trim());
        return numValue >= max;
      } else if (referenceRange.startsWith('≤')) {
        // Less than or equal format: "≤10"
        const max = parseFloat(referenceRange.substring(1).trim());
        return numValue > max;
      } else if (referenceRange.startsWith('>')) {
        // Greater than format: ">20"
        const min = parseFloat(referenceRange.substring(1).trim());
        return numValue <= min;
      } else if (referenceRange.startsWith('≥')) {
        // Greater than or equal format: "≥5"
        const min = parseFloat(referenceRange.substring(1).trim());
        return numValue < min;
      }
    } catch (e) {
      console.error('Error parsing reference range:', e);
    }
    
    return false;
  };

  // Keeping this function for future reference but not using it
  const _addParameter = () => {
    setFormData(prev => ({
      ...prev,
      testParameters: [
        ...prev.testParameters,
        { name: '', value: '', unit: '', referenceRange: '' }
      ]
    }));
  };

  // Keeping this function for future reference but not using it
  const _removeParameter = (index) => {
    setFormData(prev => ({
      ...prev,
      testParameters: prev.testParameters.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      // Convert the flat form data structure to the nested structure expected by the API
      const reportData = {
        // Patient Information
        patientInfo: {
          designation: formData.patientDesignation, // Added designation
          name: formData.patientName,
          age: parseInt(formData.patientAge, 10), // Convert to number
          gender: formData.patientGender,
          contact: {
            phone: formData.patientPhone
          },
          // Preserve patientId if it exists in the original data
          patientId: formData.patientId // Use populated patientId
        },
        
        // Test Information
        testInfo: {
          name: formData.testName,
          category: formData.category,
          price: parseFloat(formData.price) || 0, // Include price
          sampleCollectionDate: formData.collectionDate,
          // Preserve other test info fields if they exist
          sampleType: formData.sampleType || 'blood',
          sampleId: formData.sampleId || `SMP-${Date.now().toString().slice(-6)}`
        },
        
        // Status and Notes
        status: formData.status,
        notes: formData.notes,
        
        // Test Parameters/Results
        results: formData.testParameters.map(param => ({
          parameter: param.name,
          value: param.value,
          unit: param.unit,
          referenceRange: param.referenceRange,
          // Add flag based on value comparison with reference range
          flag: isOutsideRange(param.value, param.referenceRange) ? 'abnormal' : 'normal'
        }))
      };
      
      console.log('Submitting report data:', JSON.stringify(reportData, null, 2));
      
      // Use the API utility to update the report
      await reports.update(id, reportData);
      
      // Navigate to print report page after successful update
      navigate(`/reports/${id}/print`);
    } catch (err) {
      console.error('Error updating report:', err);
      setError(err.message || 'An error occurred while updating the report');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  // Render test parameter row
  const renderParameterRow = (param, index) => {
    const isAbnormal = isOutsideRange(param.value, param.referenceRange);
    
    return (
      <div 
        key={index} 
        className={`grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-12 items-end ${isAbnormal ? 'bg-red-50 border-l-4 border-red-500 pl-2 rounded-r-md' : ''}`}
      >
        <div className="sm:col-span-3">
          <label className="block text-sm font-medium text-gray-700">
            Parameter name
          </label>
          <input
            type="text"
            required
            value={param.name}
            onChange={(e) => handleParameterChange(index, 'name', e.target.value)}
            className="block w-full rounded-lg border border-blue-300 px-4 py-2 bg-gray-100 cursor-not-allowed mt-1"
            disabled={true}
          />
        </div>
        
        <div className="sm:col-span-3">
          <label className="block text-sm font-medium text-gray-700">
            Value
          </label>
          <input
            type="text"
            required
            value={param.value}
            onChange={(e) => handleParameterChange(index, 'value', e.target.value)}
            className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition mt-1"
          />
        </div>
        
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Unit
          </label>
          <input
            type="text"
            required
            value={param.unit}
            onChange={(e) => handleParameterChange(index, 'unit', e.target.value)}
            className="block w-full rounded-lg border border-blue-300 px-4 py-2 bg-gray-100 cursor-not-allowed mt-1"
            disabled={true}
          />
        </div>
        
        <div className="sm:col-span-3">
          <label className="block text-sm font-medium text-gray-700">
            Reference range
          </label>
          <input
            type="text"
            required
            value={param.referenceRange}
            onChange={(e) => handleParameterChange(index, 'referenceRange', e.target.value)}
            className="block w-full rounded-lg border border-blue-300 px-4 py-2 bg-gray-100 cursor-not-allowed mt-1"
            disabled={true}
          />
        </div>
        
        <div className="sm:col-span-1">
          {/* Remove button disabled: Users cannot delete test parameters */}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 py-8 px-2">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden">
        <div className="px-8 py-6 bg-gradient-to-r from-blue-700 to-blue-500">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <ExclamationCircleIcon className="h-8 w-8 text-white mr-3" />
              <div>
                <h1 className="text-3xl font-extrabold text-white">Edit Report</h1>
                <p className="text-base text-blue-100 mt-1">
                  Update test results and report status
                </p>
              </div>
            </div>
          </div>
        </div>

        <form className="p-8 space-y-8" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4">
              <div className="flex items-center">
                <ExclamationCircleIcon className="h-5 w-5 mr-2 text-red-500" aria-hidden="true" />
                <span className="font-medium">Error:</span>
                <span className="ml-2">{error}</span>
              </div>
            </div>
          )}

          {/* Report Status */}
          <section>
            <h2 className="text-xl font-semibold text-blue-700 mb-4 border-b border-blue-100 pb-2">
              Report Status
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
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
                    {Object.values(REPORT_STATUS).map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Patient Information */}
          <section>
            <h2 className="text-xl font-semibold text-blue-700 mb-4 border-b border-blue-100 pb-2">
              Patient Information
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded-r-md">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        Patient information cannot be changed after report creation. To update patient details, please create a new report.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="sm:col-span-2"> 
                <label htmlFor="patientDesignation" className="block text-sm font-medium text-gray-700 mb-1">
                  Designation
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="patientDesignation"
                    id="patientDesignation"
                    value={formData.patientDesignation}
                    className="block w-full rounded-lg border border-blue-300 px-4 py-2 bg-gray-100 cursor-not-allowed"
                    disabled
                  />
                </div>
              </div>

              <div className="sm:col-span-4"> 
                <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="patientName"
                    id="patientName"
                    value={formData.patientName}
                    className="block w-full rounded-lg border border-blue-300 px-4 py-2 bg-gray-100 cursor-not-allowed"
                    disabled
                  />
                </div>
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="patientAge" className="block text-sm font-medium text-gray-700 mb-1">
                  Age
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="patientAge"
                    id="patientAge"
                    value={formData.patientAge}
                    className="block w-full rounded-lg border border-blue-300 px-4 py-2 bg-gray-100 cursor-not-allowed"
                    disabled
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="patientGender" className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="patientGender"
                    value={formData.patientGender}
                    className="block w-full rounded-lg border border-blue-300 px-4 py-2 bg-gray-100 cursor-not-allowed"
                    disabled
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="patientPhone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone number
                </label>
                <div className="mt-1">
                  <input
                    type="tel"
                    name="patientPhone"
                    id="patientPhone"
                    value={formData.patientPhone}
                    className="block w-full rounded-lg border border-blue-300 px-4 py-2 bg-gray-100 cursor-not-allowed"
                    disabled
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Test Information */}
          <section>
            <h2 className="text-xl font-semibold text-blue-700 mb-4 border-b border-blue-100 pb-2">
              Test Information
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded-r-md">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        Test information cannot be changed after report creation. To update test details, please create a new report.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="testName" className="block text-sm font-medium text-gray-700 mb-1">
                  Test name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="testName"
                    id="testName"
                    value={formData.testName}
                    className="block w-full rounded-lg border border-blue-300 px-4 py-2 bg-gray-100 cursor-not-allowed"
                    disabled
                  />
                </div>
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Test Price
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="price"
                    id="price"
                    value={formData.price}
                    className="block w-full rounded-lg border border-blue-300 px-4 py-2 bg-gray-100 cursor-not-allowed"
                    disabled
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="category"
                    value={Object.entries(TEST_CATEGORIES).find(([key]) => key === formData.category)?.[1] || formData.category}
                    className="block w-full rounded-lg border border-blue-300 px-4 py-2 bg-gray-100 cursor-not-allowed"
                    disabled
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="collectionDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Collection date
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    name="collectionDate"
                    id="collectionDate"
                    value={formData.collectionDate}
                    className="block w-full rounded-lg border border-blue-300 px-4 py-2 bg-gray-100 cursor-not-allowed"
                    disabled
                  />
                </div>
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="referenceDoctor" className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Doctor
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="referenceDoctor"
                    id="referenceDoctor"
                    value={formData.referenceDoctor || 'Not specified'}
                    className="block w-full rounded-lg border border-blue-300 px-4 py-2 bg-gray-100 cursor-not-allowed"
                    disabled
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Test Parameters */}
          <section>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-blue-700 mb-4 border-b border-blue-100 pb-2">
                Test Parameters
              </h2>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-2 rounded-r-md">
                <p className="text-sm text-blue-700">
                  Only test values can be modified
                </p>
              </div>
            </div>
            
            <div className="mt-6 space-y-4">
              {formData.testParameters.map((param, index) => renderParameterRow(param, index))}
            </div>
          </section>

          {/* Notes */}
          <section>
            <h2 className="text-xl font-semibold text-blue-700 mb-4 border-b border-blue-100 pb-2">
              Additional Notes
            </h2>
            <div className="mt-6">
              <textarea
                name="notes"
                id="notes"
                rows={4}
                value={formData.notes}
                onChange={handleChange}
                className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                placeholder="Add any additional notes or observations..."
              />
            </div>
          </section>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate(`/reports/${id}`)}
              className="px-6 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold shadow hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`px-6 py-3 rounded-lg border border-transparent bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold shadow hover:from-blue-700 hover:to-blue-600 transition focus:outline-none focus:ring-2 focus:ring-blue-400 ${isSaving ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
