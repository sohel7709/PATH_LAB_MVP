import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { users, superAdmin } from '../../utils/api';
import { PencilIcon, TrashIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const UserList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [usersList, setUsersList] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Use the appropriate API function based on user role
        let data;
        if (user?.role === 'super-admin') {
          const response = await superAdmin.getUsers();
          data = response.data || [];
        } else {
          const response = await users.getAll();
          data = response.data || [];
        }
        
        setUsersList(data);
        setFilteredUsers(data);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError(err.message || 'Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user?.role]);

  // Filter users based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(usersList);
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    const filtered = usersList.filter(userData => 
      (userData.name && userData.name.toLowerCase().includes(term)) ||
      (userData.email && userData.email.toLowerCase().includes(term)) ||
      (userData.role && userData.role.toLowerCase().includes(term)) ||
      (userData.lab?.name && userData.lab.name.toLowerCase().includes(term))
    );
    
    setFilteredUsers(filtered);
  }, [searchTerm, usersList]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        // Use the appropriate API function based on user role
        if (user?.role === 'super-admin') {
          await superAdmin.deleteUser(id);
        } else {
          await users.delete(id);
        }
        
        // Refresh the user list after deletion
        try {
          setLoading(true);
          let data;
          if (user?.role === 'super-admin') {
            const response = await superAdmin.getUsers();
            data = response.data || [];
          } else {
            const response = await users.getAll();
            data = response.data || [];
          }
          setUsersList(data);
        } catch (fetchErr) {
          console.error('Error refreshing user list:', fetchErr);
        } finally {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error deleting user:', err);
        setError(err.message || 'Failed to delete user');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl mx-auto bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
        <div className="px-8 py-6 bg-gradient-to-r from-blue-700 to-blue-500">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold text-white">User Management</h1>
              <p className="text-base text-blue-100 mt-1">
                Manage all users in the system
              </p>
            </div>
            <Link
              to="/users/create"
              className="inline-flex items-center justify-center rounded-lg border border-transparent bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Add User
            </Link>
          </div>

          {/* Search Bar */}
          <div className="mt-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-blue-300" aria-hidden="true" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search users by name, email, role or lab..."
              className="block w-full pl-10 pr-3 py-2 border border-transparent rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-white focus:border-white"
            />
          </div>
        </div>
        
        <div className="p-6">
      
          {error && (
            <div className="mb-6 rounded-lg bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-blue-200">
                  <thead className="bg-blue-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider sm:pl-6">Name</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Email</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Role</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Lab</th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-blue-100">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((userData) => (
                        <tr key={userData._id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{userData.name}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{userData.email}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {userData.lab && userData.lab.name ? userData.lab.name : 
                             userData.role === 'super-admin' ? 'N/A' : 'No Lab Assigned'}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex space-x-3 justify-end">
                              <button
                                onClick={() => navigate(`/users/${userData._id}`)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50 transition-colors"
                                title="Edit User"
                              >
                                <PencilIcon className="h-5 w-5" aria-hidden="true" />
                                <span className="sr-only">Edit</span>
                              </button>
                              <button
                                onClick={() => handleDelete(userData._id)}
                                className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50 transition-colors"
                                title="Delete User"
                              >
                                <TrashIcon className="h-5 w-5" aria-hidden="true" />
                                <span className="sr-only">Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-sm text-gray-500">
                          <div className="flex flex-col items-center justify-center">
                            <svg className="h-12 w-12 text-blue-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <p className="text-base">No users found</p>
                            <p className="text-sm text-gray-400 mt-1">Add a new user to get started</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserList;
