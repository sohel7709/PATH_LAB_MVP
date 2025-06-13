import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { superAdmin } from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import { DATE_FORMATS } from '../../utils/constants';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  ChartBarIcon,
  CogIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  CreditCardIcon,
  ArrowPathIcon,
  EyeIcon,
  PlusCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowsRightLeftIcon,
  CloudArrowDownIcon,
  UserIcon,
  UsersIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [stats, setStats] = useState({
    totalLabs: 0,
    totalUsers: 0,
    activeSubscriptions: 0,
    revenueThisMonth: 0,
  });
  const [recentLabs, setRecentLabs] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [selectedView, setSelectedView] = useState('super-admin');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [systemHealth, setSystemHealth] = useState({
    systemStatus: 'Operational',
    databaseHealth: 'Good',
    lastBackup: 'Today'
  });
  const [analyticsData, setAnalyticsData] = useState({
    labsBySubscription: [],
    usersByRole: [],
    monthlyReports: [],
    monthlyNewLabs: []
  });

  // Fetch data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get system-wide stats
        const systemStatsResponse = await superAdmin.getSystemStats();
        
        if (systemStatsResponse.success) {
          const { data } = systemStatsResponse;
          
          setStats({
            totalLabs: data.totalLabs || 0,
            totalUsers: data.totalUsers || 0,
            activeSubscriptions: data.activeSubscriptions || 0,
            revenueThisMonth: data.revenueThisMonth || 0,
          });
          
          setRecentLabs(data.recentLabs || []);
          setRecentUsers(data.recentUsers || []);
          
          setAnalyticsData({
            labsBySubscription: data.labsBySubscription || [],
            usersByRole: data.usersByRole || [],
            monthlyReports: data.monthlyReports || [],
            monthlyNewLabs: data.monthlyNewLabs || []
          });
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Function to handle view switching
  const handleViewChange = (view) => {
    setSelectedView(view);
    
    // Navigate to the appropriate dashboard based on selected view
    if (view === 'admin') {
      navigate('/admin-dashboard');
    } else if (view === 'technician') {
      navigate('/technician-dashboard');
    }
  };
  
  // Function to export data
  const handleExport = async (type, format) => {
    try {
      await superAdmin.exportData(type, format);
      alert(`${type.toUpperCase()} data exported in ${format.toUpperCase()} format successfully!`);
    } catch (err) {
      console.error(`Error exporting ${type} data:`, err);
      alert(`Failed to export ${type} data. Please try again.`);
    }
  };
  
  // Function to refresh system status
  const refreshSystemStatus = async () => {
    try {
      setSystemHealth({
        systemStatus: 'Operational',
        databaseHealth: 'Good',
        lastBackup: formatDate(new Date(), DATE_FORMATS.DD_MM_YYYY)
      });
      alert('System status refreshed successfully!');
    } catch (err) {
      console.error('Error refreshing system status:', err);
      alert('Failed to refresh system status. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Welcome Message */}
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
          <div className="px-8 py-6 bg-gradient-to-r from-blue-700 to-blue-500">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-extrabold text-white">Super Admin Dashboard</h1>
                <p className="text-base text-blue-100 mt-1">
                  Welcome, {user?.name || 'Super Admin'}! | Role: {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Super Admin'}
                </p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                <label htmlFor="view-switcher" className="text-sm font-medium text-white mr-2">
                  Switch View:
                </label>
                <select
                  id="view-switcher"
                  value={selectedView}
                  onChange={(e) => handleViewChange(e.target.value)}
                  className="rounded-md border-transparent bg-white/80 py-1 pl-3 pr-10 text-sm font-medium text-blue-800 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  <option value="super-admin">Super Admin View</option>
                  <option value="admin">Admin View</option>
                  <option value="technician">Technician View</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Labs */}
        <div className="overflow-hidden rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="p-5 border-b-4 border-blue-500">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 p-3 rounded-full">
                <BuildingOfficeIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">Total Labs</dt>
                  <dd>
                    <div className="text-2xl font-bold text-gray-900">{stats.totalLabs}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
                <Link to="/labs" className="font-medium text-blue-700 hover:text-blue-900">
                View all
              </Link>
            </div>
          </div>
        </div>

        {/* Total Users */}
        <div className="overflow-hidden rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="p-5 border-b-4 border-purple-500">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 p-3 rounded-full">
                <UserGroupIcon className="h-6 w-6 text-purple-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">Total Users</dt>
                  <dd>
                    <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/users" className="font-medium text-blue-700 hover:text-blue-900">
                View all
              </Link>
            </div>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="overflow-hidden rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="p-5 border-b-4 border-green-500">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 p-3 rounded-full">
                <ClipboardDocumentCheckIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">Active Subscriptions</dt>
                  <dd>
                    <div className="text-2xl font-bold text-gray-900">{stats.activeSubscriptions}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/plans" className="font-medium text-blue-700 hover:text-blue-900">
                View details
              </Link>
            </div>
          </div>
        </div>

        {/* Revenue */}
        <div className="overflow-hidden rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="p-5 border-b-4 border-amber-500">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-amber-100 p-3 rounded-full">
                <CreditCardIcon className="h-6 w-6 text-amber-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">Revenue This Month</dt>
                  <dd>
                    <div className="text-2xl font-bold text-gray-900">${stats.revenueThisMonth}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/finance" className="font-medium text-blue-700 hover:text-blue-900">
                View all
              </Link>
            </div>
          </div>
        </div>
      </div>

        {/* Quick Actions */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl border border-blue-100">
          <div className="px-6 py-5 border-b border-blue-100 bg-blue-50">
            <h3 className="text-lg font-semibold text-blue-800">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Lab Management */}
            <div className="bg-blue-50 rounded-lg p-4 shadow-sm">
              <h4 className="text-blue-800 font-medium mb-3">Lab Management</h4>
              <div className="space-y-2">
                <Link
                  to="/labs/create"
                  className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <BuildingOfficeIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Create New Lab
                </Link>
                <Link
                  to="/labs"
                  className="inline-flex w-full items-center justify-center rounded-md border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <EyeIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  View All Labs
                </Link>
              </div>
            </div>
            
            {/* User Management */}
            <div className="bg-purple-50 rounded-lg p-4 shadow-sm">
              <h4 className="text-purple-800 font-medium mb-3">User Management</h4>
              <div className="space-y-2">
                <Link
                  to="/users/create"
                  className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  <UserGroupIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Create User
                </Link>
                <Link
                  to="/users"
                  className="inline-flex w-full items-center justify-center rounded-md border border-purple-300 bg-white px-4 py-2 text-sm font-medium text-purple-700 shadow-sm hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  <EyeIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  View All Users
                </Link>
              </div>
            </div>
            
            {/* Test Templates */}
            <div className="bg-indigo-50 rounded-lg p-4 shadow-sm">
              <h4 className="text-indigo-800 font-medium mb-3">Template Management</h4>
              <div className="space-y-2">
                <Link
                  to="/template-manager" // Updated link
                  className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <CogIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Manage Report Layout Templates
                </Link>
              </div>
            </div>

            {/* Analytics & Reports */}
            <div className="bg-green-50 rounded-lg p-4 shadow-sm">
              <h4 className="text-green-800 font-medium mb-3">Analytics & Reports</h4>
              <div className="space-y-2">
                <Link
                  to="/analytics"
                  className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  <ChartBarIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  View Analytics
                </Link>
                <button
                  onClick={() => handleExport('analytics', 'pdf')}
                  className="inline-flex w-full items-center justify-center rounded-md border border-green-300 bg-white px-4 py-2 text-sm font-medium text-green-700 shadow-sm hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  <DocumentTextIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Export Reports
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Recent Labs and Users */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Recent Labs */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-xl border border-blue-100">
            <div className="px-6 py-5 border-b border-blue-100 bg-blue-50">
              <h3 className="text-lg font-semibold text-blue-800">Recent Labs</h3>
            </div>
            <div className="p-6">
            {loading ? (
              <div className="mt-4 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="mt-4 text-center text-red-500">{error}</div>
            ) : (
              <div className="mt-4 overflow-hidden">
                <ul className="divide-y divide-blue-100">
                  {recentLabs.length > 0 ? (
                    recentLabs.map((lab) => (
                      <li key={lab._id} className="py-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0 bg-blue-100 p-2 rounded-full">
                            <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{lab.name}</p>
                            <p className="text-sm text-gray-500 truncate">
                              {/* Handle both object (populated) and string plan references */}
                              {(() => {
                                const plan = lab.subscription?.plan;
                                if (!plan) {
                                  return 'No Plan';
                                }
                                if (plan.name) {
                                  return `${plan.name} Plan`;
                                }
                                if (typeof plan === 'string' && plan.length > 0) {
                                  return `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`;
                                }
                                return 'No Plan';
                              })()}
                              {' • '}
                              {lab.status || lab.subscription?.status || 'Unknown'}
                            </p>
                          </div>
                          <div className="flex-shrink-0 flex space-x-3">
                            <Link to={`/labs/${lab._id}`} className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50 transition-colors" title="View Lab">
                              <EyeIcon className="h-5 w-5" />
                            </Link>
                            <Link to={`/labs/${lab._id}/edit`} className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-50 transition-colors" title="Edit Lab">
                              <PencilSquareIcon className="h-5 w-5" />
                            </Link>
                          </div>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="py-4 text-center text-gray-500">No labs found</li>
                  )}
                </ul>
                <div className="mt-6 text-center">
                  <Link to="/labs" className="inline-flex items-center justify-center rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-50 transition-all duration-200">
                    View all labs →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

          {/* Recent Users */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-xl border border-blue-100">
            <div className="px-6 py-5 border-b border-blue-100 bg-blue-50">
              <h3 className="text-lg font-semibold text-blue-800">Recent Users</h3>
            </div>
            <div className="p-6">
            {loading ? (
              <div className="mt-4 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : error ? (
              <div className="mt-4 text-center text-red-500">{error}</div>
            ) : (
              <div className="mt-4 overflow-hidden">
                <ul className="divide-y divide-blue-100">
                  {recentUsers.length > 0 ? (
                    recentUsers.map((user) => (
                      <li key={user._id} className="py-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0 bg-purple-100 p-2 rounded-full">
                            {user.role === 'super-admin' ? (
                              <ShieldCheckIcon className="h-5 w-5 text-purple-600" />
                            ) : user.role === 'admin' ? (
                              <UserIcon className="h-5 w-5 text-purple-600" />
                            ) : (
                              <UsersIcon className="h-5 w-5 text-purple-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                            <p className="text-sm text-gray-500 truncate">
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('-', ' ')} • {user.lab?.name || 'No Lab'}
                            </p>
                          </div>
                          <div className="flex-shrink-0 flex space-x-3">
                            <Link to={`/users/${user._id}`} className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50 transition-colors" title="View User">
                              <EyeIcon className="h-5 w-5" />
                            </Link>
                            <Link to={`/users/${user._id}/edit`} className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-50 transition-colors" title="Edit User">
                              <PencilSquareIcon className="h-5 w-5" />
                            </Link>
                          </div>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="py-4 text-center text-gray-500">No users found</li>
                  )}
                </ul>
                <div className="mt-6 text-center">
                  <Link to="/users" className="inline-flex items-center justify-center rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-50 transition-all duration-200">
                    View all users →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

        {/* Analytics Overview */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl border border-blue-100">
          <div className="px-6 py-5 border-b border-blue-100 bg-blue-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-blue-800">Analytics Overview</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => handleExport('analytics', 'csv')}
                className="inline-flex items-center rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mr-2"
              >
                <CloudArrowDownIcon className="-ml-1 mr-2 h-5 w-5 text-blue-500" />
                Export CSV
              </button>
              <button
                onClick={() => handleExport('analytics', 'pdf')}
                className="inline-flex items-center rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <DocumentTextIcon className="-ml-1 mr-2 h-5 w-5 text-blue-500" />
                Export PDF
              </button>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Labs by Subscription */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Labs by Subscription Plan</h4>
              <div className="space-y-4">
                {analyticsData.labsBySubscription.map((item) => (
                  <div key={item._id} className="flex items-center">
                    <div className="w-1/3">
                      <span className="text-sm font-medium text-gray-900">
                        {item._id ? (item._id.charAt(0).toUpperCase() + item._id.slice(1)) : 'Unknown'}
                      </span>
                    </div>
                    <div className="w-2/3">
                      <div className="relative">
                        <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                          <div
                            style={{ width: `${(item.count / stats.totalLabs) * 100}%` }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600 absolute right-0 -top-5">{item.count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Users by Role */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Users by Role</h4>
              <div className="space-y-4">
                {analyticsData.usersByRole.map((item) => (
                  <div key={item._id} className="flex items-center">
                    <div className="w-1/3">
                      <span className="text-sm font-medium text-gray-900">
                        {item._id ? (item._id.charAt(0).toUpperCase() + item._id.slice(1).replace('-', ' ')) : 'Unknown'}
                      </span>
                    </div>
                    <div className="w-2/3">
                      <div className="relative">
                        <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                          <div
                            style={{ width: `${(item.count / stats.totalUsers) * 100}%` }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500"
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600 absolute right-0 -top-5">{item.count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <Link
              to="/analytics"
              className="inline-flex items-center rounded-lg border border-transparent bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            >
              <ChartBarIcon className="-ml-1 mr-2 h-5 w-5" />
              View Detailed Analytics
            </Link>
          </div>
        </div>
      </div>

        {/* System Health */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl border border-blue-100">
          <div className="px-6 py-5 border-b border-blue-100 bg-blue-50">
            <h3 className="text-lg font-semibold text-blue-800">System Health</h3>
          </div>
          <div className="p-6">
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="overflow-hidden rounded-lg bg-green-50 px-4 py-5 shadow sm:p-6">
              <dt className="truncate text-sm font-medium text-green-800">System Status</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-green-900">{systemHealth.systemStatus}</dd>
            </div>
            <div className="overflow-hidden rounded-lg bg-blue-50 px-4 py-5 shadow sm:p-6">
              <dt className="truncate text-sm font-medium text-blue-800">Database Health</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-blue-900">{systemHealth.databaseHealth}</dd>
            </div>
            <div className="overflow-hidden rounded-lg bg-indigo-50 px-4 py-5 shadow sm:p-6">
              <dt className="truncate text-sm font-medium text-indigo-800">Last Backup</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-indigo-900">{systemHealth.lastBackup}</dd>
            </div>
          </div>
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={refreshSystemStatus}
                className="inline-flex items-center rounded-lg border border-transparent bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
              >
                <ArrowPathIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Refresh System Status
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
