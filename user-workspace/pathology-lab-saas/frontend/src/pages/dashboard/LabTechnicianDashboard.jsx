import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  UserIcon,
  DocumentTextIcon,
  BeakerIcon,
  ClipboardDocumentCheckIcon,
  EnvelopeIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  PencilSquareIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

const LabTechnicianDashboard = () => {
  const [stats, setStats] = useState({
    pendingReports: 0,
    completedReports: 0,
    samplesCollected: 0,
    assignedTasks: 0,
  });
  const [recentPatients, setRecentPatients] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [labDetails, setLabDetails] = useState(null);
  // const [searchTerm, setSearchTerm] = useState('');

  const { user } = useAuth();
  
  // Fetch data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Import API utilities
        const { dashboard, patients, reports, superAdmin } = await import('../../utils/api');
        
        try {
          // Fetch dashboard stats for the current lab
          const statsData = await dashboard.getStats(user?.lab);
          setStats({
            pendingReports: statsData.pendingReports || 0,
            completedReports: statsData.completedReports || 0,
            samplesCollected: statsData.samplesCollected || 0,
            assignedTasks: statsData.assignedTasks || 0,
          });
        } catch (error) {
          console.error('Error fetching dashboard stats:', error);
        }
        
        try {
          // Fetch lab details if user has a lab ID
          if (user?.lab) {
            try {
              const labResponse = await superAdmin.getLab(user.lab);
              if (labResponse.success) {
                setLabDetails(labResponse.data);
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
        
        try {
          // Fetch recent patients for the current lab
          const patientsData = await patients.getAll(user?.lab);
          
          // Check if patientsData is an array before using slice
          if (Array.isArray(patientsData)) {
            setRecentPatients(patientsData.slice(0, 5).map(patient => ({
              id: patient.id || patient._id,
              name: patient.fullName,
              age: patient.age,
              gender: patient.gender,
              contact: patient.phone,
              testType: patient.lastTestType || 'N/A',
            })));
          } else {
            console.error('Patients data is not an array:', patientsData);
            setRecentPatients([]);
          }
        } catch (error) {
          console.error('Error fetching patients data:', error);
        }
        
        try {
          // Fetch recent reports for the current lab
          const response = await reports.getAll({ lab: user?.lab });
          console.log('Reports response:', response);
          
          // Handle different response formats
          let reportsArray = [];
          
          if (response && response.data && Array.isArray(response.data)) {
            // New API format with { success, data, pagination }
            reportsArray = response.data;
          } else if (Array.isArray(response)) {
            // Old API format with direct array
            reportsArray = response;
          } else if (response && response.success && Array.isArray(response.data)) {
            // Another possible format
            reportsArray = response.data;
          }
          
          if (reportsArray.length > 0) {
            setRecentReports(reportsArray.slice(0, 5).map(report => ({
              id: report.id || report._id,
              patientName: report.patientName || (report.patientInfo ? report.patientInfo.name : 'Unknown'),
              testName: report.testName || (report.testInfo ? report.testInfo.name : 'Unknown'),
              status: report.status || 'pending',
              date: report.createdAt || report.reportMeta?.generatedAt || new Date(),
            })));
          } else {
            console.log('No reports found or empty array');
            setRecentReports([]);
          }
        } catch (error) {
          console.error('Error fetching reports data:', error);
        }
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);

  // const handleSearchChange = (e) => {
  //   setSearchTerm(e.target.value);
  // };

  // const filteredPatients = recentPatients.filter(patient =>
  //   patient.name.toLowerCase().includes(searchTerm.toLowerCase())
  // );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
      <div className="space-y-8 p-4">

      {/* Header with Welcome Message */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold">Welcome, {user?.name || 'Lab Technician'}</h1>
        <p className="mt-2 text-lg opacity-90">Manage patients, reports, and test samples efficiently</p>
        
        {/* User and Lab Information */}
        <div className="mt-4 p-4 bg-white bg-opacity-10 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold">Your Profile</h3>
              <p className="text-sm opacity-90">ID: {user?.id || 'N/A'}</p>
              <p className="text-sm opacity-90">Role: {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Lab Information</h3>
              <p className="text-sm opacity-90">Lab ID: {user?.lab || 'N/A'}</p>
              <p className="text-sm opacity-90">Lab Name: {labDetails?.name || 'Loading...'}</p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex flex-wrap gap-4">
          <Link
            to="/patients/add"
            className="inline-flex items-center justify-center rounded-md bg-white px-6 py-3 text-base font-medium text-blue-700 shadow-md hover:bg-gray-100 transition-all duration-200"
          >
            <UserIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add New Patient
          </Link>
          <Link
            to="/reports/create"
            className="inline-flex items-center justify-center rounded-md bg-white px-6 py-3 text-base font-medium text-blue-700 shadow-md hover:bg-gray-100 transition-all duration-200"
          >
            <DocumentTextIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Create New Report
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 p-4">

        {/* Pending Reports */}
        <div className="overflow-hidden rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="p-5 border-b-4 border-yellow-500">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 p-3 rounded-full">
                <DocumentTextIcon className="h-6 w-6 text-yellow-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">Pending Reports</dt>
                  <dd>
                    <div className="text-2xl font-bold text-gray-900">{stats.pendingReports}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
          <Link to="/reports?status=pending" className="font-medium text-blue-700 hover:text-blue-900 transition duration-200">

                View all pending reports
              </Link>
            </div>
          </div>
        </div>

        {/* Completed Reports */}
        <div className="overflow-hidden rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="p-5 border-b-4 border-green-500">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 p-3 rounded-full">
                <ClipboardDocumentCheckIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">Completed Reports</dt>
                  <dd>
                    <div className="text-2xl font-bold text-gray-900">{stats.completedReports}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
          <Link to="/reports?status=completed" className="font-medium text-blue-700 hover:text-blue-900 transition duration-200">

                View all completed reports
              </Link>
            </div>
          </div>
        </div>

        {/* Samples Collected */}
        <div className="overflow-hidden rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="p-5 border-b-4 border-blue-500">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 p-3 rounded-full">
                <BeakerIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">Samples Collected</dt>
                  <dd>
                    <div className="text-2xl font-bold text-gray-900">{stats.samplesCollected}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/samples" className="font-medium text-blue-700 hover:text-blue-900">
                Manage all samples
              </Link>
            </div>
          </div>
        </div>

        {/* Assigned Tasks */}
        <div className="overflow-hidden rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="p-5 border-b-4 border-purple-500">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 p-3 rounded-full">
                <ClipboardDocumentCheckIcon className="h-6 w-6 text-purple-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">Assigned Tasks</dt>
                  <dd>
                    <div className="text-2xl font-bold text-gray-900">{stats.assignedTasks}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/tasks" className="font-medium text-blue-700 hover:text-blue-900">
                View all tasks
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Patients */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Recent Patients</h3>
            <Link to="/patients" className="text-sm font-medium text-blue-600 hover:text-blue-800">
              View all
            </Link>
          </div>
        </div>
        <div className="px-6 py-5">
          {recentPatients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age/Gender</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{patient.name}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {patient.age} / {patient.gender?.charAt(0).toUpperCase() + patient.gender?.slice(1)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{patient.contact}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <Link to={`/reports/create?patientId=${patient.id}`} className="text-blue-600 hover:text-blue-900">
                            <PencilSquareIcon className="h-5 w-5" aria-hidden="true" />
                          </Link>
                          <Link to={`/patients/${patient.id}`} className="text-gray-600 hover:text-gray-900">
                            <UserIcon className="h-5 w-5" aria-hidden="true" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent patients found</p>
          )}
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Recent Reports</h3>
            <Link to="/reports" className="text-sm font-medium text-blue-600 hover:text-blue-800">
              View all
            </Link>
          </div>
        </div>
        <div className="px-6 py-5">
          {recentReports.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentReports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{report.patientName}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{report.testName}</td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          report.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {report.status?.charAt(0).toUpperCase() + report.status?.slice(1)}
                        </span>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(report.date).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <Link to={`/reports/${report.id}`} className="text-blue-600 hover:text-blue-900" title="View Report">
                            <DocumentTextIcon className="h-5 w-5" aria-hidden="true" />
                          </Link>
                          <Link to={`/reports/${report.id}/edit`} className="text-green-600 hover:text-green-900" title="Edit Report">
                            <PencilSquareIcon className="h-5 w-5" aria-hidden="true" />
                          </Link>
                          <Link to={`/reports/${report.id}/print`} className="text-gray-600 hover:text-gray-900" title="Print Report">
                            <PrinterIcon className="h-5 w-5" aria-hidden="true" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent reports found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LabTechnicianDashboard;
