import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ExclamationCircleIcon, CheckCircleIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { reports, patients, doctors } from '../../utils/api';
import { REPORT_STATUS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import TestParametersForm from './TestParametersForm';

export default function CreateReportForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [patientList, setPatientList] = useState([]);
  const [doctorList, setDoctorList] = useState([]);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    patientAge: '',
    patientGender: '',
    patientDesignation: '', // Added designation state
    patientPhone: '',
    testName: '',
    category: '',
    sampleType: '',
    collectionDate: new Date().toISOString().split('T')[0],
    reportDate: new Date().toISOString().split('T')[0],
    price: '', // Add price field
    status: 'in-progress',
    notes: '',
    technicianId: user?.id || '',
    labId: user?.lab || '',
    testParameters: [],
    referenceDoctor: ''
  });

  // Fetch patients and doctors when component mounts
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const patientId = params.get('patientId');
    
    // Initialize data
    const initializeData = async () => {
      await Promise.all([
        fetchPatients(),
        fetchDoctors()
      ]);
      
      if (patientId) {
        fetchPatientDetails(patientId);
      }
    };
    
    initializeData(); 
  }, [location]);

  // Fetch doctors list
  const fetchDoctors = async () => {
    try {
      const response = await doctors.getAll();
      if (response && response.data) {
        setDoctorList(response.data);
      } else {
        setDoctorList([]);
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setDoctorList([]);
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

      const patientId = patientData.patientId || patientData._id || patientData.id;

      // Add detailed logging to check the exact values before setting state
      console.log('--- Updating Form Data ---');
      console.log('Patient ID:', patientId);
      console.log('Full Name from API:', patientData.fullName);
      console.log('Age from API:', patientData.age);
      console.log('Gender from API:', patientData.gender);
      console.log('Designation from API:', patientData.designation); // Log designation
      console.log('Phone from API:', patientData.phone);
      console.log('--------------------------');

      // Update form data with patient details
      setFormData(prev => ({
        ...prev,
        patientId: patientId,
        patientName: patientData.fullName || '',
        patientAge: patientData.age || '',
        patientGender: patientData.gender || '',
        patientDesignation: patientData.designation || '', // Set designation
        patientPhone: patientData.phone || ''
      }));

      setError('');
      // Set search term to show selected patient, then close dropdown
      setPatientSearchTerm(`${patientData.fullName} - ${patientData.phone}`);
      setShowPatientDropdown(false); // Ensure dropdown closes after selection
    } catch (err) {
      console.error('Error fetching patient details:', err);
      if (err.message === 'Not authorized to access this patient') {
        setError('You do not have permission to access this patient\'s data. Please select a patient from your lab.');
      } else {
        setError('Failed to load patient details. Please try again or select a different patient.');
      }
      // Removed the clearing of form data on error to prevent fields from being wiped.
      // The error message above will inform the user of the issue.
    }
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'price') {
      // Allow only digits for price, or empty string
      const intValue = value === '' ? '' : parseInt(value, 10);
      if (!isNaN(intValue) || value === '') {
        setFormData(prev => ({
          ...prev,
          [name]: value === '' ? '' : String(intValue) // Store as string or empty
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Ensure a patient is selected
      if (!formData.patientId) {
        setError('Please select an existing patient. If the patient is new, add them via the "Add Patient" page first.');
        setIsLoading(false);
        return;
      }
      const patientId = formData.patientId; // Use the selected patient ID

      // Debug: Log required fields before validation
      console.log('DEBUG required fields:', {
        testName: formData.testName,
        category: formData.category,
        sampleType: formData.sampleType
      });

      // Validate required fields
      if (!formData.testName || !formData.category || !formData.sampleType) {
        setError('Please fill in all required test information fields');
        setIsLoading(false);
        return;
      }

      // Validate test parameters
      if (!formData.testParameters || formData.testParameters.length === 0) {
        setError('Please select a test template or add at least one test parameter');
        setIsLoading(false);
        return;
      }

      // Check if all test parameters have values (excluding headers and special parameters)
      const missingValues = formData.testParameters.filter(param => {
        // Skip header rows and parameters that don't need values
        if (param.isHeader) return false;
        
        // Skip parameters in CRP test section if it's not shown
        if (param.section === "CRP test" && !formData.showCRPTest) return false;
        
        return !param.name || !param.value;
      });
      
      if (missingValues.length > 0) {
        console.log('Missing values in parameters:', missingValues);
        setError('Please provide values for all test parameters');
        setIsLoading(false);
        return;
      }

      // Generate a unique sample ID
      const sampleId = `SAMPLE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Format the data according to the Report model structure
      const reportData = {
        patientInfo: {
          designation: formData.patientDesignation, // Include designation
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
          description: '',
          method: '',
          sampleType: formData.sampleType || 'Blood',
          sampleCollectionDate: new Date(formData.collectionDate),
          sampleId: sampleId,
          price: parseInt(formData.price, 10) || 0, // Ensure price is an integer
          referenceDoctor: formData.referenceDoctor || '' // Include reference doctor
        },
        results: formData.testParameters.map(param => ({
          parameter: param.name || 'Unknown Parameter',
          value: param.value || 'N/A',
          unit: param.unit || '',
          referenceRange: param.referenceRange || '',
          notes: param.notes || '',
          isHeader: param.isHeader || false,
          isSubparameter: param.isSubparameter || false,
          section: param.section || 'Default',
          // flag: getAbnormalFlag(param.value, param.referenceRange, formData.patientGender), // <<< REMOVE frontend flag calculation
          templateId: param.templateId
        })),
        templateNotes: formData.templateNotes || {}, // Send the template notes object
        testNotes: formData.testNotes || '', // Send the general notes separately
        // showCRPTest: formData.showCRPTest || false, // This seems unused now
        status: REPORT_STATUS.IN_PROGRESS,
        lab: user?.lab,
        technician: user?.id,
        reportMeta: {
          generatedAt: new Date(),
          version: 1
        },
        selectedTemplateIds: formData.selectedTemplateIds || []
      };

      console.log('Formatted report data:', JSON.stringify(reportData, null, 2));
      
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

  // REMOVED frontend getAbnormalFlag function as backend will handle it
  /*
  const getAbnormalFlag = (value, referenceRange, gender) => {
    // ... existing frontend logic ...
  };
  */
  /* // Removing stray code left from previous incorrect diff application
    if (isNaN(numValue)) return 'normal';

    // Handle gender-specific ranges like "M: 13.5–18.0; F: 11.5–16.4"
    const genderMatch = referenceRange.match(/M:\s*(\d+\.?\d*)[–-](\d+\.?\d*);\s*F:\s*(\d+\.?\d*)[–-](\d+\.?\d*)/);
    if (genderMatch) {
      const maleMin = parseFloat(genderMatch[1]);
      const maleMax = parseFloat(genderMatch[2]);
      const femaleMin = parseFloat(genderMatch[3]);
      const femaleMax = parseFloat(genderMatch[4]);

      // Use the appropriate range based on patient gender
      if (gender === 'male' && !isNaN(maleMin) && !isNaN(maleMax)) {
        if (numValue < maleMin) return 'low';
        if (numValue > maleMax) return 'high';
        return 'normal';
      } else if (gender === 'female' && !isNaN(femaleMin) && !isNaN(femaleMax)) {
        if (numValue < femaleMin) return 'low';
        if (numValue > femaleMax) return 'high';
        return 'normal';
      }
    }

    // Clean the reference range by removing commas
    const cleanRange = referenceRange.replace(/,/g, '');

    // Handle numeric ranges like "10-20", "10–20", "10 - 20", or "10 -- 20"
    const numericMatch = cleanRange.match(/(\d+\.?\d*)\s*(?:–|--|-)\s*(\d+\.?\d*)/);
    if (numericMatch) {
      const min = parseFloat(numericMatch[1]);
      const max = parseFloat(numericMatch[2]);

      if (!isNaN(min) && !isNaN(max)) {
        if (numValue < min) return 'low';
        if (numValue > max) return 'high';
        return 'normal';
      }
    }

    // Handle "Up to X" format
    const upToMatch = cleanRange.match(/Up\s+to\s+(\d+\.?\d*)/i);
    if (upToMatch) {
      const max = parseFloat(upToMatch[1]);
      if (!isNaN(max)) {
        if (numValue > max) return 'high';
        return 'normal';
      }
    }

    // Handle ranges with < or > symbols like "<5" or ">10"
    const lessThanMatch = cleanRange.match(/\s*<\s*(\d+\.?\d*)/);
    if (lessThanMatch) {
      const max = parseFloat(lessThanMatch[1]);
      if (!isNaN(max)) {
        if (numValue >= max) return 'high';
        return 'normal';
      }
    }

    const greaterThanMatch = cleanRange.match(/\s*>\s*(\d+\.?\d*)/);
    if (greaterThanMatch) {
      const min = parseFloat(greaterThanMatch[1]);
      if (!isNaN(min)) {
        if (numValue <= min) return 'low';
        return 'normal';
      }
    }

    return 'normal'; // Default to normal if we can't determine
  };
  */

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden">
        <div className="px-8 py-6 bg-gradient-to-r from-blue-700 to-blue-500">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-white mr-3" />
              <div>
                <h1 className="text-3xl font-extrabold text-white">Create New Report</h1>
                <p className="text-base text-blue-100 mt-1">
                  Create a new patient report with test results
                </p>
              </div>
            </div>
          </div>
        </div>

        <form className="p-8 space-y-8" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4">
              <div className="flex items-center">
                <ExclamationCircleIcon className="h-5 w-5 mr-2 text-red-500" aria-hidden="true" />
                <span className="font-medium">Error:</span>
                <span className="ml-2">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded mb-4">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 mr-2 text-green-500" aria-hidden="true" />
                <span className="font-medium">Success:</span>
                <span className="ml-2">{success}</span>
              </div>
            </div>
          )}

          {/* Patient Information */}
          <section>
            <h2 className="text-xl font-semibold text-blue-700 mb-4 border-b border-blue-100 pb-2">
              Patient Information
              {formData.patientId && (
                <span className="text-sm text-gray-500 italic ml-2 font-normal">
                  (Patient information is locked for data integrity. Only Reference Doctor can be modified.)
                </span>
              )}
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <label htmlFor="patientSelect" className="block text-sm font-medium text-gray-700 mb-1">
                  Select or Search Patient
                </label>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    id="patientSearch"
                    name="patientSearch"
                    placeholder="Type to search patients by name or phone"
                    value={patientSearchTerm}
                    onChange={(e) => {
                      setPatientSearchTerm(e.target.value);
                      setShowPatientDropdown(true);
                    }}
                    onFocus={() => setShowPatientDropdown(true)}
                    onBlur={() => {
                      // Delay hiding dropdown to allow click events to register
                      setTimeout(() => setShowPatientDropdown(false), 200);
                    }}
                    className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  />
                  
                  {showPatientDropdown && patientSearchTerm && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm border border-blue-200">
                      {/* Removed "Add New Patient" option */}
                      {patientList
                        .filter(patient =>
                          patient.fullName?.toLowerCase().includes(patientSearchTerm.toLowerCase()) || 
                          patient.phone?.includes(patientSearchTerm)
                        )
                        .map(patient => {
                          // Handle both MongoDB _id and id formats
                          const patientId = patient._id || patient.id;
                          return (
                            <div 
                              key={patientId}
                              className="cursor-pointer select-none relative py-2 pl-3 pr-9 text-gray-900 hover:bg-blue-50"
                              onMouseDown={() => { // Changed from onClick to onMouseDown
                                console.log(`Patient selected: ID=${patientId}, Name=${patient.fullName}`); // Keep log for verification
                                fetchPatientDetails(patientId);
                                setPatientSearchTerm(`${patient.fullName} - ${patient.phone}`);
                                setShowPatientDropdown(false);
                              }}
                            >
                              {patient.fullName} - {patient.phone}
                            </div>
                          );
                        })
                      }
                      
                      {patientList.filter(patient => 
                        patient.fullName?.toLowerCase().includes(patientSearchTerm.toLowerCase()) || 
                        patient.phone?.includes(patientSearchTerm)
                      ).length === 0 && (
                        <div className="cursor-default select-none relative py-2 pl-3 pr-9 text-gray-500">
                          No patients found. Type to add a new patient.
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {formData.patientId && (
                  <div className="mt-2 text-sm text-blue-600">
                    Selected: {formData.patientName} - {formData.patientPhone}
                  </div>
                )}
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full name { !formData.patientId && <span className="text-red-500 ml-1">*</span> }
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="patientName"
                    id="patientName"
                    required
                    placeholder="Select a patient above"
                    value={formData.patientName}
                    onChange={handleChange}
                    className={`block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition ${formData.patientId ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    readOnly={true} // Keep readOnly
                  />
                </div>
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="patientAge" className="block text-sm font-medium text-gray-700 mb-1">
                  Age { !formData.patientId && <span className="text-red-500 ml-1">*</span> }
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="patientAge"
                    id="patientAge"
                    required
                    placeholder="Select patient"
                    min="0"
                    max="150"
                    value={formData.patientAge}
                    onChange={handleChange}
                    className={`block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition ${formData.patientId ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    readOnly={true} // Keep readOnly
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="patientGender" className="block text-sm font-medium text-gray-700 mb-1">
                  Gender { !formData.patientId && <span className="text-red-500 ml-1">*</span> }
                </label>
                <div className="mt-1">
                  <select
                    id="patientGender"
                    name="patientGender"
                    required
                    value={formData.patientGender}
                    onChange={handleChange}
                    className={`block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition ${formData.patientId ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    disabled={true} // Keep disabled
                  >
                    <option value="">Select patient</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="patientPhone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone number { !formData.patientId && <span className="text-red-500 ml-1">*</span> }
                </label>
                <div className="mt-1">
                  <input
                    type="tel"
                    name="patientPhone"
                    id="patientPhone"
                    required
                    placeholder="Select patient"
                    value={formData.patientPhone}
                    onChange={handleChange}
                    className={`block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition ${formData.patientId ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    readOnly={true} // Keep readOnly
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="referenceDoctor" className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Doctor
                </label>
                <div className="mt-1">
                  <select
                    id="referenceDoctor"
                    name="referenceDoctor"
                    value={formData.referenceDoctor || ''}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  >
                    <option value="">Select a reference doctor</option>
                    {doctorList.map(doctor => (
                      <option key={doctor._id} value={doctor.name}>
                        {doctor.name} - {doctor.specialty}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2 text-xs text-gray-500">
                    <a href="/doctors" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                      Manage reference doctors
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Test Parameters Form Component */}
          <TestParametersForm 
            formData={formData} 
            setFormData={setFormData} 
            patientGender={formData.patientGender}
            patientAge={formData.patientAge}
            setError={setError}
          />

          {/* Submit Button */}
          <div className="flex justify-center space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/reports')}
              className="px-6 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold shadow hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 rounded-lg border border-transparent bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold shadow hover:from-blue-700 hover:to-blue-600 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {isLoading ? 'Creating Report...' : 'Create Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
