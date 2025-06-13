import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import JsonTemplateBuilder from '../../components/templates/JsonTemplateBuilder';
import UiTemplateBuilder from '../../components/templates/UiTemplateBuilder';
import TemplateList from '../../components/templates/TemplateList';
import { getTemplates, deleteTemplate as apiDeleteTemplate } from '../../utils/api'; // Assuming api.js exports these
import { toast } from 'react-toastify';

const TemplateManagerDashboard = () => {
  const [activeTab, setActiveTab] = useState('list'); // Default to 'list' view
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null); // For editing

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    console.log('Fetching templates...');
    try {
      const response = await getTemplates();
      console.log('API response received in fetchTemplates:', response); // Log the whole response
      if (response && response.success) {
        console.log('Setting templates data:', response.data);
        setTemplates(response.data);
        if (response.data.length === 0) {
          console.log('API returned success but data array is empty.');
        }
      } else {
        const errorMsg = response ? response.message : 'Unknown error structure';
        toast.error(errorMsg || 'Failed to fetch templates');
        console.error('Failed to fetch templates or response.success is false. Response:', response);
      }
    } catch (error) {
      console.error('Error fetching templates (catch block):', error);
      toast.error('An error occurred while fetching templates.');
    } finally {
      setLoading(false);
      console.log('Finished fetching templates.');
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleTemplateSaved = () => {
    fetchTemplates(); // Refresh list after save
    setActiveTab('list'); // Switch to list view
    setEditingTemplate(null); // Clear editing state
  };

  const handleDeleteTemplate = async (templateId, isSystem) => {
    let confirmDelete = window.confirm(
      `Are you sure you want to delete this template? ${
        isSystem ? "This is a system template and deleting it might affect system functionality." : ""
      }`
    );

    if (isSystem && confirmDelete) {
        const promptResponse = window.prompt("To confirm deletion of this SYSTEM template, please type 'DELETE'");
        if (promptResponse !== 'DELETE') {
            toast.info("System template deletion cancelled.");
            return;
        }
    } else if (!confirmDelete) {
        return;
    }

    try {
      const response = await apiDeleteTemplate(templateId, isSystem); // Pass isSystem to API
      if (response.success) {
        toast.success(response.message || 'Template deleted successfully');
        fetchTemplates(); // Refresh the list
      } else {
        toast.error(response.message || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('An error occurred while deleting the template.');
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    // Determine which tab to open based on how the template might have been created or its nature
    // For simplicity, let's assume we can infer or just default to JSON editor for edits
    // Or, if we store a 'type' (json/ui) with the template, we can use that.
    // For now, let's say if jsonSchema exists, it's likely editable with JSON builder.
    // A more robust solution would be to know the origin or have a preferred edit mode.
    if (template.jsonSchema) {
      setActiveTab('json');
    } else {
      // Fallback or decide based on other criteria.
      // This part might need refinement based on how UI-based templates are stored/edited.
      // If UI-based also results in jsonSchema, then JSON tab is fine.
      setActiveTab('json'); 
    }
  };
  
  // const handleViewTemplate = (template) => { // Removed, TemplateList will handle its own view modal
  //   console.log("Viewing template:", template);
  //   alert(`Template Name: ${template.name}\nSchema: ${JSON.stringify(template.jsonSchema, null, 2)}`);
  // };


  return (
    <DashboardLayout>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Template Management</h1>

        <div className="mb-6">
          <button
            onClick={() => { setEditingTemplate(null); setActiveTab('list'); }}
            className={`px-4 py-2 mr-2 rounded-t-lg font-semibold ${
              activeTab === 'list' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            View Templates
          </button>
          <button
            onClick={() => { setEditingTemplate(null); setActiveTab('json'); }}
            className={`px-4 py-2 mr-2 rounded-t-lg font-semibold ${
              activeTab === 'json' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Create with JSON
          </button>
          <button
            onClick={() => { setEditingTemplate(null); setActiveTab('ui'); }}
            className={`px-4 py-2 rounded-t-lg font-semibold ${
              activeTab === 'ui' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Create with UI Builder
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          {activeTab === 'list' && (
            <TemplateList
              templates={templates}
              loading={loading}
              onEdit={handleEditTemplate}
              onDelete={handleDeleteTemplate}
              // onView prop removed, TemplateList will use its own modal
              onRefresh={fetchTemplates}
            />
          )}
          {activeTab === 'json' && (
            <JsonTemplateBuilder
              onTemplateSaved={handleTemplateSaved}
              existingTemplate={editingTemplate}
            />
          )}
          {activeTab === 'ui' && (
            <UiTemplateBuilder
              onTemplateSaved={handleTemplateSaved}
              existingTemplate={editingTemplate}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TemplateManagerDashboard;
