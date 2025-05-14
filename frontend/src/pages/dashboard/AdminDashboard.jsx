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
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import { formatDate, truncateText } from '../../utils/helpers'; // Added truncateText
import { DATE_FORMATS } from '../../utils/constants';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalReports: 0,
    totalPatients: 0,
    revenueThisMonth: 0,
    inventoryItems: 0,
  });
  const [recentReports, setRecentReports] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [labDetails, setLabDetails] = useState(null);
  
  const { user } = useAuth();

  // Fetch data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Import API utilities
        const apiModules = await import('../../utils/api');
        const { dashboard, superAdmin, reports, patients } = apiModules;
        
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
                    totalReports: statsData.totalReports || 0,
                    revenueThisMonth: statsData.revenueThisMonth || 0,
                    inventoryItems: statsData.inventoryItems || 0,
                  });
                } catch (statsErr) {
                  console.error('Error fetching lab statistics:', statsErr);
                }
                
                // Fetch patients for this lab
                try {
                  console.log('Fetching patients for lab:', user.lab);
                  if (!user.lab) {
                    console.error('Lab ID is missing or undefined');
                  }
                  const patientsData = await patients.getAll(user.lab);
                  console.log('Patients data:', patientsData);
                  
                  // Update totalPatients count based on patientsData length
                  if (patientsData && Array.isArray(patientsData)) {
                    setStats(prevStats => ({
                      ...prevStats,
                      totalPatients: patientsData.length,
                    }));
                    setRecentPatients(patientsData.slice(0, 5).map(patient => ({
                      id: patient._id || patient.id,
                      name: patient.fullName,
                      age: patient.age,
                      gender: patient.gender,
                      contact: patient.phone,
                    })));
                  } else {
                    console.error('Patients data is not an array or is empty');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Header with view switcher */}
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
          <div className="px-8 py-6 bg-gradient-to-r from-blue-700 to-blue-500">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-extrabold text-white">Admin Dashboard</h1>
                <p className="text-base text-blue-100 mt-1">
                  Welcome, {user?.name || 'Admin'}! | Role: {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Admin'}
                </p>
              </div>
              
            </div>
          </div>
      
          {/* Lab Name */}
          {labDetails?.name && (
            <div className="py-4 text-center bg-blue-50 border-b border-blue-100">
              <h2 className="text-xl font-bold text-blue-800">{labDetails.name}</h2>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Reports Card */}
        <div className="overflow-hidden rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="p-5 border-b-4 border-blue-500">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 p-3 rounded-full">
                <DocumentTextIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">Total Reports</dt>
                  <dd>
                    <div className="text-2xl font-bold text-gray-900">{stats.totalReports}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/reports" className="font-medium text-blue-700 hover:text-blue-900 transition duration-200">
                View all reports
              </Link>
            </div>
          </div>
        </div>

        {/* Patients Card */}
        <div className="overflow-hidden rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="p-5 border-b-4 border-green-500">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 p-3 rounded-full">
                <UserIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">Total Patients</dt>
                  <dd>
                    <div className="text-2xl font-bold text-gray-900">{stats.totalPatients}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/patients" className="font-medium text-blue-700 hover:text-blue-900 transition duration-200">
                View all patients
              </Link>
            </div>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="overflow-hidden rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="p-5 border-b-4 border-yellow-500">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 p-3 rounded-full">
                <CurrencyDollarIcon className="h-6 w-6 text-yellow-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">Monthly Revenue</dt>
                  <dd>
                    <div className="text-2xl font-bold text-gray-900">₹{stats.revenueThisMonth}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/finance/revenue" className="font-medium text-blue-700 hover:text-blue-900 transition duration-200">
                View financial reports
              </Link>
            </div>
          </div>
        </div>
      </div>

        {/* Quick Actions */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl border border-blue-100">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">Quick Actions</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            <Link
              to="/patients/add"
              className="flex items-center justify-center px-4 py-3 bg-white rounded-lg shadow-sm border border-blue-200 text-blue-700 font-medium hover:bg-blue-50 transition-all duration-200"
            >
              <UserIcon className="h-5 w-5 mr-2" aria-hidden="true" />
              Add Patient
            </Link>
            <Link
              to="/reports/create"
              className="flex items-center justify-center px-4 py-3 bg-white rounded-lg shadow-sm border border-blue-200 text-blue-700 font-medium hover:bg-blue-50 transition-all duration-200"
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" aria-hidden="true" />
              Create Report
            </Link>
            <Link
              to="/doctors"
              className="flex items-center justify-center px-4 py-3 bg-white rounded-lg shadow-sm border border-blue-200 text-blue-700 font-medium hover:bg-blue-50 transition-all duration-200"
            >
              <UserIcon className="h-5 w-5 mr-2" aria-hidden="true" />
              Manage Doctors
            </Link>
            <Link
              to="/finance/revenue"
              className="flex items-center justify-center px-4 py-3 bg-white rounded-lg shadow-sm border border-blue-200 text-blue-700 font-medium hover:bg-blue-50 transition-all duration-200"
            >
              <ChartBarIcon className="h-5 w-5 mr-2" aria-hidden="true" />
              Financial Report
            </Link>
          </div>
        </div>
      </div>

        {/* Recent Reports */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl border border-blue-100">
          <div className="px-6 py-5 border-b border-blue-100 bg-blue-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-blue-800">Recent Reports</h3>
              <Link to="/reports/create" className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center bg-white px-3 py-1 rounded-lg shadow-sm border border-blue-200 transition-colors">
                <PlusIcon className="h-5 w-5 mr-1" />
                New Report
              </Link>
            </div>
          </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-50">
                <tr>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                    Patient
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                    Test
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-blue-100">
                {recentReports.length > 0 ? (
                  recentReports.map((report, index) => (
                    <tr key={report.id || index} className="hover:bg-blue-50 transition-colors duration-150">
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {report.patientName}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500" title={report.testName}>
                        {truncateText(report.testName, 40)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            report.status === 'completed' ? 'bg-green-100 text-green-800' : 
                            report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {report.status?.charAt(0).toUpperCase() + report.status?.slice(1)}
                        </span>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(report.date, DATE_FORMATS.DD_MM_YYYY)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-3">
                          <Link to={`/reports/${report.id}/print`} className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50 transition-colors" title="View Report">
                            <DocumentTextIcon className="h-5 w-5" aria-hidden="true" />
                          </Link>
                          <Link to={`/reports/${report.id}/edit`} className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-50 transition-colors" title="Edit Report">
                            <PencilSquareIcon className="h-5 w-5" aria-hidden="true" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-3 py-4 text-center text-sm text-gray-500">
                      No reports found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-6">
            <Link
              to="/reports"
              className="flex w-full items-center justify-center rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-50 transition-all duration-200"
            >
              View all reports
            </Link>
          </div>
        </div>
      </div>

        {/* Recent Patients */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl border border-blue-100 mt-6">
          <div className="px-6 py-5 border-b border-blue-100 bg-blue-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-blue-800">Recent Patients</h3>
              <Link to="/patients/add" className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center bg-white px-3 py-1 rounded-lg shadow-sm border border-blue-200 transition-colors">
                <PlusIcon className="h-5 w-5 mr-1" />
                Add Patient
              </Link>
            </div>
          </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-50">
                <tr>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                    Age/Gender
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-blue-100">
                {recentPatients.length > 0 ? (
                  recentPatients.map((patient) => (
                    <tr key={patient._id} className="hover:bg-blue-50 transition-colors duration-150">
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {patient.name}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {patient.age} / {patient.gender?.charAt(0).toUpperCase() + patient.gender?.slice(1)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{patient.contact}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-3">
                          <Link to={`/patients/${patient._id}/edit`} className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-50 transition-colors" title="Edit Patient">
                            <PencilSquareIcon className="h-5 w-5" aria-hidden="true" />
                          </Link>
                          <Link to={`/reports/create?patientId=${patient._id}`} className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50 transition-colors" title="Create Report">
                            <DocumentTextIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-3 py-4 text-center text-sm text-gray-500">
                      No patients found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-6">
            <Link
              to="/patients"
              className="flex w-full items-center justify-center rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-50 transition-all duration-200"
            >
              View all patients
            </Link>
          </div>
        </div>
      </div>

        {/* No Financial Overview or Inventory Status sections as requested */}
      </div>
    </div>
  );
};

export default AdminDashboard;
