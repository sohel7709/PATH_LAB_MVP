import { useState, useEffect } from 'react';
import { testTemplates } from '../../utils/api';
import { TEST_CATEGORIES } from '../../utils/constants';
import TestTemplateSelector from './TestTemplateSelector';
import TestInfoFields from './TestInfoFields';
import TestParametersTable from './TestParametersTable';
import TestNotesSection from './TestNotesSection';
import { getRowBackgroundColor } from './TestParametersUtils';

export default function TestParametersForm({
  formData, 
  setFormData, 
  patientGender,
  patientAge,
  setError
}) {
  // DEBUG: Log test parameters to check isHeader property
  if (formData && Array.isArray(formData.testParameters)) {
    console.log("Test Parameters:", formData.testParameters);
  }
  
  // Force re-render on mount to ensure proper layout
  useEffect(() => {
    // This empty effect will trigger a re-render after initial mount
    // which helps ensure styles are properly applied
  }, []);
  
  // Using _isLoading to avoid ESLint warning since it's used in setIsLoading
  const [_isLoading, setIsLoading] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  // Using _templateDetails to avoid ESLint warning since it's used in setTemplateDetails
  const [_templateDetails, setTemplateDetails] = useState(null);
  const [hasSections, setHasSections] = useState(false);
  // State to control CRP test visibility
  const [showCRPTest, setShowCRPTest] = useState(false);
  
  // Update formData with showCRPTest state when it changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      showCRPTest
    }));
  }, [showCRPTest, setFormData]);

  // Fetch available test templates
  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      // const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
      // const userRole = userFromStorage.role || ''; // Removed unused variable
      let response;
      try {
        response = await testTemplates.getAll();
      } catch { // No need for the variable if unused
        response = { data: [] };
      }
      if (response && response.data) {
        setAvailableTemplates(response.data);
        // If templates are available, select none by default (user must select)
        setSelectedTemplates([]);
      } else {
        setAvailableTemplates([]);
        setSelectedTemplates([]);
        setError('Failed to load test templates. Using custom test mode.');
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
        category: 'pathology',
        sampleType: '',
        testParameters: [],
        testNotes: ''
      }));
      setTemplateDetails(null);
      setHasSections(false);
      return;
    }
    try {
      setIsLoading(true);
      const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
      const userRole = userFromStorage.role || '';
      let allParameters = [];
      let mainCategory = '';
      let mainSampleType = '';
      let mainTestNames = [];
      let combinedNotes = []; // Re-introduce combinedNotes logic
      for (const templateId of templateIds) {
        if (templateId === 'custom') continue;
        const response = await testTemplates.getById(templateId, userRole);
        if (response && response.data) {
          const template = response.data;
          // Check if template has sections
          const hasTemplateSections = template.sections && Object.keys(template.sections).length > 0;
          let parameters = [];
          if (hasTemplateSections) {
            template.sections.forEach(section => {
              const sectionTitle = section.sectionTitle || 'Default';
              (section.parameters || []).forEach(param => {
                parameters.push({
                  name: param.name,
                  value: '',
                  unit: param.unit || '',
                  referenceRange: param.normalRange || '',
                  section: sectionTitle,
                  isHeader: Object.prototype.hasOwnProperty.call(param, 'isHeader') ? param.isHeader : (param.name === "Differential Count"),
                  isSubparameter: param.isSubparameter || false,
                  templateId: template._id // Add templateId here
                });
              });
              // Collect notes from section if present
              if (section.notes) {
                combinedNotes.push(section.notes);
              }
            });
          } else if (template.fields && template.fields.length > 0) {
            parameters = template.fields.map(field => ({
              name: field.parameter,
              value: '',
              unit: field.unit || '',
              referenceRange: field.reference_range || '',
              isHeader: false,
              isSubparameter: false,
              templateId: template._id // Add templateId here for legacy fields too
            }));
          }
          allParameters = [...allParameters, ...parameters];
          if (!mainCategory) mainCategory = template.category;
          if (!mainSampleType) mainSampleType = template.sampleType || 'Blood';
          if (template.templateName || template.name) mainTestNames.push(template.templateName || template.name);
          // Collect notes from template if present
          if (template.notes) {
            combinedNotes.push(template.notes);
          }
        }
      }
      setFormData(prev => ({
        ...prev,
        testName: mainTestNames.length > 0 ? mainTestNames.join(', ') : 'Custom Test',
        category: mainCategory || 'pathology',
        sampleType: mainSampleType || 'Blood',
        testParameters: allParameters,
        selectedTemplateIds: templateIds,
        testNotes: combinedNotes.join(' | ') // Re-add combining notes
      }));
    } catch (err) {
      setError(`Failed to load template details: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle test template selection (multi-select) - updated to accept array directly
  const handleTemplateSelect = async (selectedTemplateIds) => {
    setSelectedTemplates(selectedTemplateIds);
    if (!selectedTemplateIds || selectedTemplateIds.length === 0 || selectedTemplateIds.includes('custom')) {
      // Reset for custom test
      setFormData(prev => ({
        ...prev,
        testName: 'Custom Test',
        category: 'pathology',
        sampleType: '',
        testParameters: [],
        selectedTemplateIds: [],
        testNotes: ''
      }));
      setTemplateDetails(null);
      setHasSections(false);
    } else {
      await fetchMultipleTemplateDetails(selectedTemplateIds);
    }
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

  // Fetch templates when component mounts
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <>
      {/* Test Template Selection */}
      <TestTemplateSelector 
        selectedTemplates={selectedTemplates}
        availableTemplates={availableTemplates}
        handleTemplateSelect={handleTemplateSelect}
      />

      {/* Test Information */}
      <TestInfoFields 
        formData={formData}
        handleChange={handleChange}
      />

      {/* Test Parameters - Grouped by Template */}
      {selectedTemplates && selectedTemplates.length > 0 && !selectedTemplates.includes('custom') ? (
        selectedTemplates.map(templateId => {
          const template = availableTemplates.find(t => t._id === templateId);
          const templateName = template ? (template.templateName || template.name) : 'Unknown Template';
          return (
            <div key={templateId} className="mb-8">
              <h2 className="text-xl font-semibold text-blue-700 mb-4 border-b border-blue-100 pb-2">
                {templateName} {/* Removed "Test Parameters: " prefix */}
              </h2>
              <TestParametersTable
                formData={formData}
                setFormData={setFormData}
                selectedTemplate={selectedTemplates} // Keep passing all selected for context if needed
                templateIdToDisplay={templateId} // Pass the specific ID to filter
                hasSections={hasSections} // This might need adjustment if sections are per-template
                showCRPTest={showCRPTest}
                setShowCRPTest={setShowCRPTest}
                patientGender={patientGender}
                patientAge={patientAge}
                getRowBackgroundColor={getRowBackgroundColor}
                handleParameterChange={handleParameterChange}
                addParameter={addParameter}
                removeParameter={removeParameter}
              />
            </div>
          );
        })
      ) : (
        // Show default table or message if no template or custom is selected
        <TestParametersTable
          formData={formData}
          setFormData={setFormData}
          selectedTemplate={selectedTemplates} // Pass empty or ['custom']
          hasSections={hasSections}
          showCRPTest={showCRPTest}
          setShowCRPTest={setShowCRPTest}
          patientGender={patientGender}
          patientAge={patientAge}
          getRowBackgroundColor={getRowBackgroundColor}
          handleParameterChange={handleParameterChange}
          addParameter={addParameter}
          removeParameter={removeParameter}
        />
      )}

       {/* Notes */}
      <TestNotesSection 
        notes={formData.testNotes || formData.notes}
        handleChange={handleChange}
      />
    </>
  );
}
