import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { doctors } from '../../utils/api';

const AddDoctor = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    phone: '',
    email: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic form validation
    if (!formData.name.trim()) {
      setError('Full Name is required.');
      return;
    }
    if (!formData.specialty.trim()) {
      setError('Specialty is required.');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Phone Number is required.');
      return;
    }
    // Check if phone number is exactly 10 digits
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setError('Phone number must be exactly 10 digits.');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required.');
      return;
    }
    // Simple email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      await doctors.create(formData);
      navigate('/doctors');
    } catch (err) {
      console.error('Error creating doctor:', err);
      // Show user-friendly error message
      let message = err?.response?.data?.message || err.message || 'Failed to create doctor. Please try again.';
      // Check for duplicate email error (example error message, adjust as per backend)
      if (message.toLowerCase().includes('duplicate') && message.toLowerCase().includes('email')) {
        message = 'A doctor with this email is already registered.';
      }
      alert(message);
      setError(message);
      setIsLoading(false);
    }
  };

  // Optionally, clear error on input change
  const handleInputChange = (e) => {
    if (error) setError('');
    handleChange(e);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 py-8 px-2">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden">
        <div className="px-8 py-6 bg-gradient-to-r from-blue-700 to-blue-500">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <UserIcon className="h-8 w-8 text-white mr-3" />
              <div>
                <h1 className="text-3xl font-extrabold text-white">Add Reference Doctor</h1>
                <p className="text-base text-blue-100 mt-1">
                  Add a new reference doctor to your lab
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/doctors')}
              className="inline-flex items-center justify-center rounded-lg border border-transparent bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
            >
              Back to Doctors
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4">
              <div className="flex items-center">
                <ExclamationCircleIcon className="h-5 w-5 mr-2 text-red-500" aria-hidden="true" />
                <span className="font-medium">Error:</span>
                <span className="ml-2">{error}</span>
              </div>
            </div>
          )}

          {/* Doctor Information */}
          <section>
            <h2 className="text-xl font-semibold text-blue-700 mb-4 border-b border-blue-100 pb-2">
              Doctor Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
        <input
          type="text"
          name="name"
          id="name"
          required
          value={formData.name}
          onChange={handleInputChange}
          className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
          placeholder="Enter doctor's full name"
        />
              </div>
              <div>
                <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-1">
                  Specialty <span className="text-red-500">*</span>
                </label>
        <input
          type="text"
          name="specialty"
          id="specialty"
          required
          value={formData.specialty}
          onChange={handleInputChange}
          className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
          placeholder="e.g., Cardiologist, Neurologist"
        />
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-xl font-semibold text-blue-700 mb-4 border-b border-blue-100 pb-2">
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
        <input
          type="tel"
          name="phone"
          id="phone"
          required
          value={formData.phone}
          onChange={handleInputChange}
          className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
          placeholder="Enter phone number"
        />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
        <input
          type="email"
          name="email"
          id="email"
          required
          value={formData.email}
          onChange={handleInputChange}
          className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
          placeholder="Enter email address"
        />
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex justify-center space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/doctors')}
              className="px-6 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold shadow hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 rounded-lg border border-transparent bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold shadow hover:from-blue-700 hover:to-blue-600 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {isLoading ? 'Saving...' : 'Save Doctor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDoctor;
