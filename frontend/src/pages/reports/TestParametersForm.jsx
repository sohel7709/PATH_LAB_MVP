import { useState, useEffect } from 'react';
import { testTemplates } from '../../utils/api';
import TestTemplateSelector from './TestTemplateSelector';
import TestInfoFields from './TestInfoFields';
import TestParametersTable from './TestParametersTable';
import TestNotesSection from './TestNotesSection';
import { getRowBackgroundColor } from './TestParametersUtils';

export default function TestParametersForm({
  formData,
  setFormData,
  // patientGender, // Removed unused prop
  // patientAge,    // Removed unused prop
  setError
}) {

  // State variables
  const [_isLoading, setIsLoading] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [_templateDetails, setTemplateDetails] = useState(null); // Keep if needed elsewhere

  // Effect to fetch available templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Fetch available test templates
  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      let response;
      try {
        response = await testTemplates.getAll();
      } catch (fetchErr) {
        console.error("Error fetching templates:", fetchErr);
        response = { data: [] };
        setError('Failed to load test templates list.');
      }

      if (response && Array.isArray(response.data)) {
        setAvailableTemplates(response.data);
        setSelectedTemplates([]);
      } else {
        console.error("Invalid template data format received:", response);
        setAvailableTemplates([]);
        setSelectedTemplates([]);
        setError('Failed to load test templates (invalid format). Using custom test mode.');
      }
    } catch (err) {
      setAvailableTemplates([]);
      setSelectedTemplates([]);
      setError(`Failed to load test templates: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch details for multiple templates and merge parameters and notes
  const fetchMultipleTemplateDetails = async (templateIds) => {
    if (!templateIds || templateIds.length === 0) {
      // Reset for custom test
      setFormData(prev => ({
        ...prev,
        testName: 'Custom Test',
        category: 'Pathology',
        sampleType: '',
        testParameters: [],
        testNotes: '', // Reset general notes
        templateNotes: {}, // Reset template specific notes
        selectedTemplateIds: []
      }));
      setTemplateDetails(null);
      return;
    }
    try {
      setIsLoading(true);
      setError('');
      const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
      const userRole = userFromStorage.role || '';
      let allParameters = [];
      let mainCategory = '';
      let mainSampleType = '';
      let mainTestNames = [];
      const newTemplateNotes = {}; // Object to store notes per templateId

      for (const templateId of templateIds) {
        if (templateId === 'custom') continue;
        const response = await testTemplates.getById(templateId, userRole);
        if (response && response.data) {
          const template = response.data;
          console.log(`Raw Template Data fetched for ${templateId}:`, JSON.stringify(template)); // <<< Log raw data
          const templateNoteSections = []; // Collect notes for *this* template
          const hasTemplateSections = template.sections && Array.isArray(template.sections) && template.sections.length > 0;

          if (hasTemplateSections) {
            template.sections.forEach(section => {
              const sectionTitle = section.sectionTitle || 'Default';
              (section.parameters || []).forEach(param => {
                // *** RIGOROUS MAPPING for sectioned templates ***
                allParameters.push({
                  name: param.name || 'Unnamed Parameter',
                  value: '',
                  unit: param.unit || '',
                  referenceRange: param.normalRange || '',
                  section: sectionTitle,
                  isHeader: param.isHeader || false,           // Ensure isHeader is copied
                  isSubparameter: param.isSubparameter || false,
                  templateId: template._id,
                  notes: param.notes || '', // Keep param notes if needed later
                  inputType: param.inputType,                 // Ensure inputType is copied
                  options: Array.isArray(param.options) ? param.options : undefined // Ensure options is copied (if array)
                });
              });
              // Collect section notes for this specific template
              if (section.notes) {
                templateNoteSections.push(section.notes);
              }
            });
          } else if (template.fields && template.fields.length > 0) { // Handle legacy structure
            const legacyParameters = template.fields.map(field => ({
              name: field.parameter || 'Unnamed Parameter',
              value: '',
              unit: field.unit || '',
              referenceRange: field.reference_range || '',
              isHeader: false,
              isSubparameter: false,
              templateId: template._id,
              notes: '',
              section: 'Default',
              inputType: field.inputType,                 // Ensure inputType is copied
              options: Array.isArray(field.options) ? field.options : undefined // Ensure options is copied (if array)
            }));
            allParameters = [...allParameters, ...legacyParameters];
          }
          // Assign collected notes for this templateId
          newTemplateNotes[templateId] = templateNoteSections.join('\n');

          if (!mainCategory) mainCategory = template.category;
          if (!mainSampleType) mainSampleType = template.sampleType || 'Blood';
          if (template.templateName || template.name) mainTestNames.push(template.templateName || template.name);
        } else {
           console.warn(`Template data not found or invalid for ID: ${templateId}`);
        }
      }

      console.log("Final Mapped Parameters for Form State:", allParameters);
      console.log("Template Notes Map:", newTemplateNotes);

      setFormData(prev => ({
        ...prev,
        testName: mainTestNames.length > 0 ? mainTestNames.join(', ') : 'Custom Test',
        category: mainCategory || 'Pathology',
        sampleType: mainSampleType || 'Blood',
        testParameters: allParameters,
        selectedTemplateIds: templateIds,
        templateNotes: newTemplateNotes, // Set the template-specific notes object
        testNotes: '' // Reset general notes when templates are selected
      }));
    } catch (err) {
      console.error("Error in fetchMultipleTemplateDetails:", err);
      setError(`Failed to load template details: ${err.message || 'Unknown error'}`);
      setFormData(prev => ({
           ...prev,
           testParameters: [],
           testNotes: '',
           templateNotes: {},
           selectedTemplateIds: []
       }));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle test template selection
  const handleTemplateSelect = async (selectedTemplateIds) => {
    const idsToFetch = Array.isArray(selectedTemplateIds) ? selectedTemplateIds : [];
    setSelectedTemplates(idsToFetch);

    if (idsToFetch.length === 0 || idsToFetch.includes('custom')) {
      setFormData(prev => ({
        ...prev,
        testName: 'Custom Test',
        category: 'Pathology',
        sampleType: '',
        testParameters: [],
        selectedTemplateIds: [],
        testNotes: '',
        templateNotes: {} // Reset template notes
      }));
      setTemplateDetails(null);
    } else {
      await fetchMultipleTemplateDetails(idsToFetch);
    }
  };

  // Handle parameter value changes
  const handleParameterChange = (index, field, value) => {
    const newParameters = [...formData.testParameters];
    if (index >= 0 && index < newParameters.length) {
        newParameters[index] = { ...newParameters[index], [field]: value };
        setFormData(prev => ({ ...prev, testParameters: newParameters }));
    } else {
        console.error("Invalid index provided to handleParameterChange:", index);
    }
  };

   // Handle changes in template-specific notes
   const handleTemplateNoteChange = (templateId, value) => {
    setFormData(prev => ({
      ...prev,
      templateNotes: {
        ...prev.templateNotes,
        [templateId]: value
      }
    }));
  };

  // Add custom parameter
  const addParameter = () => {
    setFormData(prev => ({
      ...prev,
      testParameters: [
        ...prev.testParameters,
        { name: '', value: '', unit: '', referenceRange: '', section: 'Default', isHeader: false, isSubparameter: false, templateId: null, inputType: 'text', options: [] }
      ]
     }));
  };

  // Remove parameter
  const removeParameter = (index) => {
     if (index >= 0 && index < formData.testParameters.length) {
        setFormData(prev => ({
        ...prev,
        testParameters: prev.testParameters.filter((_, i) => i !== index)
        }));
     } else {
         console.error("Invalid index provided to removeParameter:", index);
     }
  };

  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Handle general form field changes (e.g., general notes)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <>
      <TestTemplateSelector
        selectedTemplates={selectedTemplates}
        availableTemplates={availableTemplates}
        handleTemplateSelect={handleTemplateSelect}
      />

      <TestInfoFields
        formData={formData}
        handleChange={handleChange}
      />

      {/* Conditionally render tables and notes based on selection */}
      {selectedTemplates && selectedTemplates.length > 0 && !selectedTemplates.includes('custom') ? (
        selectedTemplates.map(templateId => {
          const template = availableTemplates.find(t => t._id === templateId);
          const templateName = template ? (template.templateName || template.name) : `Template ID: ${templateId}`;
          return (
            // Wrap table and notes for each template
            <div key={templateId} className="mb-8 p-4 border border-dashed border-gray-300 rounded-lg">
              <h2 className="text-xl font-semibold text-blue-700 mb-4 border-b border-blue-100 pb-2">
                {templateName}
              </h2>
              <TestParametersTable
                formData={formData}
                selectedTemplate={selectedTemplates}
                templateIdToDisplay={templateId}
                patientGender={formData.patientGender}
                patientAge={formData.patientAge}
                getRowBackgroundColor={getRowBackgroundColor}
                handleParameterChange={handleParameterChange}
              />
              {/* Notes section specific to this template */}
              <TestNotesSection
                notes={formData.templateNotes?.[templateId] || ''} // Access notes using templateId
                handleChange={(e) => handleTemplateNoteChange(templateId, e.target.value)} // Use specific handler
                name={`templateNotes-${templateId}`} // Unique name might be needed if using standard form submission
                label={templateName}
              />
            </div>
          );
        })
      ) : (
        // Render single table for custom mode or if no template selected
        <TestParametersTable
          formData={formData}
          selectedTemplate={selectedTemplates}
          templateIdToDisplay={null}
          patientGender={formData.patientGender}
          patientAge={formData.patientAge}
          getRowBackgroundColor={getRowBackgroundColor}
          handleParameterChange={handleParameterChange}
          addParameter={addParameter}
          removeParameter={removeParameter}
        />
      )}

      {/* General Notes Section - Always visible */}
      <TestNotesSection
        notes={formData.testNotes || ''} // Bind to the general testNotes field
        handleChange={handleChange} // Use the general handleChange
        name="testNotes" // Standard name
        label="General Report Notes (Optional)"
      />
    </>
  );
}
