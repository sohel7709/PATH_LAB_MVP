import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { users, superAdmin } from '../../utils/api.js';
import { ExclamationCircleIcon, CheckCircleIcon, UserIcon } from '@heroicons/react/24/outline';

const EditUser = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'technician',
    labId: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [labs, setLabs] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Use the appropriate API function based on user role
        let userData;
        if (user?.role === 'super-admin') {
          const response = await superAdmin.getUser(id);
          userData = response.data;
          console.log('User data from API:', userData);
        } else {
          const response = await users.getById(id);
          userData = response.data;
        }
        
        if (!userData) {
          throw new Error('User not found');
        }
        
        // Fetch labs for dropdown first to ensure they're available
        let labsList = [];
        if (user?.role === 'super-admin') {
          const labsResponse = await superAdmin.getLabs();
          labsList = labsResponse.data || [];
          setLabs(labsList);
        }
        
        // Handle lab ID properly - it might be an object or a string
        let labId = '';
        if (userData.lab) {
          if (typeof userData.lab === 'object' && userData.lab._id) {
            labId = userData.lab._id;
          } else if (typeof userData.lab === 'string') {
            labId = userData.lab;
          }
        }
        
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          password: '',
          role: userData.role || 'technician',
          labId: labId
        });
        
      } catch (err) {
        console.error('Error fetching user:', err);
        setError(err.message || 'Failed to fetch user');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id, user?.role]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Prepare data for API with the correct field name for lab ID
      const userData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        // Use labId instead of lab for the API
        labId: formData.role !== 'super-admin' ? formData.labId : undefined,
        // Only include password if it's not empty
        ...(formData.password ? { password: formData.password } : {})
      };
      
      console.log('Updating user with data:', userData);
      
      // Use the appropriate API function based on user role
      if (user?.role === 'super-admin') {
        await superAdmin.updateUser(id, userData);
      } else {
        await users.update(id, userData);
      }
      
      setSuccess('User updated successfully!');
      
      // Redirect after a short delay to show success message
      setTimeout(() => {
        navigate('/users');
      }, 1500);
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formData.name) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 py-8 px-2">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden">
        <div className="px-8 py-6 bg-gradient-to-r from-blue-700 to-blue-500">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <UserIcon className="h-8 w-8 text-white mr-3" />
              <div>
                <h1 className="text-3xl font-extrabold text-white">Edit User</h1>
                <p className="text-base text-blue-100 mt-1">
                  Update user information and permissions
                </p>
              </div>
            </div>
            <Link
              to="/users"
              className="inline-flex items-center justify-center rounded-lg border border-transparent bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
            >
              Back to Users
            </Link>
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
          
          {/* User Information */}
          <section>
            <h2 className="text-xl font-semibold text-blue-700 mb-4 border-b border-blue-100 pb-2">
              User Information
            </h2>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full name <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    type="password"
                    name="password"
                    id="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Leave blank to keep current password"
                    className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Leave blank to keep the current password
                </p>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  >
                    <option value="technician">Technician</option>
                    <option value="admin">Admin</option>
                    {user?.role === 'super-admin' && (
                      <option value="super-admin">Super Admin</option>
                    )}
                  </select>
                </div>
              </div>

              {user?.role === 'super-admin' && (
                <div className="sm:col-span-3">
                  <label htmlFor="labId" className="block text-sm font-medium text-gray-700 mb-1">
                    Lab
                  </label>
                  <div className="mt-1">
                    {formData.labId ? (
                      <div>
                        <select
                          id="labId"
                          name="labId"
                          value={formData.labId}
                          disabled
                          className="block w-full rounded-lg border border-blue-300 px-4 py-2 bg-gray-100 cursor-not-allowed"
                        >
                          <option value="">No Lab</option>
                          {labs.map((lab) => (
                            <option key={lab._id} value={lab._id}>
                              {lab.name}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                          {formData.labId ? 
                            `Assigned to: ${labs.find(l => l._id === formData.labId)?.name || 'Unknown Lab'}` : 
                            'No lab assigned'}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">Lab assignment cannot be changed once set</p>
                      </div>
                    ) : (
                      <select
                        id="labId"
                        name="labId"
                        value={formData.labId}
                        onChange={handleChange}
                        className="block w-full rounded-lg border border-blue-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                      >
                        <option value="">No Lab</option>
                        {labs.map((lab) => (
                          <option key={lab._id} value={lab._id}>
                            {lab.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Actions */}
          <div className="flex justify-center space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/users')}
              className="px-6 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold shadow hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-lg border border-transparent bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold shadow hover:from-blue-700 hover:to-blue-600 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUser;
