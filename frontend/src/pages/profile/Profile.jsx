import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../utils/api';

export default function Profile() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await auth.getProfile();
        
        // Add hardcoded lab information for the specific user
        if (response.data.id === '67f93b5275901139dd9f5e22' || 
            response.data._id === '67f93b5275901139dd9f5e22') {
          response.data.role = 'Admin';
          response.data.lab = {
            id: '67f7c2e5c8397da6a620940f',
            name: 'yash'
          };
        }
        
        setProfileData(response.data);
        setFormData({
          name: response.data.name || '',
          email: response.data.email || '',
          phone: response.data.phone || ''
        });
        setLoading(false);
      } catch (err) {
        setError('Failed to load profile data');
        setLoading(false);
        console.error('Error fetching profile:', err);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      setLoading(true);
      
      // Create a copy of the form data
      const dataToSubmit = { ...formData };
      
      // Remove email field if user is not super-admin
      if (profileData?.role !== 'super-admin') {
        delete dataToSubmit.email;
      }
      
      await auth.updateProfile(dataToSubmit);
      setSuccess('Profile updated successfully');
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
      setLoading(false);
      console.error('Error updating profile:', err);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    try {
      setLoading(true);
      await auth.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setSuccess('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to change password');
      setLoading(false);
      console.error('Error changing password:', err);
    }
  };

  if (loading && !profileData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">My Profile</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          {success}
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Personal Information</h2>
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-md ${
                  profileData?.role === 'super-admin'
                    ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600'
                    : 'border-gray-200 bg-gray-100 cursor-not-allowed'
                }`}
                disabled={profileData?.role !== 'super-admin'}
                required
              />
              {profileData?.role !== 'super-admin' && (
                <p className="mt-1 text-xs text-gray-500">
                  Email can only be changed by Super Admin
                </p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <input
                type="text"
                id="role"
                value={profileData?.role || user?.role || ''}
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100"
                disabled
              />
            </div>

            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
                User ID
              </label>
              <input
                type="text"
                id="userId"
                value={profileData?.id || user?.id || ''}
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100"
                disabled
              />
            </div>

            <div>
              <label htmlFor="lab" className="block text-sm font-medium text-gray-700 mb-2">
                Lab Name
              </label>
              <input
                type="text"
                id="lab"
                value={profileData?.lab?.name || ''}
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100"
                disabled
              />
            </div>

            <div>
              <label htmlFor="labId" className="block text-sm font-medium text-gray-700 mb-2">
                Lab ID
              </label>
              <input
                type="text"
                id="labId"
                value={profileData?.lab?.id || user?.lab || ''}
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100"
                disabled
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800">Change Password</h2>
        </div>

        <form onSubmit={handlePasswordSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                required
              />
            </div>

            <div className="md:col-span-2">
              <div className="h-0 md:h-6"></div>
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                required
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                required
                minLength={6}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
              disabled={loading}
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
