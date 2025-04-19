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
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && error === 'Default templates cannot be edited') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="bg-yellow-50 p-6 rounded-2xl shadow-xl border border-yellow-200 max-w-md w-full">
          <div className="flex">
            <div className="flex-shrink-0">
              <XMarkIcon className="h-6 w-6 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-yellow-800">{error}</h3>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => navigate(`/templates/${id}`)}
                  className="inline-flex items-center rounded-lg border border-transparent bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-700 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                >
                  Back to Template Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
        <div className="px-8 py-6 bg-gradient-to-r from-blue-700 to-blue-500 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Edit Test Template</h1>
            <p className="text-base text-blue-100 mt-1">
              Update the details and parameters for this test template
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/templates/${id}`)}
            className="inline-flex items-center justify-center rounded-lg border border-transparent bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
          >
            <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Cancel
          </button>
        </div>

        <div className="p-8 space-y-8">
          {error && error !== 'Default templates cannot be edited' && (
            <div className="rounded-lg bg-red-50 p-4 border-l-4 border-red-500 flex items-center">
              <XMarkIcon className="h-5 w-5 text-red-400 mr-3" aria-hidden="true" />
              <span className="text-sm font-medium text-red-800">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Template Information */}
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-blue-700">Template Information</h3>
                <p className="mt-1 text-sm text-blue-500">
                  Basic information about the test template
                </p>
              </div>
              <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-blue-700 mb-1">
                    Template Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-medium text-blue-900 transition-colors"
                    placeholder="e.g., Liver Function Test"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="sampleType" className="block text-sm font-medium text-blue-700 mb-1">
                    Sample Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="sampleType"
                    name="sampleType"
                    value={formData.sampleType}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-medium text-blue-900 transition-colors"
                    required
                  >
                    {sampleTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-blue-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-medium text-blue-900 transition-colors"
                    required
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-blue-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-medium text-blue-900 transition-colors"
                    placeholder="Brief description of the test template"
                  />
                  <p className="mt-2 text-xs text-blue-400">
                    Brief description of what this test is used for
                  </p>
                </div>
              </div>
            </div>

            {/* Test Parameters */}
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-blue-700">Test Parameters</h3>
                <p className="mt-1 text-sm text-blue-500">
                  Add parameters that will be included in this test template
                </p>
              </div>
              <div className="space-y-4">
                {formData.fields.map((field, index) => (
                  <div key={index} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4 bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <div className="flex-1">
                      <label htmlFor={`parameter-${index}`} className="block text-sm font-medium text-blue-700 mb-1">
                        Parameter Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id={`parameter-${index}`}
                        name="parameter"
                        value={field.parameter}
                        onChange={(e) => handleFieldChange(index, e)}
                        className="block w-full rounded-lg border border-blue-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-medium text-blue-900 transition-colors"
                        placeholder="e.g., SGPT (ALT)"
                      />
                    </div>
                    <div className="sm:w-1/4">
                      <label htmlFor={`unit-${index}`} className="block text-sm font-medium text-blue-700 mb-1">
                        Unit
                      </label>
                      <input
                        type="text"
                        id={`unit-${index}`}
                        name="unit"
                        value={field.unit}
                        onChange={(e) => handleFieldChange(index, e)}
                        className="block w-full rounded-lg border border-blue-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-medium text-blue-900 transition-colors"
                        placeholder="e.g., U/L"
                      />
                    </div>
                    <div className="sm:w-1/3">
                      <label htmlFor={`reference_range-${index}`} className="block text-sm font-medium text-blue-700 mb-1">
                        Reference Range
                      </label>
                      <input
                        type="text"
                        id={`reference_range-${index}`}
                        name="reference_range"
                        value={field.reference_range}
                        onChange={(e) => handleFieldChange(index, e)}
                        className="block w-full rounded-lg border border-blue-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-medium text-blue-900 transition-colors"
                        placeholder="e.g., 7 - 56"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeField(index)}
                        className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 mt-2 sm:mt-0"
                        title="Remove Parameter"
                      >
                        <XMarkIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={addField}
                    className="inline-flex items-center rounded-lg border border-transparent bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                  >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Add Parameter
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate(`/templates/${id}`)}
                className="rounded-lg border border-blue-200 bg-white py-2 px-4 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex justify-center rounded-lg border border-transparent bg-gradient-to-r from-blue-600 to-blue-500 py-2 px-4 text-sm font-medium text-white shadow-sm hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditTestTemplate;
