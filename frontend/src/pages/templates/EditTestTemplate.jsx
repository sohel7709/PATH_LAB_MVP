import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { testTemplates } from '../../utils/api';
import { TEST_CATEGORIES } from '../../utils/constants';
import { PlusIcon, XMarkIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const EditTestTemplate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    sampleType: '',
    category: '',
    description: '',
    fields: []
  });

  // Generate categories from TEST_CATEGORIES constant
  const categories = [
    { value: '', label: 'Select Category' },
    ...Object.entries(TEST_CATEGORIES).map(([key, value]) => ({
      value: value,
      label: key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' ')
    }))
  ];

  const sampleTypes = [
    { value: '', label: 'Select Sample Type' },
    { value: 'blood', label: 'Blood' },
    { value: 'urine', label: 'Urine' },
    { value: 'serum', label: 'Serum' },
    { value: 'plasma', label: 'Plasma' },
    { value: 'csf', label: 'CSF' },
    { value: 'stool', label: 'Stool' },
    { value: 'sputum', label: 'Sputum' },
    { value: 'swab', label: 'Swab' },
    { value: 'tissue', label: 'Tissue' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await testTemplates.getById(id);
        
        if (response.success) {
          const template = response.data;
          
          // Check if it's a default template
          if (template.isDefault) {
            setError('Default templates cannot be edited');
            setLoading(false);
            return;
          }
          
          setFormData({
            name: template.name || '',
            sampleType: template.sampleType || '',
            category: template.category || '',
            description: template.description || '',
            fields: template.fields && template.fields.length > 0 
              ? template.fields 
              : [{ parameter: '', unit: '', reference_range: '' }]
          });
        } else {
          setError('Failed to fetch template details');
        }
      } catch (err) {
        console.error('Error fetching template details:', err);
        setError('Failed to load template details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFieldChange = (index, e) => {
    const { name, value } = e.target;
    const updatedFields = [...formData.fields];
    updatedFields[index] = {
      ...updatedFields[index],
      [name]: value
    };
    
    setFormData({
      ...formData,
      fields: updatedFields
    });
  };

  const addField = () => {
    setFormData({
      ...formData,
      fields: [...formData.fields, { parameter: '', unit: '', reference_range: '' }]
    });
  };

  const removeField = (index) => {
    const updatedFields = [...formData.fields];
    updatedFields.splice(index, 1);
    
    setFormData({
      ...formData,
      fields: updatedFields.length > 0 ? updatedFields : [{ parameter: '', unit: '', reference_range: '' }]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.sampleType || !formData.category) {
      setError('Please fill in all required fields');
      return;
    }
    
    // Validate that at least one field has a parameter
    const hasValidField = formData.fields.some(field => field.parameter.trim() !== '');
    if (!hasValidField) {
      setError('Please add at least one test parameter');
      return;
    }
    
    // Filter out empty fields
    const validFields = formData.fields.filter(field => field.parameter.trim() !== '');
    
    try {
      setSaving(true);
      setError(null);
      
      const templateData = {
        ...formData,
        fields: validFields
      };
      
      const response = await testTemplates.update(id, templateData);
      
      if (response.success) {
        navigate(`/templates/${id}`);
      } else {
        setError(response.message || 'Failed to update template');
        setSaving(false);
      }
    } catch (err) {
      console.error('Error updating test template:', err);
      setError('Failed to update test template. Please try again later.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && error === 'Default templates cannot be edited') {
    return (
      <div className="bg-yellow-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <XMarkIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">{error}</h3>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => navigate(`/templates/${id}`)}
                className="inline-flex items-center rounded-md border border-transparent bg-yellow-100 px-3 py-2 text-sm font-medium text-yellow-700 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
              >
                Back to Template Details
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Test Template</h1>
          <p className="mt-2 text-sm text-gray-700">
            Update the details and parameters for this test template
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            type="button"
            onClick={() => navigate(`/templates/${id}`)}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Cancel
          </button>
        </div>
      </div>

      {error && error !== 'Default templates cannot be edited' && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XMarkIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200 bg-white shadow rounded-lg p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Template Information</h3>
            <p className="mt-1 text-sm text-gray-500">
              Basic information about the test template
            </p>
          </div>

          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Template Name <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="e.g., Liver Function Test"
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="sampleType" className="block text-sm font-medium text-gray-700">
                Sample Type <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <select
                  id="sampleType"
                  name="sampleType"
                  value={formData.sampleType}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                >
                  {sampleTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                >
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <div className="mt-1">
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Brief description of the test template"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Brief description of what this test is used for
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Test Parameters</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add parameters that will be included in this test template
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {formData.fields.map((field, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="flex-1">
                  <label htmlFor={`parameter-${index}`} className="block text-sm font-medium text-gray-700">
                    Parameter Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id={`parameter-${index}`}
                    name="parameter"
                    value={field.parameter}
                    onChange={(e) => handleFieldChange(index, e)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="e.g., SGPT (ALT)"
                  />
                </div>
                <div className="w-1/4">
                  <label htmlFor={`unit-${index}`} className="block text-sm font-medium text-gray-700">
                    Unit
                  </label>
                  <input
                    type="text"
                    id={`unit-${index}`}
                    name="unit"
                    value={field.unit}
                    onChange={(e) => handleFieldChange(index, e)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="e.g., U/L"
                  />
                </div>
                <div className="w-1/3">
                  <label htmlFor={`reference_range-${index}`} className="block text-sm font-medium text-gray-700">
                    Reference Range
                  </label>
                  <input
                    type="text"
                    id={`reference_range-${index}`}
                    name="reference_range"
                    value={field.reference_range}
                    onChange={(e) => handleFieldChange(index, e)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="e.g., 7 - 56"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeField(index)}
                    className="mt-6 inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    <XMarkIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}

            <div className="pt-4">
              <button
                type="button"
                onClick={addField}
                className="inline-flex items-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Add Parameter
              </button>
            </div>
          </div>
        </div>

        <div className="pt-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate(`/templates/${id}`)}
              className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditTestTemplate;
