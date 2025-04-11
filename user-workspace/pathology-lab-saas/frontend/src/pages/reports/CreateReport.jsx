import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ExclamationCircleIcon, CheckCircleIcon, UserPlusIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { reports, patients, testTemplates } from '../../utils/api';
import { TEST_CATEGORIES, REPORT_STATUS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

export default function CreateReport() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [patientList, setPatientList] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [templateDetails, setTemplateDetails] = useState(null);
  const [hasSections, setHasSections] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    patientAge: '',
    patientGender: '',
    patientPhone: '',
    testName: '',
    category: '',
    sampleType: '',
    collectionDate: new Date().toISOString().split('T')[0],
    reportDate: new Date().toISOString().split('T')[0],
    status: REPORT_STATUS.PENDING,
    notes: '',
    technicianId: user?.id || '',
    labId: user?.lab || '',
    testParameters: []
  });

  // Fetch test templates and patients when component mounts
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const patientId = params.get('patientId');
    
    // Initialize data
    const initializeData = async () => {
      await Promise.all([
        fetchTemplates(),
        fetchPatients()
      ]);
      
      if (patientId) {
        fetchPatientDetails(patientId);
      }
    };
    
    initializeData();
  }, [location]);

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
      
      // Use the appropriate API method based on user role
      console.log('Using standard API method for role:', userRole);
      response = await testTemplates.getAll();
      console.log('Standard API response:', response);
      
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
            sampleType: '',
            testParameters: []
          }));
          setTemplateDetails(null);
          setHasSections(false);
        }
      } else {
        console.error('Invalid response format:', response);
        setError('Failed to load test templates. Invalid response format.');
        setSelectedTemplate('custom');
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
          // Flatten sections into parameters for the form
          Object.entries(template.sections).forEach(([sectionName, sectionParams]) => {
            sectionParams.forEach(param => {
              parameters.push({
                name: param.parameter,
                value: '',
                unit: param.unit || '',
                referenceRange: param.reference_range || '',
                section: sectionName
              });
            });
          });
        } else if (template.fields && template.fields.length > 0) {
          // Use fields directly
          parameters = template.fields.map(field => ({
            name: field.parameter,
            value: '',
            unit: field.unit || '',
            referenceRange: field.reference_range || ''
          }));
        }
  
        setFormData(prev => ({
          ...prev,
          testName: template.name,
          category: template.category,
          sampleType: template.sampleType,
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

  // Fetch patient list
  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      // Handle the case where user or lab might be undefined
      const labId = user?.lab || '';
      const data = await patients.getAll(labId);
      
      // Check if data is valid and has the expected structure
      if (data && Array.isArray(data)) {
        setPatientList(data);
      } else {
        // If data is not in expected format, set an empty array
        console.error('Invalid patient data format:', data);
        setPatientList([]);
        setError('Received invalid patient data format. Using empty patient list.');
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError('Failed to load patient list. Please try again.');
      // Set empty array to prevent undefined errors
      setPatientList([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch patient details by ID
  const fetchPatientDetails = async (id) => {
    try {
      // First, check if this patient is in the current patient list
      // This can help avoid unnecessary API calls for patients from other labs
      const existingPatient = patientList.find(p => {
        const pId = p._id || p.id;
        return pId.toString() === id.toString();
      });
      
      if (!existingPatient) {
        console.log('Patient not found in current lab\'s patient list');
        setError('Patient not found in your lab. Please select a patient from the dropdown or add a new one.');
        return;
      }
      
      const patientData = await patients.getById(id);
      console.log('Fetched patient data:', patientData);

      // No need to check lab ID here as the backend already does this
      // and will return 403 if not authorized

      const patientId = patientData._id || patientData.id;
      
      // Update form data with patient details - these fields will remain editable
      setFormData(prev => ({
        ...prev,
        patientId: patientId,
        patientName: patientData.fullName || '',
        patientAge: patientData.age || '',
        patientGender: patientData.gender || '',
        patientPhone: patientData.phone || ''
      }));

      setError('');
    } catch (err) {
      console.error('Error fetching patient details:', err);
      if (err.message === 'Not authorized to access this patient') {
        setError('You do not have permission to access this patient\'s data. Please select a patient from your lab.');
      } else {
        setError('Failed to load patient details. Please try again or select a different patient.');
      }
      
      // Clear the patient selection
      setFormData(prev => ({
        ...prev,
        patientId: '',
        patientName: '',
        patientAge: '',
        patientGender: '',
        patientPhone: ''
      }));
    }
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle patient selection
  const handlePatientSelect = (e) => {
    const selectedPatientId = e.target.value;
    if (selectedPatientId) {
      fetchPatientDetails(selectedPatientId);
    } else {
      // Clear patient fields if "Add New Patient" is selected
      setFormData(prev => ({
        ...prev,
        patientId: '',
        patientName: '',
        patientAge: '',
        patientGender: '',
        patientPhone: ''
      }));
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

  // Check if value is within normal range
  const isValueNormal = (value, referenceRange) => {
    if (!value || !referenceRange) return true;
    
    // Convert value to number
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return true; // If value is not a number, consider it normal
    
    // Get patient gender
    const patientGender = formData.patientGender.toLowerCase();
    
    // Handle gender-specific ranges like "M: 13.5–18.0; F: 11.5–16.4"
    const genderMatch = referenceRange.match(/M:\s*(\d+\.?\d*)[–-](\d+\.?\d*);\s*F:\s*(\d+\.?\d*)[–-](\d+\.?\d*)/);
    if (genderMatch) {
      const maleMin = parseFloat(genderMatch[1]);
      const maleMax = parseFloat(genderMatch[2]);
      const femaleMin = parseFloat(genderMatch[3]);
      const femaleMax = parseFloat(genderMatch[4]);
      
      // Use the appropriate range based on patient gender
      if (patientGender === 'male' && !isNaN(maleMin) && !isNaN(maleMax)) {
        return numValue >= maleMin && numValue <= maleMax;
      } else if (patientGender === 'female' && !isNaN(femaleMin) && !isNaN(femaleMax)) {
        return numValue >= femaleMin && numValue <= femaleMax;
      } else {
        // If gender is not specified or is 'other', use the wider range
        const minValue = Math.min(maleMin, femaleMin);
        const maxValue = Math.max(maleMax, femaleMax);
        
        if (!isNaN(minValue) && !isNaN(maxValue)) {
          return numValue >= minValue && numValue <= maxValue;
        }
      }
    }
    
    // Handle numeric ranges like "10-20" or "10–20" (with en dash)
    const numericMatch = referenceRange.match(/(\d+\.?\d*)\s*[–-]\s*(\d+\.?\d*)/);
    if (numericMatch) {
      const min = parseFloat(numericMatch[1]);
      const max = parseFloat(numericMatch[2]);
      
      if (!isNaN(min) && !isNaN(max)) {
        return numValue >= min && numValue <= max;
      }
    }
    
    // Handle "Up to X" format
    const upToMatch = referenceRange.match(/Up\s+to\s+(\d+\.?\d*)/i);
    if (upToMatch) {
      const max = parseFloat(upToMatch[1]);
      
      if (!isNaN(max)) {
        return numValue <= max;
      }
    }
    
    // Handle ranges with < or > symbols like "<5" or ">10"
    const lessThanMatch = referenceRange.match(/\s*<\s*(\d+\.?\d*)/);
    if (lessThanMatch) {
      const max = parseFloat(lessThanMatch[1]);
      
      if (!isNaN(max)) {
        return numValue < max;
      }
    }
    
    const greaterThanMatch = referenceRange.match(/\s*>\s*(\d+\.?\d*)/);
    if (greaterThanMatch) {
      const min = parseFloat(greaterThanMatch[1]);
      
      if (!isNaN(min)) {
        return numValue > min;
      }
    }
    
    // Debug log for unmatched reference ranges
    console.log('Unmatched reference range format:', referenceRange);
    return true;
  };
  
  // Get row background color based on value
  const getRowBackgroundColor = (value, referenceRange) => {
    if (!value || !referenceRange) return '';
    
    return isValueNormal(value, referenceRange) 
      ? '' 
      : 'bg-red-200 text-red-800 font-medium';
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Check if we need to create a new patient first
      let patientId = formData.patientId;
      
      if (!patientId) {
        // This is a new patient, create it first
        console.log('Creating new patient...');
        const newPatientData = {
          fullName: formData.patientName,
          age: parseInt(formData.patientAge),
          gender: formData.patientGender,
          phone: formData.patientPhone,
          email: '', // Optional
          address: '', // Optional
          labId: user?.lab // Important: Associate with current lab
        };
        
        console.log('New patient data:', newPatientData);
        
        try {
          const createdPatient = await patients.create(newPatientData);
          console.log('New patient created:', createdPatient);
          patientId = createdPatient._id || createdPatient.id;
          
          // Update the patient list to include this new patient
          setPatientList(prev => [...prev, createdPatient]);
        } catch (patientErr) {
          console.error('Error creating patient:', patientErr);
          setError('Failed to create new patient: ' + (patientErr.message || 'Unknown error'));
          setIsLoading(false);
          return;
        }
      }
      
      // Generate a unique sample ID
      const sampleId = `SAMPLE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Format the data according to the Report model structure
      const reportData = {
        patientInfo: {
          name: formData.patientName,
          age: parseInt(formData.patientAge),
          gender: formData.patientGender,
          contact: {
            phone: formData.patientPhone
          },
          patientId: patientId
        },
        testInfo: {
          name: formData.testName,
          category: formData.category,
          description: templateDetails?.description || '',
          method: '',
          sampleType: formData.sampleType || 'Blood',
          sampleCollectionDate: new Date(formData.collectionDate),
          sampleId: sampleId,
          referenceDoctor: formData.referenceDoctor || '' // Include reference doctor
        },
        results: formData.testParameters.map(param => ({
          parameter: param.name,
          value: param.value,
          unit: param.unit,
          referenceRange: param.referenceRange,
          flag: isValueNormal(param.value, param.referenceRange) ? 'normal' : 'high',
          section: param.section // Include section if available
        })),
        status: formData.status,
        lab: user?.lab,
        technician: user?.id,
        reportMeta: {
          generatedAt: new Date(),
          version: 1
        }
      };
      
      console.log('Submitting report data:', reportData);
      
      // Create report
      const response = await reports.create(reportData);
      
      console.log('Report created successfully:', response);
      
      setSuccess('Report created successfully! Redirecting to reports list...');
      
      // Navigate to reports page immediately
      navigate('/reports');
    } catch (err) {
      console.error('Error creating report:', err);
      setError(err.message || 'Failed to create report. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="min-w-0 flex-1 flex items-center">
          <DocumentTextIcon className="h-10 w-10 text-blue-600 mr-4" />
          <div>
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Create New Report
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Create a new patient report with test results
            </p>
          </div>
        </div>
      </div>

      <form className="space-y-8" onSubmit={handleSubmit}>
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

        {success && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">{success}</h3>
              </div>
            </div>
          </div>
        )}

        {/* Patient Information */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Patient Information</h3>
              {formData.patientId && (
                <p className="text-sm text-gray-500 italic">
                  Patient information is locked for data integrity. Only Reference Doctor can be modified.
                </p>
              )}
            </div>
            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <label htmlFor="patientSelect" className="form-label">
                  Select Patient
                </label>
                <div className="mt-1">
                  <select
                    id="patientSelect"
                    name="patientSelect"
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    onChange={handlePatientSelect}
                    value={formData.patientId || ''}
                  >
                    <option value="">Add New Patient</option>
                    {patientList.map(patient => {
                      // Handle both MongoDB _id and id formats
                      const patientId = patient._id || patient.id;
                      return (
                        <option key={patientId} value={patientId}>
                          {patient.fullName} - {patient.phone}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="patientName" className="form-label">
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
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    readOnly={!!formData.patientId}
                  />
                </div>
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="patientAge" className="form-label">
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
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    readOnly={!!formData.patientId}
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="patientGender" className="form-label">
                  Gender
                </label>
                <div className="mt-1">
                  <select
                    id="patientGender"
                    name="patientGender"
                    required
                    value={formData.patientGender}
                    onChange={handleChange}
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    disabled={!!formData.patientId}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

<div className="sm:col-span-3">
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
      className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
      readOnly={!!formData.patientId}
    />
  </div>
</div>

<div className="sm:col-span-3">
  <label htmlFor="referenceDoctor" className="block text-sm font-medium text-gray-700">
    Reference Doctor Name
  </label>
  <div className="mt-1">
    <input
      type="text"
      name="referenceDoctor"
      id="referenceDoctor"
      value={formData.referenceDoctor || ''}
      onChange={handleChange}
      className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
      placeholder="Enter doctor's name"
    />
  </div>
</div>
            </div>
          </div>
        </div>

        {/* Test Template Selection */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Test Template</h3>
            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <label htmlFor="templateSelect" className="form-label">
                  Select Test Template
                </label>
                <div className="mt-1">
                  <select
                    id="templateSelect"
                    name="templateSelect"
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    onChange={handleTemplateSelect}
                    value={selectedTemplate}
                  >
                    <option value="">Select a template</option>
                    <option value="custom">Custom Test</option>
                    {availableTemplates.map(template => (
                      <option key={template._id} value={template._id}>
                        {template.name} - {template.category}
                      </option>
                    ))}
                  </select>
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
                <label htmlFor="testName" className="form-label">
                  Test Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="testName"
                    id="testName"
                    required
                    value={formData.testName}
                    onChange={handleChange}
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="category" className="form-label">
                  Category
                </label>
                <div className="mt-1">
                  <select
                    id="category"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleChange}
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">Select category</option>
                    {Object.entries(TEST_CATEGORIES).map(([key, value]) => (
                      <option key={key} value={value}>
                        {key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="sampleType" className="form-label">
                  Sample Type
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="sampleType"
                    id="sampleType"
                    required
                    value={formData.sampleType}
                    onChange={handleChange}
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="collectionDate" className="form-label">
                  Collection Date
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    name="collectionDate"
                    id="collectionDate"
                    required
                    value={formData.collectionDate}
                    onChange={handleChange}
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="reportDate" className="form-label">
                  Report Date
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    name="reportDate"
                    id="reportDate"
                    required
                    value={formData.reportDate}
                    onChange={handleChange}
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="status" className="form-label">
                  Status
                </label>
                <div className="mt-1">
                  <select
                    id="status"
                    name="status"
                    required
                    value={formData.status}
                    onChange={handleChange}
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  >
                    {Object.entries(REPORT_STATUS).map(([key, value]) => (
                      <option key={key} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
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
              {selectedTemplate === 'custom' && (
                <button
                  type="button"
                  onClick={addParameter}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add Parameter
                </button>
              )}
            </div>
            
            {formData.testParameters.length === 0 ? (
              <div className="mt-4 text-sm text-gray-500">
                {selectedTemplate ? 'No parameters defined for this template.' : 'Please select a test template to see parameters.'}
              </div>
            ) : (
              <div className="mt-6">
                {hasSections ? (
                  // Group parameters by section
                  Object.entries(
                    formData.testParameters.reduce((acc, param) => {
                      const section = param.section || 'Default';
                      if (!acc[section]) acc[section] = [];
                      acc[section].push(param);
                      return acc;
                    }, {})
                  ).map(([section, parameters], sectionIndex) => (
                    <div key={sectionIndex} className="mb-8">
                      <h4 className="text-md font-medium text-gray-800 mb-4">{section}</h4>
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead>
                          <tr>
                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Parameter</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Value</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Unit</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Reference Range</th>
                            {selectedTemplate === 'custom' && (
                              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                <span className="sr-only">Actions</span>
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {parameters.map((param, paramIndex) => {
                            const globalIndex = formData.testParameters.findIndex(p => 
                              p.name === param.name && p.section === param.section
                            );
                            return (
                              <tr 
                                key={paramIndex} 
                                className={getRowBackgroundColor(param.value, param.referenceRange)}
                              >
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                  {param.name}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                  <input
                                    type="text"
                                    value={param.value}
                                    onChange={(e) => handleParameterChange(globalIndex, 'value', e.target.value)}
                                    className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                                  />
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                  {param.unit}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                  {param.referenceRange}
                                </td>
                                {selectedTemplate === 'custom' && (
                                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                    <button
                                      type="button"
                                      onClick={() => removeParameter(globalIndex)}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      Remove
                                    </button>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ))
                ) : (
                  // Flat list of parameters
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Parameter</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Value</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Unit</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Reference Range</th>
                        {selectedTemplate === 'custom' && (
                          <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                            <span className="sr-only">Actions</span>
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {formData.testParameters.map((param, index) => (
                        <tr 
                          key={index}
                          className={getRowBackgroundColor(param.value, param.referenceRange)}
                        >
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            {selectedTemplate === 'custom' ? (
                              <input
                                type="text"
                                value={param.name}
                                onChange={(e) => handleParameterChange(index, 'name', e.target.value)}
                                placeholder="Parameter name"
                                className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                              />
                            ) : (
                              param.name
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <input
                              type="text"
                              value={param.value}
                              onChange={(e) => handleParameterChange(index, 'value', e.target.value)}
                              className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                            />
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {selectedTemplate === 'custom' ? (
                              <input
                                type="text"
                                value={param.unit}
                                onChange={(e) => handleParameterChange(index, 'unit', e.target.value)}
                                placeholder="Unit"
                                className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                              />
                            ) : (
                              param.unit
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {selectedTemplate === 'custom' ? (
                              <input
                                type="text"
                                value={param.referenceRange}
                                onChange={(e) => handleParameterChange(index, 'referenceRange', e.target.value)}
                                placeholder="e.g. 10-20"
                                className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                              />
                            ) : (
                              param.referenceRange
                            )}
                          </td>
                          {selectedTemplate === 'custom' && (
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                              <button
                                type="button"
                                onClick={() => removeParameter(index)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Remove
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Additional Notes</h3>
            <div className="mt-6">
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="Add any additional notes or observations here..."
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isLoading ? 'Creating Report...' : 'Create Report'}
          </button>
        </div>
      </form>
    </div>
  );
}
