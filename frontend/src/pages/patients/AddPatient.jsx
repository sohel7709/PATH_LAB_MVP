import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExclamationCircleIcon, UserPlusIcon } from '@heroicons/react/20/solid';
import { useAuth } from '../../context/AuthContext';

export default function AddPatient() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({
    phone: ''
  });
  
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    labId: user?.lab || '',
  });

  // Validate phone number
  const validatePhoneNumber = (phone) => {
    // Remove any non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    
    if (digitsOnly.length === 0) {
      return ''; // Empty is allowed during typing
    }
    
    if (digitsOnly.length !== 10) {
      return 'Phone number must be exactly 10 digits';
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
    
    // Validate phone number before submission
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
    
    setIsLoading(true);
    setError('');

    try {
      // Import the API utility
      const { patients } = await import('../../utils/api');
      
      // Create a new patient
      await patients.create(formData);
      
      // Redirect to patients list or create report page
      navigate('/patients');
    } catch (err) {
      setError(err.message || 'Failed to add patient');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between bg-gradient-to-r from-blue-600 to-blue-800 p-6 rounded-lg shadow-md mb-6 text-white">
        <div className="min-w-0 flex-1 flex items-center">
          <UserPlusIcon className="h-10 w-10 text-white mr-4" />
          <div>
            <h2 className="text-2xl font-bold leading-7 text-white sm:truncate sm:text-3xl sm:tracking-tight">
              Add New Patient
            </h2>
            <p className="mt-1 text-sm text-white opacity-90">
              Enter patient details to add them to the system
            </p>
          </div>
        </div>
      </div>

      <form className="mt-8 space-y-8" onSubmit={handleSubmit}>
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

        {/* Patient Information */}
        <div className="bg-white shadow-lg sm:rounded-lg border border-blue-100">
          <div className="px-6 py-6 sm:p-8">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-2 rounded-full mr-3">
                <UserPlusIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-medium leading-6 text-gray-900">Patient Information</h3>
            </div>
            
            <p className="text-sm text-gray-500 mb-6">
              Please fill in the patient details. Fields marked with <span className="text-red-500">*</span> are required.
            </p>
            
            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="fullName" className="form-label flex items-center">
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
                    className="input-field"
                  />
                </div>
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="age" className="form-label flex items-center">
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
                    className="input-field"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="gender" className="form-label flex items-center">
                  Gender <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="mt-1">
                  <select
                    id="gender"
                    name="gender"
                    required
                    value={formData.gender}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="phone" className="form-label flex items-center">
                  Phone number <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="mt-1 relative">
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    required
                    placeholder="Enter contact number"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`input-field ${validationErrors.phone ? 'border-red-500' : formData.phone.length === 10 ? 'border-green-500' : ''}`}
                    pattern="[0-9]{10}"
                    title="Phone number must be exactly 10 digits"
                    maxLength="10"
                  />
                  {formData.phone.length > 0 && (
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
                {validationErrors.phone ? (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    Format: 10-digit number without spaces or dashes
                    {formData.phone.length > 0 && formData.phone.length < 10 && 
                      ` (${10 - formData.phone.length} more digits needed)`}
                  </p>
                )}
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="email" className="form-label">
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
                    className="input-field"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="address" className="form-label">
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
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg shadow-md border border-blue-100">
          <div className="flex flex-col sm:flex-row justify-center sm:justify-end space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              type="button"
              onClick={() => navigate('/patients')}
              className="btn-secondary flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`btn-primary flex items-center justify-center ${isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:translate-y-[-2px] transition-transform'}`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding Patient...
                </>
              ) : (
                <>
                  <UserPlusIcon className="h-5 w-5 mr-2" />
                  Add Patient
                </>
              )}
            </button>
          </div>
          <p className="text-center text-xs text-gray-500 mt-4">
            By adding a patient, you confirm that you have obtained proper consent for storing their information.
          </p>
        </div>
      </form>
    </div>
  );
}
