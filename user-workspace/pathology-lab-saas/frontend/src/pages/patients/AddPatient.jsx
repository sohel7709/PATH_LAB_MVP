import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExclamationCircleIcon, UserPlusIcon } from '@heroicons/react/20/solid';
import { useAuth } from '../../context/AuthContext';

export default function AddPatient() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    labId: user?.lab || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        <div className="bg-white shadow-md sm:rounded-lg">
          <div className="px-6 py-6 sm:p-8">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Patient Information</h3>
            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="fullName" className="form-label">
                  Full name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="fullName"
                    id="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="age" className="form-label">
                  Age
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="age"
                    id="age"
                    required
                    min="0"
                    max="150"
                    value={formData.age}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="gender" className="form-label">
                  Gender
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
                <label htmlFor="phone" className="form-label">
                  Phone number
                </label>
                <div className="mt-1">
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="email" className="form-label">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="address" className="form-label">
                  Address
                </label>
                <div className="mt-1">
                  <textarea
                    name="address"
                    id="address"
                    rows={3}
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
        <div className="bg-gray-50 p-6 rounded-lg shadow-md">
          <div className="flex justify-center sm:justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/patients')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
            >
              {isLoading ? 'Adding...' : 'Add Patient'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
