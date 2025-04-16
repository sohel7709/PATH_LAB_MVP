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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 py-8 px-2">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden">
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
                  Select Patient
                </label>
                <div className="mt-1">
                  <select
                    id="patientSelect"
                    name="patientSelect"
                    className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
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
                <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                    readOnly={!!formData.patientId}
                  />
                </div>
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="patientAge" className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                    readOnly={!!formData.patientId}
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="patientGender" className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <div className="mt-1">
                  <select
                    id="patientGender"
                    name="patientGender"
                    required
                    value={formData.patientGender}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
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
                <label htmlFor="patientPhone" className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                    readOnly={!!formData.patientId}
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
