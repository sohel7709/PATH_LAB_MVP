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
  CreditCardIcon,
  MagnifyingGlassIcon, // Icon for search
} from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/helpers';
import { DATE_FORMATS } from '../../utils/constants';

const LabList = () => {
  const [labs, setLabs] = useState([]);
  const [filteredLabs, setFilteredLabs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
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
        setFilteredLabs(response.data || []);
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

  // Filter labs based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredLabs(labs);
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    const filtered = labs.filter(lab => 
      (lab.name && lab.name.toLowerCase().includes(term)) ||
      (lab.address?.city && lab.address.city.toLowerCase().includes(term)) ||
      (lab.address?.state && lab.address.state.toLowerCase().includes(term)) ||
      (lab.subscription?.plan?.name && lab.subscription.plan.name.toLowerCase().includes(term))
    );
    
    setFilteredLabs(filtered);
  }, [searchTerm, labs]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl mx-auto bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
        <div className="px-8 py-6 bg-gradient-to-r from-blue-700 to-blue-500">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold text-white">Lab Management</h1>
              <p className="text-base text-blue-100 mt-1">
                Manage all labs in the system
              </p>
            </div>
            <div className="flex space-x-3">
              <Link
                to="/labs/create"
                className="inline-flex items-center justify-center rounded-lg border border-transparent bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
              >
                <PlusCircleIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Add New Lab
              </Link>
              <button
                onClick={fetchLabs}
                className="inline-flex items-center justify-center rounded-lg border border-transparent bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
              >
                <ArrowPathIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Refresh
              </button>
            </div>
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
              placeholder="Search labs by name, city, state or plan..."
              className="block w-full pl-10 pr-3 py-2 border border-transparent rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-white focus:border-white"
            />
          </div>
        </div>
        
        <div className="p-6">

          {error && (
            <div className="mb-6 rounded-lg bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
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
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredLabs.length === 0 ? (
              <div className="p-12 text-center">
                <BuildingOfficeIcon className="mx-auto h-16 w-16 text-blue-200 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No labs found</h3>
                <p className="text-gray-500 mb-6">Get started by creating a new lab</p>
                <Link
                  to="/labs/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                >
                  <PlusCircleIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Add New Lab
                </Link>
              </div>
        ) : (
              <table className="min-w-full divide-y divide-blue-200">
                <thead className="bg-blue-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                      Lab Name
                    </th>
                     <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                      Plan
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                      Lab Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                      Created
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                      Users
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-blue-100">
              {filteredLabs.map((lab) => (
                <tr key={lab._id} className="hover:bg-blue-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{lab.name}</div>
                        <div className="text-sm text-gray-500">{lab.address?.city || 'No address'}</div>
                      </div>
                    </div>
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {/* Assuming backend populates plan name */}
                      {lab.subscription?.plan?.name || <span className="text-gray-400 italic">No Plan</span>}
                    </div>
                     {lab.subscription?.endDate && (
                       <div className="text-xs text-gray-500">
                         Expires: {formatDate(lab.subscription.endDate, DATE_FORMATS.DD_MM_YYYY)}
                       </div>
                     )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {/* Use the main lab.status field */}
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      lab.status === 'active' ? 'bg-green-100 text-green-800' :
                      lab.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                      lab.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      lab.status === 'suspended' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800' // Default fallback
                    }`}>
                      {/* Capitalize status */}
                      {lab.status ? lab.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(lab.createdAt, DATE_FORMATS.DD_MM_YYYY)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lab.users ? lab.users.length : 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-3 justify-end">
                      <Link
                        to={`/labs/${lab._id}`}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50 transition-colors"
                        title="View Lab Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </Link>
                       <Link
                        to={`/labs/${lab._id}/edit`} // Link to edit page where subscription can be managed
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-50 transition-colors"
                        title="Manage Subscription & Edit Lab"
                      >
                        <CreditCardIcon className="h-5 w-5" />
                      </Link>
                      <Link
                        to={`/labs/${lab._id}/edit`} // Keep original edit link as well, or combine logic
                        className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-50 transition-colors"
                        title="Edit Lab Details"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => handleDeleteLab(lab._id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50 transition-colors"
                        title="Delete Lab"
                        disabled={lab.isDeleting}
                      >
                        {lab.isDeleting ? (
                          <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-red-600"></div>
                        ) : (
                          <TrashIcon className="h-5 w-5" />
                        )}
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
      </div>
    </div>
  );
};

export default LabList;
