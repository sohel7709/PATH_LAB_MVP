import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  UserIcon,
  DocumentTextIcon,
  BeakerIcon,
  ClipboardDocumentCheckIcon,
  PencilSquareIcon,
  PrinterIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
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
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [reportSearchTerm, setReportSearchTerm] = useState('');
  const [animateElements, setAnimateElements] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAuth();
  
  // Set animation state when component mounts
  useEffect(() => {
    // Trigger animations after component mounts
    setAnimateElements(true);
  }, []);

  // Fetch data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setAnimateElements(false);
        
        // Import API utilities
        const { dashboard, patients, reports } = await import('../../utils/api');
        
        try {
          // Fetch dashboard stats for the current lab
          const statsData = await dashboard.getStats(user?.lab);
          setStats({
            pendingReports: statsData.pendingReports || 0,
            completedReports: statsData.completedReports || 0,
            samplesCollected: statsData.samplesCollected || 0,
            assignedTasks: statsData.assignedTasks || 0,
          });
          
          // Get lab name from dashboard stats instead of using superAdmin.getLab
          // which is not accessible to technicians
          if (user?.lab) {
            // The lab name might be included in the dashboard stats
            // or we can use a placeholder until we find a better solution
            setLabDetails({ name: statsData?.labName || 'Your Lab' });
          }
        } catch (error) {
          console.error('Error fetching dashboard stats:', error);
        }
        
        try {
          // Fetch recent patients for the current lab
          const patientsData = await patients.getAll(user?.lab);
          
          // Check if patientsData is an array before using slice
          if (Array.isArray(patientsData)) {
                setRecentPatients(patientsData.slice(0, 5).map(patient => ({
                  id: patient._id,
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
        setAnimateElements(true);
      }
    };
    
    fetchDashboardData();
  }, [user]);

  // Filter patients based on search term
  const filteredPatients = recentPatients.filter(patient =>
    patientSearchTerm === '' || 
    patient.name?.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
    patient.contact?.toLowerCase().includes(patientSearchTerm.toLowerCase())
  );

  // Filter reports based on search term
  const filteredReports = recentReports.filter(report =>
    reportSearchTerm === '' || 
    report.patientName?.toLowerCase().includes(reportSearchTerm.toLowerCase()) ||
    report.testName?.toLowerCase().includes(reportSearchTerm.toLowerCase())
  );

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Welcome Message */}
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
          <div className="px-8 py-6 bg-gradient-to-r from-blue-700 to-blue-500">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-extrabold text-white">Technician Dashboard</h1>
                <p className="text-base text-blue-100 mt-1">
                  Welcome, {user?.name || 'Lab Technician'}! | Role: {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Technician'}
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
          
          {/* Quick Actions */}
          <div className="p-6 bg-white flex flex-wrap gap-4 justify-center">
            <Link
              to="/patients/add"
              className="inline-flex items-center justify-center rounded-lg border border-blue-300 bg-white px-6 py-3 text-base font-medium text-blue-700 shadow-sm hover:bg-blue-50 transition-all duration-200"
            >
              <UserIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Add New Patient
            </Link>
            <Link
              to="/reports/create"
              className="inline-flex items-center justify-center rounded-lg border border-blue-300 bg-white px-6 py-3 text-base font-medium text-blue-700 shadow-sm hover:bg-blue-50 transition-all duration-200"
            >
              <DocumentTextIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Create New Report
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
        <div className={`bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden transition-all duration-500 ${animateElements ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="px-6 py-5 border-b border-blue-100 bg-blue-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-blue-800">Recent Patients</h3>
              <Link to="/patients" className="text-sm font-medium text-blue-600 hover:text-blue-800 bg-white px-3 py-1 rounded-lg shadow-sm border border-blue-200 transition-colors">
                View all
              </Link>
            </div>
            <div className="mt-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  name="patientSearch"
                  id="patientSearch"
                  value={patientSearchTerm}
                  onChange={(e) => setPatientSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-blue-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 sm:text-sm"
                  placeholder="Search patients..."
                />
              </div>
            </div>
          </div>
          <div className="px-6 py-5">
            {recentPatients.length > 0 ? (
              filteredPatients.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-blue-200">
                    <thead className="bg-blue-50">
                      <tr>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Age/Gender</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Contact</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-blue-100">
                      {filteredPatients.map((patient) => (
                        <tr key={patient.id} className="hover:bg-blue-50 transition-colors duration-150">
                          <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{patient.name}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {patient.age} / {patient.gender?.charAt(0).toUpperCase() + patient.gender?.slice(1)}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{patient.contact}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">
                            <div className="flex space-x-3">
                              <Link to={`/reports/create?patientId=${patient.id}`} className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50 transition-colors" title="Create Report">
                                <PencilSquareIcon className="h-5 w-5" aria-hidden="true" />
                              </Link>
                              <Link to={`/patients/${patient.id}`} className="text-gray-600 hover:text-gray-900 p-1 rounded-full hover:bg-gray-100 transition-colors" title="View Patient">
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
                <p className="text-gray-500 text-center py-4">No patients match your search</p>
              )
            ) : (
              <p className="text-gray-500 text-center py-4">No recent patients found</p>
            )}
          </div>
        </div>

        {/* Recent Reports */}
        <div className={`bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden transition-all duration-500 delay-100 ${animateElements ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="px-6 py-5 border-b border-blue-100 bg-blue-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-blue-800">Recent Reports</h3>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={handleRefresh}
                  className={`p-1 rounded-full hover:bg-white/50 transition-all duration-200 ${refreshing ? 'animate-spin' : ''}`}
                  title="Refresh"
                >
                  <ArrowPathIcon className="h-5 w-5 text-blue-600" />
                </button>
                <Link to="/reports" className="text-sm font-medium text-blue-600 hover:text-blue-800 bg-white px-3 py-1 rounded-lg shadow-sm border border-blue-200 transition-colors">
                  View all
                </Link>
              </div>
            </div>
            <div className="mt-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  name="reportSearch"
                  id="reportSearch"
                  value={reportSearchTerm}
                  onChange={(e) => setReportSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-blue-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 sm:text-sm"
                  placeholder="Search reports..."
                />
              </div>
            </div>
          </div>
          <div className="px-6 py-5">
            {recentReports.length > 0 ? (
              filteredReports.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-blue-200">
                    <thead className="bg-blue-50">
                      <tr>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Patient</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Test</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-blue-100">
                      {filteredReports.map((report) => (
                        <tr key={report.id} className="hover:bg-blue-50 transition-colors duration-150">
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
                            <div className="flex space-x-3">
                              <Link to={`/reports/${report.id}/print`} className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50 transition-colors" title="View Report">
                                <DocumentTextIcon className="h-5 w-5" aria-hidden="true" />
                              </Link>
                              <Link to={`/reports/${report.id}/edit`} className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-50 transition-colors" title="Edit Report">
                                <PencilSquareIcon className="h-5 w-5" aria-hidden="true" />
                              </Link>
                              <Link to={`/reports/${report.id}/print`} className="text-gray-600 hover:text-gray-900 p-1 rounded-full hover:bg-gray-100 transition-colors" title="Print Report">
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
                <p className="text-gray-500 text-center py-4">No reports match your search</p>
              )
            ) : (
              <p className="text-gray-500 text-center py-4">No recent reports found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabTechnicianDashboard;
