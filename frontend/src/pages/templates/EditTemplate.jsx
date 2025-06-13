import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // Assuming react-router-dom is used for routing
import DashboardLayout from '../../components/layouts/DashboardLayout';
import api from '../../utils/api'; // Import the api utility
import JsonTemplateBuilder from '../../components/templates/JsonTemplateBuilder';
import UiTemplateBuilder from '../../components/templates/UiTemplateBuilder';

const EditTemplate = () => {
  const { id } = useParams(); // Get template ID from URL
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeBuilder, setActiveBuilder] = useState('json'); // 'json' or 'ui'

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setLoading(true);
        const response = await api.templates.getById(id);
        setTemplate(response.data);
        console.log('Fetched template for editing:', response.data);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [id]); // Refetch when ID changes

  if (loading) {
    return <DashboardLayout><div>Loading template...</div></DashboardLayout>;
  }

  if (error) {
    return <DashboardLayout><div>Error loading template: {error.message}</div></DashboardLayout>;
  }

  if (!template) {
    return <DashboardLayout><div>Template not found.</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-4">Edit Template: {template.name}</h1>

      <div className="tabs">
        <button
          className={`tab tab-bordered ${activeBuilder === 'json' ? 'tab-active' : ''}`}
          onClick={() => setActiveBuilder('json')}
        >
          JSON-Based Editor
        </button>
        <button
          className={`tab tab-bordered ${activeBuilder === 'ui' ? 'tab-active' : ''}`}
          onClick={() => setActiveBuilder('ui')}
        >
          UI-Based Editor
        </button>
      </div>

      <div className="py-4">
        {activeBuilder === 'json' && (
          <JsonTemplateBuilder initialData={template} />
        )}

        {activeBuilder === 'ui' && (
          <UiTemplateBuilder initialData={template} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default EditTemplate;
