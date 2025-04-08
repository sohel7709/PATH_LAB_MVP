import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { superAdmin } from '../../utils/api';

const CreateUser = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'technician',
    lab: ''
  });
  
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fetchingLabs, setFetchingLabs] = useState(true);

  // Fetch available labs
  useEffect(() => {
    const fetchLabs = async () => {
      try {
        setFetchingLabs(true);
        const response = await superAdmin.getLabs();
        if (response.success) {
          setLabs(response.data || []);
        }
      } catch (err) {
        console.error('Error fetching labs:', err);
      } finally {
        setFetchingLabs(false);
      }
    };
    
    fetchLabs();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // If role is super-admin, remove lab
      const userData = { ...formData };
      if (userData.role === 'super-admin') {
        userData.lab = undefined;
      }
      
      await superAdmin.createUser(userData);
      
      setSuccess('User created successfully!');
      setTimeout(() => {
        navigate('/users');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-6 py-4 bg-primary-600 text-white">
        <h1 className="text-2xl font-bold">Create New User</h1>
        <p className="text-sm opacity-80">Add a new user to the system</p>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-medium text-gray-900 mb-4">User Information</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">Password must be at least 6 characters long</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Role & Lab Assignment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                User Role <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="technician">Lab Technician</option>
                <option value="admin">Lab Admin</option>
                <option value="super-admin">Super Admin</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {formData.role === 'technician' 
                  ? 'Technicians can create and manage reports' 
                  : formData.role === 'admin' 
                  ? 'Admins can manage lab settings and users' 
                  : 'Super Admins have full system access'}
              </p>
            </div>
            
            {formData.role !== 'super-admin' && (
              <div>
                <label htmlFor="lab" className="block text-sm font-medium text-gray-700">
                  Assign to Lab <span className="text-red-500">*</span>
                </label>
                {fetchingLabs ? (
                  <div className="mt-1 block w-full h-10 flex items-center justify-center">
                    <p className="text-sm text-gray-500">Loading labs...</p>
                  </div>
                ) : (
                  <select
                    id="lab"
                    name="lab"
                    value={formData.lab}
                    onChange={handleChange}
                    required={formData.role !== 'super-admin'}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="">Select a lab</option>
                    {labs.map((lab) => (
                      <option key={lab._id} value={lab._id}>
                        {lab.name}
                      </option>
                    ))}
                  </select>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {formData.role === 'technician' 
                    ? 'The lab where this technician will work' 
                    : 'The lab this admin will manage'}
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-8 border-t border-gray-200 pt-6">
          <div className="flex justify-center space-x-4">
            <button
              type="button"
              onClick={() => navigate('/users')}
              className="px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateUser;
