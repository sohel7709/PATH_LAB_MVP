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
          description: '',
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
          flag: param.value && param.referenceRange ? 
            (isValueNormal(param.value, param.referenceRange, formData.patientGender) ? 'normal' : 'high') : 
            'normal',
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

  // Check if value is within normal range (simplified version for form submission)
  const isValueNormal = (value, referenceRange, gender) => {
    if (!value || !referenceRange) return true;
    
    // Convert value to number (remove commas if present)
    const numValue = parseFloat(value.toString().replace(/,/g, ''));
    if (isNaN(numValue)) return true; // If value is not a number, consider it normal
    
    // Handle gender-specific ranges like "M: 13.5–18.0; F: 11.5–16.4"
    const genderMatch = referenceRange.match(/M:\s*(\d+\.?\d*)[–-](\d+\.?\d*);\s*F:\s*(\d+\.?\d*)[–-](\d+\.?\d*)/);
    if (genderMatch) {
      const maleMin = parseFloat(genderMatch[1]);
      const maleMax = parseFloat(genderMatch[2]);
      const femaleMin = parseFloat(genderMatch[3]);
      const femaleMax = parseFloat(genderMatch[4]);
      
      // Use the appropriate range based on patient gender
      if (gender === 'male' && !isNaN(maleMin) && !isNaN(maleMax)) {
        return numValue >= maleMin && numValue <= maleMax;
      } else if (gender === 'female' && !isNaN(femaleMin) && !isNaN(femaleMax)) {
        return numValue >= femaleMin && numValue <= femaleMax;
      }
    }
    
    // Clean the reference range by removing commas
    const cleanRange = referenceRange.replace(/,/g, '');
    
    // Handle numeric ranges like "10-20" or "10–20" (with en dash) or "10 - 20" (with spaces)
    const numericMatch = cleanRange.match(/(\d+\.?\d*)\s*[–-]\s*(\d+\.?\d*)/);
    if (numericMatch) {
      const min = parseFloat(numericMatch[1]);
      const max = parseFloat(numericMatch[2]);
      
      if (!isNaN(min) && !isNaN(max)) {
        return numValue >= min && numValue <= max;
      }
    }
    
    return true; // Default to normal if we can't determine
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
                  Reference Doctor
                </label>
                <div className="mt-1">
                  <select
                    id="referenceDoctor"
                    name="referenceDoctor"
                    value={formData.referenceDoctor || ''}
                    onChange={handleChange}
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
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
          </div>
        </div>

        {/* Test Parameters Form Component */}
        <TestParametersForm 
          formData={formData} 
          setFormData={setFormData} 
          patientGender={formData.patientGender}
          setError={setError}
        />

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
