import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  UserGroupIcon,
  DocumentTextIcon,
  UserIcon,
  CurrencyDollarIcon,
  BeakerIcon,
  ClipboardDocumentCheckIcon,
  ArrowPathIcon,
  ChartBarIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalTechnicians: 0,
    totalReports: 0,
    totalPatients: 0,
    revenueThisMonth: 0,
    inventoryItems: 0,
  });
  const [recentReports, setRecentReports] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [selectedView, setSelectedView] = useState('admin');
  const [labDetails, setLabDetails] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [apiUtils, setApiUtils] = useState(null);
  
  const { user } = useAuth();

  // Fetch data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Import API utilities
        const apiModules = await import('../../utils/api');
        const { dashboard, superAdmin, reports, patients } = apiModules;
        
        // Store API utilities for use outside this effect
        setApiUtils(apiModules);
        
        try {
          // Fetch lab details if user has a lab ID
          if (user?.lab) {
            try {
              const labResponse = await superAdmin.getLab(user.lab);
              if (labResponse.success) {
                setLabDetails(labResponse.data);
                
                // Fetch lab statistics
                try {
                  const statsData = await dashboard.getStats(user.lab);
                  console.log('Stats data:', statsData);
                  // Make sure we're getting the actual patient count
                  const patientCount = statsData.totalPatients !== undefined ? statsData.totalPatients : 0;
                  console.log('Patient count:', patientCount);
                  
                  setStats({
                    totalTechnicians: statsData.totalTechnicians || 0,
                    totalReports: statsData.totalReports || 0,
                    totalPatients: patientCount,
                    revenueThisMonth: statsData.revenueThisMonth || 0,
                    inventoryItems: statsData.inventoryItems || 0,
                  });
                } catch (statsErr) {
                  console.error('Error fetching lab statistics:', statsErr);
                }
                
                // Fetch patients for this lab
                try {
                  const patientsData = await patients.getAll(user.lab);
                  console.log('Patients data:', patientsData);
                  
                  // Set recent patients data
                  if (patientsData && Array.isArray(patientsData)) {
                    setRecentPatients(patientsData.slice(0, 5).map(patient => ({
                      id: patient._id || patient.id,
                      name: patient.fullName,
                      age: patient.age,
                      gender: patient.gender,
                      contact: patient.phone,
                    })));
                  }
                } catch (patientsErr) {
                  console.error('Error fetching patients data:', patientsErr);
                }
                
                // Fetch lab reports
                try {
                  const reportsResponse = await reports.getAll({ lab: user.lab });
                  console.log('Reports response:', reportsResponse);
                  
                  // Handle different response formats
                  let reportsArray = [];
                  
                  if (reportsResponse && reportsResponse.data && Array.isArray(reportsResponse.data)) {
                    // New API format with { success, data, pagination }
                    reportsArray = reportsResponse.data;
                  } else if (Array.isArray(reportsResponse)) {
                    // Old API format with direct array
                    reportsArray = reportsResponse;
                  } else if (reportsResponse && reportsResponse.success && Array.isArray(reportsResponse.data)) {
                    // Another possible format
                    reportsArray = reportsResponse.data;
                  }
                  
                  setRecentReports(reportsArray.slice(0, 3).map(report => ({
                    id: report._id || report.id,
                    patientName: report.patientName || (report.patientInfo ? report.patientInfo.name : 'Unknown'),
                    testName: report.testName || (report.testInfo ? report.testInfo.name : 'Unknown'),
                    status: report.status || 'pending',
                    date: report.createdAt || report.reportMeta?.generatedAt || new Date().toISOString(),
                  })));
                } catch (reportsErr) {
                  console.error('Error fetching lab reports:', reportsErr);
                }
                
                // Fetch patients for this lab
                try {
                  const patientsData = await patients.getAll(user.lab);
                  console.log('Patients data:', patientsData);
                } catch (patientsErr) {
                  console.error('Error fetching patients data:', patientsErr);
                }
              } else {
                console.error('Failed to fetch lab details:', labResponse.message);
              }
            } catch (labErr) {
              console.error('Error fetching lab details:', labErr);
            }
          }
        } catch (error) {
          console.error('Error in lab details section:', error);
        }
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    
    fetchDashboardData();
  }, [user]);

  // Function to handle view switching
  const handleViewChange = (view) => {
    setSelectedView(view);
  };
  
  // Function to handle report deletion
  const handleDeleteClick = (report) => {
    setReportToDelete(report);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!reportToDelete || !apiUtils) return;
    
    try {
      const reportId = reportToDelete.id;
      await apiUtils.reports.delete(reportId);
      
      // Remove the deleted report from the state
      setRecentReports(prevReports => 
        prevReports.filter(report => report.id !== reportId)
      );
      
      setShowDeleteConfirm(false);
      setReportToDelete(null);
    } catch (err) {
      console.error('Error deleting report:', err);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setReportToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Header with view switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Full control over lab-specific operations</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <label htmlFor="view-switcher" className="sr-only">
            Switch View
          </label>
          <select
            id="view-switcher"
            value={selectedView}
            onChange={(e) => handleViewChange(e.target.value)}
            className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
          >
            <option value="admin">Admin View</option>
            <option value="technician">Technician View</option>
          </select>
        </div>
      </div>
      
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome, {user?.name || 'Admin'}!</h1>
        <p className="mt-2 text-lg opacity-90">Role: {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Admin'}</p>
      </div>
      
      {/* Lab Name */}
      <div className="mt-6 mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800">{labDetails?.name || ''}</h2>
      </div>

      {/* Stats Grid - Removed technician card as requested */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">Reports</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.totalReports}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/reports" className="font-medium text-blue-700 hover:text-blue-900">
                View all
              </Link>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">Patients</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.totalPatients}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/patients" className="font-medium text-blue-700 hover:text-blue-900">
                View all
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="overflow-hidden rounded-lg bg-gray-100 shadow-lg mb-6 border border-gray-300">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-4">
            <Link
              to="/patients/add"
              className="btn-primary flex items-center justify-center"
            >
              <UserIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Add Patient
            </Link>
            <Link
              to="/reports/create"
              className="btn-primary flex items-center justify-center"
            >
              <DocumentTextIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Create Report
            </Link>
            <Link
              to="/doctors"
              className="btn-primary flex items-center justify-center"
            >
              <UserIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Manage Doctors
            </Link>
            <Link
              to="/finance/reports"
              className="btn-primary flex items-center justify-center"
            >
              <ChartBarIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Financial Report
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-gray-900">Recent Reports</h3>
            <Link to="/reports/create" className="text-sm font-medium text-primary-600 hover:text-primary-900">
              <PlusIcon className="inline-block h-5 w-5 mr-1" />
              New Report
            </Link>
          </div>
          <div className="mt-6 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                        Patient
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Test
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Date
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentReports.map((report) => (
                      <tr key={report.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                          {report.patientName}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{report.testName}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              report.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : report.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {report.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{report.date}</td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                          <Link to={`/reports/${report.id}/print`} className="text-primary-600 hover:text-primary-900 mr-4">
                            View
                          </Link>
                          <Link to={`/reports/${report.id}/edit`} className="text-primary-600 hover:text-primary-900 mr-4">
                            Edit
                          </Link>
                          <button 
                            onClick={() => handleDeleteClick(report)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <Link
              to="/reports"
              className="flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              View all reports
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Patients */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-gray-900">Recent Patients</h3>
            <Link to="/patients/add" className="text-sm font-medium text-primary-600 hover:text-primary-900">
              <PlusIcon className="inline-block h-5 w-5 mr-1" />
              Add Patient
            </Link>
          </div>
          <div className="mt-6 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                        Name
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Age/Gender
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Contact
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentPatients.length > 0 ? (
                      recentPatients.map((patient) => (
                        <tr key={patient.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                            {patient.name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {patient.age} / {patient.gender?.charAt(0).toUpperCase() + patient.gender?.slice(1)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{patient.contact}</td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                            <Link to={`/patients/${patient.id}/edit`} className="text-primary-600 hover:text-primary-900 mr-4">
                              Edit
                            </Link>
                            <Link to={`/reports/create?patientId=${patient.id}`} className="text-primary-600 hover:text-primary-900">
                              Create Report
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-4 text-center text-sm text-gray-500">
                          No patients found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <Link
              to="/patients"
              className="flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              View all patients
            </Link>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Report</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete this report? This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={confirmDelete}
              >
                Delete
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                onClick={cancelDelete}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Financial Overview or Inventory Status sections as requested */}
    </div>
  );
};

export default AdminDashboard;
