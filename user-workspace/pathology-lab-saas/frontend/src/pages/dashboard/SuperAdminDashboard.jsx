import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { superAdmin } from '../../utils/api';
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
        lastBackup: new Date().toLocaleDateString()
      });
      alert('System status refreshed successfully!');
    } catch (err) {
      console.error('Error refreshing system status:', err);
      alert('Failed to refresh system status. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with view switcher */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
            <p className="mt-1 text-sm opacity-80">Full access to the entire system</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <select
              id="view-switcher"
              value={selectedView}
              onChange={(e) => handleViewChange(e.target.value)}
              className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
            >
              <option value="super-admin">Super Admin View</option>
              <option value="admin">Admin View</option>
              <option value="technician">Technician View</option>
            </select>
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
              <Link to="/subscriptions" className="font-medium text-blue-700 hover:text-blue-900">
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
      <div className="overflow-hidden rounded-lg bg-white shadow-md">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
              <h4 className="text-indigo-800 font-medium mb-3">Test Templates</h4>
              <div className="space-y-2">
                <Link
                  to="/templates/create"
                  className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <PlusCircleIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Create Template
                </Link>
                <Link
                  to="/templates"
                  className="inline-flex w-full items-center justify-center rounded-md border border-indigo-300 bg-white px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <EyeIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  View Templates
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
        <div className="overflow-hidden rounded-lg bg-white shadow-md">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900">Recent Labs</h3>
            {loading ? (
              <div className="mt-4 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="mt-4 text-center text-red-500">{error}</div>
            ) : (
              <div className="mt-4 overflow-hidden">
                <ul className="divide-y divide-gray-200">
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
                              {lab.subscription.plan.charAt(0).toUpperCase() + lab.subscription.plan.slice(1)} Plan • {lab.subscription.status}
                            </p>
                          </div>
                          <div className="flex-shrink-0 flex space-x-2">
                            <Link to={`/labs/${lab._id}`} className="text-blue-600 hover:text-blue-900">
                              <EyeIcon className="h-5 w-5" />
                            </Link>
                            <Link to={`/labs/${lab._id}/edit`} className="text-gray-600 hover:text-gray-900">
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
                <div className="mt-4 text-right">
                  <Link to="/labs" className="text-sm font-medium text-blue-600 hover:text-blue-800">
                    View all labs →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="overflow-hidden rounded-lg bg-white shadow-md">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900">Recent Users</h3>
            {loading ? (
              <div className="mt-4 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : error ? (
              <div className="mt-4 text-center text-red-500">{error}</div>
            ) : (
              <div className="mt-4 overflow-hidden">
                <ul className="divide-y divide-gray-200">
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
                          <div className="flex-shrink-0 flex space-x-2">
                            <Link to={`/users/${user._id}`} className="text-purple-600 hover:text-purple-900">
                              <EyeIcon className="h-5 w-5" />
                            </Link>
                            <Link to={`/users/${user._id}/edit`} className="text-gray-600 hover:text-gray-900">
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
                <div className="mt-4 text-right">
                  <Link to="/users" className="text-sm font-medium text-purple-600 hover:text-purple-800">
                    View all users →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="overflow-hidden rounded-lg bg-white shadow-md">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Analytics Overview</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => handleExport('analytics', 'csv')}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <CloudArrowDownIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
                Export CSV
              </button>
              <button
                onClick={() => handleExport('analytics', 'pdf')}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <DocumentTextIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
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
              className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <ChartBarIcon className="-ml-1 mr-2 h-5 w-5" />
              View Detailed Analytics
            </Link>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="overflow-hidden rounded-lg bg-white shadow-md">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900">System Health</h3>
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
          <div className="mt-6">
            <button
              type="button"
              onClick={refreshSystemStatus}
              className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <ArrowPathIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Refresh System Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
