import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExclamationCircleIcon } from '@heroicons/react/20/solid';
import { reports } from '../../utils/api';
import { REPORT_STATUS, TEST_CATEGORIES } from '../../utils/constants';

export default function EditReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    patientName: '',
    patientAge: '',
    patientGender: '',
    patientPhone: '',
    testName: '',
    category: '',
    collectionDate: '',
    status: '',
    notes: '',
    testParameters: []
  });

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const data = await reports.getById(id);
      setFormData({
        patientName: data.patientName || '',
        patientAge: data.patientAge || '',
        patientGender: data.patientGender || '',
        patientPhone: data.patientPhone || '',
        testName: data.testName || '',
        category: data.category || Object.keys(TEST_CATEGORIES)[0],
        collectionDate: data.collectionDate || new Date().toISOString().split('T')[0],
        status: data.status || REPORT_STATUS.PENDING,
        notes: data.notes || '',
        testParameters: data.testParameters || [{ name: '', value: '', unit: '', referenceRange: '' }]
      });
      setError('');
    } catch (err) {
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

  const addParameter = () => {
    setFormData(prev => ({
      ...prev,
      testParameters: [
        ...prev.testParameters,
        { name: '', value: '', unit: '', referenceRange: '' }
      ]
    }));
  };

  const removeParameter = (index) => {
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
      await reports.update(id, formData);
      navigate(`/reports/${id}`);
    } catch (err) {
      setError(err.message);
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

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Edit Report
          </h2>
        </div>
      </div>

      <form className="mt-8 space-y-8" onSubmit={handleSubmit}>
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

        {/* Report Status */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Report Status</h3>
            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <div className="mt-1">
                  <select
                    id="status"
                    name="status"
                    required
                    value={formData.status}
                    onChange={handleChange}
                    className="input-field"
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
          </div>
        </div>

        {/* Patient Information */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Patient Information</h3>
            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
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
                    className="input-field"
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
                    className="input-field"
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
                    className="input-field"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-2">
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
                    className="input-field"
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
                <label htmlFor="testName" className="block text-sm font-medium text-gray-700">
                  Test name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="testName"
                    id="testName"
                    required
                    value={formData.testName}
                    onChange={handleChange}
                    className="input-field"
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
                    className="input-field"
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
                  Collection date
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    name="collectionDate"
                    id="collectionDate"
                    required
                    value={formData.collectionDate}
                    onChange={handleChange}
                    className="input-field"
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
              <button
                type="button"
                onClick={addParameter}
                className="btn-secondary"
              >
                Add Parameter
              </button>
            </div>
            
            <div className="mt-6 space-y-4">
              {formData.testParameters.map((param, index) => (
                <div key={index} className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-12 items-end">
                  <div className="sm:col-span-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Parameter name
                    </label>
                    <input
                      type="text"
                      required
                      value={param.name}
                      onChange={(e) => handleParameterChange(index, 'name', e.target.value)}
                      className="input-field mt-1"
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
                      className="input-field mt-1"
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
                      className="input-field mt-1"
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
                      className="input-field mt-1"
                    />
                  </div>
                  
                  <div className="sm:col-span-1">
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeParameter(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
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
                className="input-field"
                placeholder="Add any additional notes or observations..."
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate(`/reports/${id}`)}
            className="btn-secondary mr-3"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className={`btn-primary ${isSaving ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
