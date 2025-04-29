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
  const [selectedTemplate, setSelectedTemplate] = useState("");
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
      // Get user role from localStorage for debugging
      const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
      const userRole = userFromStorage.role || '';
      console.log('Current user role:', userRole);
      
      // Use the appropriate API method based on user role
      let response;
      
      try {
        // Use the appropriate API method based on user role
        console.log('Using standard API method for role:', userRole);
        response = await testTemplates.getAll();
        console.log('Standard API response:', response);
      } catch (apiError) {
        console.error('API error fetching templates:', apiError);
        // Handle API error gracefully
        response = { data: [] };
      }
      
      if (response && response.data) {
        setAvailableTemplates(response.data);
        
        // If templates are available, select the first one by default
        if (response.data.length > 0) {
          const firstTemplate = response.data[0];
          setSelectedTemplate(firstTemplate._id);
          await fetchTemplateDetails(firstTemplate._id);
        } else {
          // If no templates are available, set up for custom test
          setSelectedTemplate('custom');
          setFormData(prev => ({
            ...prev,
            testName: 'Custom Test',
            category: 'pathology',
            sampleType: 'Blood',
            testParameters: [{
              name: 'Parameter 1',
              value: '',
              unit: '',
              referenceRange: ''
            }]
          }));
          setTemplateDetails(null);
          setHasSections(false);
        }
      } else {
        console.error('Invalid response format:', response);
        setError('Failed to load test templates. Using custom test mode.');
        setSelectedTemplate('custom');
        setFormData(prev => ({
          ...prev,
          testName: 'Custom Test',
          category: 'pathology',
          sampleType: 'Blood',
          testParameters: [{
            name: 'Parameter 1',
            value: '',
            unit: '',
            referenceRange: ''
          }]
        }));
      }
    } catch (err) {
      console.error('Error fetching test templates:', err);
      setError(`Failed to load test templates: ${err.message || 'Unknown error'}`);
      
      // Set up for custom test in case of error
      setSelectedTemplate('custom');
      setFormData(prev => ({
        ...prev,
        testName: 'Custom Test',
        category: 'pathology',
        sampleType: '',
        testParameters: []
      }));
      setTemplateDetails(null);
      setHasSections(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch template details by ID
  const fetchTemplateDetails = async (templateId) => {
    if (!templateId) return;
    
    try {
      setIsLoading(true);
      
      // Get user role from localStorage for debugging
      const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
      const userRole = userFromStorage.role || '';
      console.log('Fetching template details for role:', userRole);
      
      // Use the appropriate API method based on user role
      let response;
      
      // Fetch template details for all user roles
      console.log('Using standard API method for template details');
      response = await testTemplates.getById(templateId, userRole);
      console.log('Standard API template details response:', response);
  
      if (response && response.data) {
        const template = response.data;
        setTemplateDetails(template);
  
        // Check if template has sections
        const hasTemplateSections = template.sections && Object.keys(template.sections).length > 0;
        setHasSections(hasTemplateSections);
  
        // Update form data with template details
        let parameters = [];
  
        if (hasTemplateSections) {
          // Flatten sections into parameters for the form (new structure)
          template.sections.forEach(section => {
            const sectionTitle = section.sectionTitle || 'Default';
            (section.parameters || []).forEach(param => {
              parameters.push({
                name: param.name,
                value: '', // Default value is empty
                unit: param.unit || '',
                referenceRange: param.normalRange || '',
                section: sectionTitle,
                // Force isHeader true for Differential Count
                isHeader: param.isHeader || param.name === "Differential Count",
                isSubparameter: param.isSubparameter || false // Add isSubparameter flag
              });
            });
          });
        } else if (template.fields && template.fields.length > 0) {
          // Use fields directly (legacy support - assuming no headers/subparams here)
          parameters = template.fields.map(field => ({
            name: field.parameter,
            value: '',
            unit: field.unit || '',
            referenceRange: field.reference_range || '',
            isHeader: false,
            isSubparameter: false
          }));
        }

        setFormData(prev => ({
          ...prev,
          testName: template.templateName || template.name,
          category: template.category,
          sampleType: template.sampleType || 'Blood',
          testParameters: parameters
        }));
      }
    } catch (err) {
      console.error('Error fetching template details:', err);
      setError(`Failed to load template details: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle test template selection
  const handleTemplateSelect = async (e) => {
    const templateId = e.target.value;
    setSelectedTemplate(templateId);
    
    if (templateId && templateId !== 'custom') {
      await fetchTemplateDetails(templateId);
    } else {
      // Reset form for custom template
      setFormData(prev => ({
        ...prev,
        testName: 'Custom Test',
        category: 'pathology',
        sampleType: '',
        testParameters: []
      }));
      setTemplateDetails(null);
      setHasSections(false);
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
        selectedTemplate={selectedTemplate}
        availableTemplates={availableTemplates}
        handleTemplateSelect={handleTemplateSelect}
      />

      {/* Test Information */}
      <TestInfoFields 
        formData={formData}
        handleChange={handleChange}
      />

      {/* Test Parameters */}
      <TestParametersTable
        formData={formData}
        setFormData={setFormData}
        selectedTemplate={selectedTemplate}
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

      {/* Notes */}
      <TestNotesSection 
        notes={formData.notes}
        handleChange={handleChange}
      />
    </>
  );
}
