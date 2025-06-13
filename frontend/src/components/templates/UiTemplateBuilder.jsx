import React, { useState, useEffect } from 'react';
import { createTemplate, updateTemplate } from '../../utils/api'; // Import specific functions
import { toast } from 'react-toastify';

const UiTemplateBuilder = ({ existingTemplate, onTemplateSaved }) => {
  const [templateName, setTemplateName] = useState('');
  const [fields, setFields] = useState([{ label: '', key: '', type: 'text', unit: '', reference: '' }]);
  const [loading, setLoading] = useState(false);
  // const [error, setError] = useState(null); // Removed
  // const [success, setSuccess] = useState(false); // Removed
  const [isSystem, setIsSystem] = useState(false);

  useEffect(() => {
    if (existingTemplate) {
      setTemplateName(existingTemplate.name);
      setIsSystem(existingTemplate.isSystemTemplate || false);
      if (existingTemplate.jsonSchema) {
        const initialFields = Object.entries(existingTemplate.jsonSchema).map(([key, value]) => ({
          key,
          label: value.label || '',
          type: value.type || 'text',
          unit: value.unit || '',
          reference: value.reference || '',
        }));
        setFields(initialFields.length > 0 ? initialFields : [{ label: '', key: '', type: 'text', unit: '', reference: '' }]);
      } else {
        setFields([{ label: '', key: '', type: 'text', unit: '', reference: '' }]);
      }
    } else {
      // Reset for new template
      setTemplateName('');
      setFields([{ label: '', key: '', type: 'text', unit: '', reference: '' }]);
      setIsSystem(false);
    }
  }, [existingTemplate]);


  const handleAddField = () => {
    setFields([...fields, { label: '', key: '', type: 'text', unit: '', reference: '' }]);
  };

  const handleFieldChange = (index, event) => {
    const newFields = [...fields];
    newFields[index][event.target.name] = event.target.value;
    setFields(newFields);
  };

  const handleRemoveField = (index) => {
    const newFields = fields.filter((_, i) => i !== index);
    setFields(newFields);
  };

  const handleSaveTemplate = async () => {
    setLoading(true);
    // setError(null); // Removed
    // setSuccess(false); // Removed

    if (!templateName.trim()) {
      toast.error('Template name is required.');
      setLoading(false);
      return;
    }

    const validFields = fields.filter(f => f.key && f.label);
    if (validFields.length === 0) {
        toast.error('At least one field with a key and label is required.');
        setLoading(false);
        return;
    }


    const jsonSchema = validFields.reduce((acc, field) => {
      // Ensure key is a valid string for object property
      const key = field.key.trim().replace(/\s+/g, '_'); // Sanitize key
      if (key) {
        acc[key] = {
          label: field.label,
          type: field.type,
        };
        if (field.unit) acc[key].unit = field.unit;
        if (field.reference) acc[key].reference = field.reference;
      }
      return acc;
    }, {});

    if (Object.keys(jsonSchema).length === 0) {
        toast.error('Cannot save template with no valid fields.');
        setLoading(false);
        return;
    }

    try {
      const templateData = {
        name: templateName,
        jsonSchema,
        isSystemTemplate: isSystem,
      };

      let response;
      if (existingTemplate && existingTemplate._id) {
        const updateData = { name: templateName, jsonSchema: jsonSchema };
        response = await updateTemplate(existingTemplate._id, updateData);
        toast.success(response.message || 'Template updated successfully!');
      } else {
        response = await createTemplate(templateData);
        toast.success(response.message || 'Template created successfully!');
      }

      // setSuccess(true); // Removed
      if (onTemplateSaved) {
        onTemplateSaved();
      }
      if (!existingTemplate) {
        setTemplateName('');
        setFields([{ label: '', key: '', type: 'text', unit: '', reference: '' }]);
        setIsSystem(false);
      }
    } catch (err) {
      console.error('Error saving template:', err);
      // setError(err); // Removed
      toast.error(err.response?.data?.message || err.message || 'Failed to save template.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-md">
      <div className="mb-4">
        <label htmlFor="templateName" className="block text-sm font-medium text-gray-700">
          Template Name
        </label>
        <input
          type="text"
          id="templateNameUi" // Unique ID if both builders are on same page hidden/shown
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label htmlFor="isSystemTemplateUi" className="block text-sm font-medium text-gray-700">
          System Template
        </label>
        <input
          type="checkbox"
          id="isSystemTemplateUi"
          className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          checked={isSystem}
          onChange={(e) => setIsSystem(e.target.checked)}
          disabled={!!existingTemplate}
        />
        {existingTemplate && <span className="ml-2 text-xs text-gray-500">(Cannot change system status here. Use toggle action.)</span>}
      </div>

      <h3 className="text-lg font-semibold mb-3 text-gray-700">Fields</h3>
      {fields.map((field, index) => (
        <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-x-4 gap-y-2 mb-4 p-4 border border-gray-200 rounded-md shadow-sm bg-gray-50">
          <div className="md:col-span-2">
            <label htmlFor={`label-${index}`} className="block text-xs font-medium text-gray-600">
              Field Label <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id={`label-${index}`}
              name="label"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
              value={field.label}
              onChange={(e) => handleFieldChange(index, e)}
              placeholder="e.g., Hemoglobin"
            />
          </div>
          <div className="md:col-span-1">
            <label htmlFor={`key-${index}`} className="block text-xs font-medium text-gray-600">
              Key/Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id={`key-${index}`}
              name="key"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
              value={field.key}
              onChange={(e) => handleFieldChange(index, e)}
              placeholder="e.g., hemoglobin_hgb"
            />
          </div>
          <div className="md:col-span-1">
            <label htmlFor={`type-${index}`} className="block text-xs font-medium text-gray-600">
              Type
            </label>
            <select
              id={`type-${index}`}
              name="type"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
              value={field.type}
              onChange={(e) => handleFieldChange(index, e)}
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="textarea">Textarea</option>
              <option value="select">Select</option>
              <option value="checkbox">Checkbox</option>
              <option value="date">Date</option>
              {/* Add other types as needed: rich-text, file-upload etc. */}
            </select>
          </div>
          <div className="md:col-span-1">
            <label htmlFor={`unit-${index}`} className="block text-xs font-medium text-gray-600">
              Unit
            </label>
            <input
              type="text"
              id={`unit-${index}`}
              name="unit"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
              value={field.unit}
              onChange={(e) => handleFieldChange(index, e)}
              placeholder="e.g., g/dL"
            />
          </div>
          <div className="md:col-span-1">
            <label htmlFor={`reference-${index}`} className="block text-xs font-medium text-gray-600">
              Reference Range
            </label>
            <input
              type="text"
              id={`reference-${index}`}
              name="reference"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
              value={field.reference}
              onChange={(e) => handleFieldChange(index, e)}
              placeholder="e.g., 13.5-17.5"
            />
          </div>
          <div className="md:col-span-6 flex justify-end items-center mt-2">
            <button
              type="button"
              className="text-red-500 hover:text-red-700 text-sm font-medium"
              onClick={() => handleRemoveField(index)}
            >
              Remove Field
            </button>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between mt-6">
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          onClick={handleAddField}
        >
          + Add Field
        </button>

        <button
          type="button"
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          onClick={handleSaveTemplate}
          disabled={loading}
        >
          {loading ? 'Saving...' : (existingTemplate ? 'Update Template' : 'Create Template')}
        </button>
      </div>

      {/* {error && <p className="text-red-500 mt-2">Error: {error.message}</p>}
      {success && !existingTemplate && <p className="text-green-500 mt-2">Template created successfully!</p>}
      {success && existingTemplate && <p className="text-green-500 mt-2">Template updated successfully!</p>} */}
    </div>
  );
};

export default UiTemplateBuilder;
