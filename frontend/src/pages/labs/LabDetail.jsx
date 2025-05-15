import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { superAdmin } from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import { DATE_FORMATS } from '../../utils/constants';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  ArrowLeftIcon,
  PencilSquareIcon,
  TrashIcon,
  UsersIcon,
  DocumentTextIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

const LabDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lab, setLab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPatients: 0,
    totalReports: 0,
  });
  const [labUsers, setLabUsers] = useState([]);

useEffect(() => {
    const fetchLabDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching lab details for ID:', id);
        
        // Fetch lab details
        const response = await superAdmin.getLab(id);

        console.log('Lab details response:', response);
        
        if (response.success) {
          setLab(response.data);
          
          // Fetch lab statistics
          try {
            console.log('Fetching lab statistics for ID:', id);
            const statsResponse = await superAdmin.getLabStats(id);
            console.log('Lab statistics response:', statsResponse);
            
            if (statsResponse.success) {
              setStats(statsResponse.data);
            } else {
              console.warn('Failed to fetch lab statistics:', statsResponse.message);
            }
          } catch (statsErr) {
            console.error('Error fetching lab statistics:', statsErr);
          }
          
          // Fetch lab users
          try {
            console.log('Fetching users for lab ID:', id);
            // Assuming there's a method to get users by lab ID
            const usersResponse = await superAdmin.getUsers({ lab: id });
            console.log('Lab users response:', usersResponse);
            
            if (usersResponse.success) {
              setLabUsers(usersResponse.data || []);
            } else {
              console.warn('Failed to fetch lab users:', usersResponse.message);
            }
          } catch (usersErr) {
            console.error('Error fetching lab users:', usersErr);
          }
        } else {
          setError(response.message || 'Failed to fetch lab details');
        }
      } catch (err) {
        console.error('Error fetching lab details:', err);
        setError(err.message || 'An error occurred while fetching lab details');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchLabDetails();
    } else {
      setError('No lab ID provided');
      setLoading(false);
    }
  }, [id]);

  const handleDeleteLab = async () => {
    if (!window.confirm('Are you sure you want to delete this lab? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await superAdmin.deleteLab(id);
      
      if (response.success) {
        navigate('/labs');
      } else {
        alert(response.message || 'Failed to delete lab');
      }
    } catch (err) {
      console.error('Error deleting lab:', err);
      alert(err.message || 'An error occurred while deleting the lab');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
            <div className="mt-4">
              <Link
                to="/labs"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Back to Labs
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!lab) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">Lab not found</p>
            <div className="mt-4">
              <Link
                to="/labs"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Back to Labs
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-6 py-4 bg-primary-600 text-white flex justify-between items-center">
        <div className="flex items-center">
          <BuildingOfficeIcon className="h-8 w-8 mr-3" />
          <div>
            <h1 className="text-2xl font-bold">{lab.name}</h1>
            <p className="text-sm opacity-80">Lab Details</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link
            to="/labs"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-700 hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Back to Labs
          </Link>
          <Link
            to={`/labs/${id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PencilSquareIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Edit Lab
          </Link>
          <button
            onClick={handleDeleteLab}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <TrashIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Delete Lab
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Lab Overview */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Lab Overview</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Lab Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{lab.name}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Address</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {typeof lab.address === 'object' 
                    ? [
                        lab.address.street,
                        lab.address.city,
                        lab.address.state,
                        lab.address.zipCode,
                        lab.address.country
                      ].filter(Boolean).join(', ')
                    : lab.address || 'Not specified'}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Contact Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{lab.contact?.email || 'Not specified'}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Contact Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">{lab.contact?.phone || 'Not specified'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900">{lab.description || 'No description provided'}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Created On</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(lab.createdAt, DATE_FORMATS.DD_MM_YYYY)}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(lab.updatedAt, DATE_FORMATS.DD_MM_YYYY)}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Subscription Information */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Subscription Information</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Subscription Plan</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {lab.subscription?.plan 
                    ? lab.subscription.plan.charAt(0).toUpperCase() + lab.subscription.plan.slice(1) 
                    : 'No Plan'}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    lab.subscription?.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : lab.subscription?.status === 'pending' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {lab.subscription?.status 
                      ? lab.subscription.status.charAt(0).toUpperCase() + lab.subscription.status.slice(1) 
                      : 'Inactive'}
                  </span>
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Renewal Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {lab.subscription?.renewalDate 
                    ? formatDate(lab.subscription.renewalDate, DATE_FORMATS.DD_MM_YYYY) 
                    : 'Not applicable'}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Lab Statistics */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Lab Statistics</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                    <UsersIcon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">{stats.totalUsers || 0}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link to={`/users?lab=${id}`} className="font-medium text-indigo-600 hover:text-indigo-900">
                    View all users
                  </Link>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                    <UserGroupIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Patients</dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">{stats.totalPatients || 0}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link to={`/patients?lab=${id}`} className="font-medium text-green-600 hover:text-green-900">
                    View all patients
                  </Link>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                    <DocumentTextIcon className="h-6 w-6 text-purple-600" aria-hidden="true" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Reports</dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">{stats.totalReports || 0}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link to={`/reports?lab=${id}`} className="font-medium text-purple-600 hover:text-purple-900">
                    View all reports
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lab Users */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Lab Users</h2>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {labUsers.length > 0 ? (
                labUsers.map((user) => (
                  <li key={user._id || user.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 bg-indigo-100 rounded-full p-2">
                            {user.role === 'admin' ? (
                              <UserIcon className="h-6 w-6 text-indigo-600" />
                            ) : (
                              <UsersIcon className="h-6 w-6 text-indigo-600" />
                            )}
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-indigo-600">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                          <div className="ml-2 flex-shrink-0 flex space-x-2">
                            <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </p>
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete user ${user.name}?`)) {
                                  try {
                                    superAdmin.deleteUser(user._id || user.id);
                                    // Refresh the page after deletion
                                    window.location.reload();
                                  } catch (error) {
                                    console.error('Error deleting user:', error);
                                    alert('Failed to delete user. Please try again.');
                                  }
                                }
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              <TrashIcon className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            <span>ID: {user._id || user.id}</span>
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <p>
                            Created: {formatDate(user.createdAt, DATE_FORMATS.DD_MM_YYYY)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="px-4 py-5 sm:px-6">
                  <div className="text-center text-sm text-gray-500">
                    No users found for this lab
                  </div>
                </li>
              )}
            </ul>
            <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
              <Link
                to={`/users/create?lab=${id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add User to Lab
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              to={`/users/create?lab=${id}`}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <UserGroupIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Add User to Lab
            </Link>
            <Link
              to={`/patients/add?lab=${id}`}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <UserGroupIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Add Patient to Lab
            </Link>
            <Link
              to={`/reports/create?lab=${id}`}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <ClipboardDocumentCheckIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Create Report
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabDetail;
