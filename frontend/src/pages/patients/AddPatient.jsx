import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExclamationCircleIcon, UserPlusIcon } from '@heroicons/react/20/solid';
import { useAuth } from '../../context/AuthContext';

export default function AddPatient() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [duplicatePatient, setDuplicatePatient] = useState(null);
  const [validationErrors, setValidationErrors] = useState({
    phone: ''
  });
  
  const [formData, setFormData] = useState({
    designation: '', // Added designation field
    fullName: '',
    age: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    labId: user?.lab || '',
  });

  // Validate phone number (optional)
  const validatePhoneNumber = (phone) => {
    // Remove any non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    
    // If phone is empty, it's valid as it's optional
    if (digitsOnly.length === 0) {
      return ''; 
    }
    
    // If phone is not empty, it must be 10 digits
    if (digitsOnly.length !== 10) {
      return 'If provided, phone number must be exactly 10 digits';
    }
    
    return ''; // No error
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for phone field
    if (name === 'phone') {
      // Only allow digits to be entered
      const digitsOnly = value.replace(/\D/g, '');
      
      // Limit to 10 digits
      const truncated = digitsOnly.slice(0, 10);
      
      // Update form data with digits only
      setFormData(prev => ({
        ...prev,
        [name]: truncated
      }));
      
      // Validate and set error
      const phoneError = validatePhoneNumber(truncated);
      setValidationErrors(prev => ({
        ...prev,
        phone: phoneError
      }));
    } else {
      // Normal handling for other fields
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate phone number before submission (only if provided)
    if (formData.phone.trim() !== '') {
        const phoneError = validatePhoneNumber(formData.phone);
        if (phoneError) {
          setValidationErrors(prev => ({
            ...prev,
            phone: phoneError
          }));
          // Focus on the phone input
          document.getElementById('phone').focus();
          return;
        }
    } else {
        // Clear any previous phone error if phone is now empty
        setValidationErrors(prev => ({ ...prev, phone: ''}));
    }
    
    setIsLoading(true);
    setError('');
    setDuplicatePatient(null);

    try {
      // Import the API utility
      const { patients } = await import('../../utils/api');
      
      // Create a new patient
      await patients.create(formData);
      
      // Redirect to patients list or create report page
      navigate('/patients');
    } catch (err) {
      console.error('Error creating patient:', err);
      
      // Check if this is a duplicate patient error
      if (err.response && err.response.data && err.response.data.duplicate) {
        setDuplicatePatient(err.response.data.patient);
        setError('Patient already exists in the system');
      } else if (err.response && err.response.data && err.response.data.message) {
        // Server returned a specific error message
        setError(err.response.data.message);
      } else {
        setError(err.message || 'Failed to add patient');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 py-8 px-2">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden">
        <div className="px-8 py-6 bg-gradient-to-r from-blue-700 to-blue-500">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <UserPlusIcon className="h-8 w-8 text-white mr-3" />
              <div>
                <h1 className="text-3xl font-extrabold text-white">Add New Patient</h1>
                <p className="text-base text-blue-100 mt-1">
                  Enter patient details to add them to the system
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
              
              {duplicatePatient && (
                <div className="mt-3 p-3 bg-white rounded border border-red-200">
                  <h4 className="font-medium text-red-800 mb-2">Duplicate Patient Details:</h4>
                  <ul className="text-sm space-y-1">
                    <li><span className="font-medium">Name:</span> {duplicatePatient.fullName}</li>
                    <li><span className="font-medium">Age:</span> {duplicatePatient.age}</li>
                    <li><span className="font-medium">Gender:</span> {duplicatePatient.gender}</li>
                    <li><span className="font-medium">Phone:</span> {duplicatePatient.phone}</li>
                    {duplicatePatient.email && <li><span className="font-medium">Email:</span> {duplicatePatient.email}</li>}
                  </ul>
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => navigate(`/patients/${duplicatePatient._id}`)}
                      className="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      View Patient
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Patient Information */}
          <section>
            <h2 className="text-xl font-semibold text-blue-700 mb-4 border-b border-blue-100 pb-2">
              Patient Information
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Please fill in the patient details. Fields marked with <span className="text-red-500">*</span> are required.
            </p>
            
            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {/* Designation Dropdown */}
              <div className="sm:col-span-1">
                <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-1">
                  Designation <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="mt-1">
                  <select
                    id="designation"
                    name="designation"
                    required
                    value={formData.designation}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  >
                    <option value="">Select</option>
                    <option value="Mr.">Mr.</option>
                    <option value="Mrs.">Mrs.</option>
                    <option value="Ms.">Ms.</option>
                    <option value="Dr.">Dr.</option>
                    <option value="Master">Master</option>
                    <option value="Miss">Miss</option>
                  </select>
                </div>
              </div>

              {/* Full Name Input - Adjusted column span */}
              <div className="sm:col-span-2"> 
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full name <span className="text-red-500 ml-1">*</span>
                  <span className="ml-1 text-gray-400 text-sm">(as per records)</span>
                </label>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    name="fullName"
                    id="fullName"
                    required
                    placeholder="Enter patient's full name"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  />
                </div>
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                  Age <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="age"
                    id="age"
                    required
                    min="0"
                    max="150"
                    placeholder="Age"
                    value={formData.age}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                  Gender <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="mt-1">
                  <select
                    id="gender"
                    name="gender"
                    required
                    value={formData.gender}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone number <span className="text-gray-400 text-sm">(optional)</span>
                </label>
                <div className="mt-1 relative">
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    // required // Removed required attribute
                    placeholder="Enter contact number"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`block w-full rounded-lg border ${validationErrors.phone ? 'border-red-500' : (formData.phone.length === 0 || formData.phone.length === 10) ? (formData.phone.length === 10 ? 'border-green-500' : 'border-blue-300') : 'border-blue-300'} px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition`}
                    pattern="[0-9]{10}" // Keep pattern for format guidance if filled
                    title="If provided, phone number must be 10 digits"
                    maxLength="10"
                  />
                  {formData.phone.length > 0 && ( // Show icon only if something is typed
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      {formData.phone.length === 10 ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  )}
                </div>
                {validationErrors.phone && ( // Show validation error if it exists
                  <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
                )}
                {formData.phone.length > 0 && formData.phone.length < 10 && !validationErrors.phone && ( // Show guidance if partially filled and no error
                  <p className="text-xs text-gray-500 mt-1">
                    {10 - formData.phone.length} more digits needed for a 10-digit number.
                  </p>
                )}
                 {!validationErrors.phone && formData.phone.length === 0 && ( // Default helper text when empty and no error
                  <p className="text-xs text-gray-500 mt-1">
                    Optional. If provided, must be 10 digits.
                  </p>
                )}
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address <span className="text-gray-400 text-sm">(optional)</span>
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    name="email"
                    id="email"
                    placeholder="patient@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address <span className="text-gray-400 text-sm">(optional)</span>
                </label>
                <div className="mt-1">
                  <textarea
                    name="address"
                    id="address"
                    rows={3}
                    placeholder="Enter patient's full address"
                    value={formData.address}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex justify-center space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/patients')}
              className="px-6 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold shadow hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 rounded-lg border border-transparent bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold shadow hover:from-blue-700 hover:to-blue-600 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding Patient...
                </>
              ) : (
                <>
                  <UserPlusIcon className="h-5 w-5 mr-2 inline-block" />
                  Add Patient
                </>
              )}
            </button>
          </div>
          <p className="text-center text-xs text-gray-500 mt-4">
            By adding a patient, you confirm that you have obtained proper consent for storing their information.
          </p>
        </form>
      </div>
    </div>
  );
}
