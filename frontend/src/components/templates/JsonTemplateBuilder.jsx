import React, { useState, useEffect } from 'react';
import { createTemplate, updateTemplate } from '../../utils/api'; // Import specific functions
import { toast } from 'react-toastify';
import ReactJson from 'react-json-view'; // Import react-json-view

const JsonTemplateBuilder = ({ existingTemplate, onTemplateSaved }) => {
  const [templateName, setTemplateName] = useState('');
  const [jsonSchema, setJsonSchema] = useState({}); // Store as object
  const [rawJsonString, setRawJsonString] = useState(''); // For textarea input
  const [loading, setLoading] = useState(false);
  // const [error, setError] = useState(null); // Removed, using toast
  // const [success, setSuccess] = useState(false); // Removed, using toast
  const [isSystem, setIsSystem] = useState(false); // For system template flag

  useEffect(() => {
    if (existingTemplate) {
      setTemplateName(existingTemplate.name);
      const schema = existingTemplate.jsonSchema || {};
      setJsonSchema(schema);
      setRawJsonString(JSON.stringify(schema, null, 2));
      setIsSystem(existingTemplate.isSystemTemplate || false);
    } else {
      setTemplateName('');
      setJsonSchema({});
      setRawJsonString('');
      setIsSystem(false);
    }
  }, [existingTemplate]);

  const handleJsonEdit = (edit) => {
    setJsonSchema(edit.updated_src);
    setRawJsonString(JSON.stringify(edit.updated_src, null, 2));
    return true; // Important to return true to accept the edit
  };

  const handleRawJsonChange = (event) => {
    const newRawJson = event.target.value;
    setRawJsonString(newRawJson);
    try {
      const parsedJson = JSON.parse(newRawJson);
      setJsonSchema(parsedJson);
    } catch (e) {
      // If parsing fails, jsonSchema remains the last valid state
      // User will see parsing error when they try to save or if we add live validation
      console.warn("Invalid JSON input:", e.message);
    }
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
    if (Object.keys(jsonSchema).length === 0) {
        toast.error('JSON schema cannot be empty.');
        setLoading(false);
        return;
    }

    try {
      const templateData = {
        name: templateName,
        jsonSchema: jsonSchema,
        isSystemTemplate: isSystem, // Include isSystemTemplate
      };

      let response;
      if (existingTemplate && existingTemplate._id) {
        // Update existing template - Note: isSystemTemplate is usually not updated directly here.
        // Backend controller prevents changing isSystemTemplate via general update.
        // We'll pass it, but backend might ignore it or use a specific route for toggling.
        // For this form, we'll allow setting it if it's a new template.
        // If editing, the 'isSystem' state reflects the existing value.
        const updateData = { name: templateName, jsonSchema: jsonSchema }; // Only send fields that can be updated
        response = await updateTemplate(existingTemplate._id, updateData);
        toast.success(response.message || 'Template updated successfully!');
      } else {
        // Create new template
        response = await createTemplate(templateData);
        toast.success(response.message || 'Template created successfully!');
      }

      // setSuccess(true); // Removed
      if (onTemplateSaved) {
        onTemplateSaved();
      }
      // Clear form only if creating a new template
      if (!existingTemplate) {
        setTemplateName('');
        setJsonSchema({});
        setRawJsonString('');
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
          id="templateName"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label htmlFor="isSystemTemplate" className="block text-sm font-medium text-gray-700">
          System Template
        </label>
        <input
          type="checkbox"
          id="isSystemTemplate"
          className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          checked={isSystem}
          onChange={(e) => setIsSystem(e.target.checked)}
          disabled={!!existingTemplate} // Disable if editing, should be toggled via specific action
        />
         {existingTemplate && <span className="ml-2 text-xs text-gray-500">(Cannot change system status here. Use toggle action.)</span>}
      </div>
      
      <div className="mb-4">
        <label htmlFor="rawJsonSchema" className="block text-sm font-medium text-gray-700">
          Raw JSON Schema (Paste here)
        </label>
        <textarea
          id="rawJsonSchema"
          rows="10"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 font-mono"
          value={rawJsonString}
          onChange={handleRawJsonChange}
          placeholder='e.g.,\n{\n  "hemoglobin": {\n    "label": "Hemoglobin",\n    "type": "number",\n    "unit": "g/dL",\n    "reference": "13.5-17.5"\n  }\n}'
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          JSON Schema (Visual Editor - reflects raw input)
        </label>
        <div className="mt-1 p-2 border rounded-md bg-white">
          <ReactJson
            src={jsonSchema}
            name={null} // No root name
            onEdit={handleJsonEdit}
            onAdd={handleJsonEdit} // Use the same handler for add
            onDelete={handleJsonEdit} // Use the same handler for delete
            displayObjectSize={false}
            displayDataTypes={false}
            enableClipboard={false}
            theme="rjv-default" // You can choose other themes
            style={{ padding: '10px', borderRadius: '4px' }}
          />
        </div>
      </div>

      <button
        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        onClick={handleSaveTemplate}
        disabled={loading}
      >
        {loading ? 'Saving...' : (existingTemplate ? 'Update Template' : 'Create Template')}
      </button>

      {/* {error && <p className="text-red-500 mt-2">Error: {error.message}</p>} */}
      {/* {success && !existingTemplate && <p className="text-green-500 mt-2">Template created successfully!</p>}
      {success && existingTemplate && <p className="text-green-500 mt-2">Template updated successfully!</p>} */}
    </div>
  );
};

export default JsonTemplateBuilder;
