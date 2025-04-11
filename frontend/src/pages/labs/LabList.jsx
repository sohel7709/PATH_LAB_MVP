import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { superAdmin } from '../../utils/api';
import {
  BuildingOfficeIcon,
  PencilSquareIcon,
  TrashIcon,
  PlusCircleIcon,
  ArrowPathIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

const LabList = () => {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLabs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await superAdmin.getLabs();
      console.log('Fetched lab data:', response);
      
      if (response.success) {
        setLabs(response.data || []);
      } else {
        setError(response.message || 'Failed to fetch labs');
      }
    } catch (err) {
      console.error('Error fetching labs:', err);
      setError(err.message || 'An error occurred while fetching labs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabs();
  }, []);

  const handleDeleteLab = async (labId) => {
    if (!window.confirm('Are you sure you want to delete this lab? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('Attempting to delete lab with ID:', labId);
      
      // Show loading state for the specific lab
      setLabs(prevLabs => 
        prevLabs.map(lab => 
          lab._id === labId ? { ...lab, isDeleting: true } : lab
        )
      );
      
      const response = await superAdmin.deleteLab(labId);
      console.log('Delete lab response:', response);
      
      if (response.success) {
        console.log('Lab deleted successfully');
        // Remove the deleted lab from the state
        setLabs(prevLabs => prevLabs.filter(lab => lab._id !== labId));
        // Show success message
        alert('Lab deleted successfully');
      } else {
        console.error('Failed to delete lab:', response.message);
        // Reset the deleting state
        setLabs(prevLabs => 
          prevLabs.map(lab => 
            lab._id === labId ? { ...lab, isDeleting: false } : lab
          )
        );
        alert(response.message || 'Failed to delete lab');
      }
    } catch (err) {
      console.error('Error deleting lab:', err);
      // Reset the deleting state
      setLabs(prevLabs => 
        prevLabs.map(lab => 
          lab._id === labId ? { ...lab, isDeleting: false } : lab
        )
      );
      alert(err.message || 'An error occurred while deleting the lab');
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-6 py-4 bg-blue-600 text-white flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Lab Management</h1>
          <p className="text-sm opacity-80">Manage all labs in the system</p>
        </div>
        <div className="flex space-x-2">
          <Link
            to="/labs/create"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusCircleIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add New Lab
          </Link>
          <button
            onClick={fetchLabs}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowPathIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Refresh
          </button>
        </div>
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

      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : labs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <BuildingOfficeIcon className="h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No labs found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new lab.</p>
            <div className="mt-6">
              <Link
                to="/labs/create"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <PlusCircleIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Add New Lab
              </Link>
            </div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lab Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscription
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Users
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {labs.map((lab) => (
                <tr key={lab._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <BuildingOfficeIcon className="h-6 w-6 text-primary-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{lab.name}</div>
                        <div className="text-sm text-gray-500">{lab.address?.city || 'No address'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {lab.subscription?.plan ? (
                        lab.subscription.plan.charAt(0).toUpperCase() + lab.subscription.plan.slice(1)
                      ) : 'No Plan'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      lab.subscription?.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : lab.subscription?.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {lab.subscription?.status ? (
                        lab.subscription.status.charAt(0).toUpperCase() + lab.subscription.status.slice(1)
                      ) : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(lab.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lab.users ? lab.users.length : 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2">
                        <Link
                          to={`/labs/${lab._id}`}
                          className="text-primary-600 hover:text-primary-900"
                          title="View Lab Details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                      <Link
                        to={`/labs/${lab._id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit Lab"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => handleDeleteLab(lab._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Lab"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default LabList;
