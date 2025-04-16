import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PencilIcon, 
  TrashIcon, 
  UserPlusIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { doctors } from '../../utils/api';

const DoctorList = () => {
  const [doctorList, setDoctorList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState(null);

  // Fetch doctors when component mounts
  useEffect(() => {
    fetchDoctors();
  }, []);

  // Fetch doctors from API
  const fetchDoctors = async () => {
    try {
      setIsLoading(true);
      const response = await doctors.getAll();
      
      if (response && response.data) {
        setDoctorList(response.data);
      } else {
        setDoctorList([]);
      }
      setError('');
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError('Failed to load doctors. Please try again.');
      setDoctorList([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle doctor deletion
  const handleDeleteClick = (doctor) => {
    setDoctorToDelete(doctor);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!doctorToDelete) return;
    
    try {
      await doctors.delete(doctorToDelete._id);
      
      // Remove the deleted doctor from the state
      setDoctorList(prevDoctors => 
        prevDoctors.filter(doctor => doctor._id !== doctorToDelete._id)
      );
      
      setShowDeleteConfirm(false);
      setDoctorToDelete(null);
    } catch (err) {
      console.error('Error deleting doctor:', err);
      setError('Failed to delete doctor. Please try again.');
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDoctorToDelete(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl mx-auto bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
        <div className="px-8 py-6 bg-gradient-to-r from-blue-700 to-blue-500">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <UserIcon className="h-8 w-8 text-white mr-3" />
              <div>
                <h1 className="text-3xl font-extrabold text-white">Reference Doctors</h1>
                <p className="text-base text-blue-100 mt-1">
                  Manage reference doctors for your lab
                </p>
              </div>
            </div>
            <Link
              to="/doctors/add"
              className="inline-flex items-center justify-center rounded-lg border border-transparent bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
            >
              <UserPlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Add Doctor
            </Link>
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

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="bg-white rounded-lg overflow-hidden">
              {doctorList.length === 0 ? (
                <div className="text-center py-12">
                  <UserIcon className="mx-auto h-16 w-16 text-blue-200" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No doctors found</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by adding a new reference doctor.</p>
                  <div className="mt-6">
                    <Link
                      to="/doctors/add"
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                    >
                      <UserPlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                      Add Doctor
                    </Link>
                  </div>
                </div>
              ) : (
                <ul className="divide-y divide-blue-100">
                  {doctorList.map((doctor) => (
                    <li key={doctor._id} className="hover:bg-blue-50 transition-colors duration-150">
                      <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-lg font-medium text-gray-900">{doctor.name}</div>
                              <div className="text-sm text-gray-500">{doctor.specialty}</div>
                              <div className="text-sm text-gray-500">{doctor.email}</div>
                            </div>
                          </div>
                          <div className="flex space-x-3">
                            <Link
                              to={`/doctors/edit/${doctor._id}`}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-100 transition-colors"
                              title="Edit Doctor"
                            >
                              <PencilIcon className="h-5 w-5" aria-hidden="true" />
                            </Link>
                            <button
                              onClick={() => handleDeleteClick(doctor)}
                              className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50 transition-colors"
                              title="Delete Doctor"
                            >
                              <TrashIcon className="h-5 w-5" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Doctor</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete {doctorToDelete?.name}? This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={confirmDelete}
              >
                Delete
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                onClick={cancelDelete}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorList;
