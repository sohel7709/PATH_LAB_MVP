import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  const [recentTechnicians, setRecentTechnicians] = useState([]);
  const [selectedView, setSelectedView] = useState('admin');

  // Simulated data - would be replaced with actual API calls
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setStats({
        totalTechnicians: 12,
        totalReports: 245,
        totalPatients: 178,
        revenueThisMonth: 8500,
        inventoryItems: 56,
      });

      setRecentReports([
        { id: 1, patientName: 'John Smith', testName: 'Blood Test', status: 'completed', date: '2023-03-29' },
        { id: 2, patientName: 'Mary Johnson', testName: 'Urine Analysis', status: 'pending', date: '2023-03-30' },
        { id: 3, patientName: 'Robert Brown', testName: 'Lipid Profile', status: 'in-progress', date: '2023-03-28' },
      ]);

      setRecentTechnicians([
        { id: 1, name: 'Sarah Wilson', email: 'sarah@example.com', status: 'active', assignedTests: 8 },
        { id: 2, name: 'Michael Davis', email: 'michael@example.com', status: 'active', assignedTests: 5 },
        { id: 3, name: 'Emily Taylor', email: 'emily@example.com', status: 'inactive', assignedTests: 0 },
      ]);
    }, 1000);
  }, []);

  // Function to handle view switching
  const handleViewChange = (view) => {
    setSelectedView(view);
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">Technicians</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.totalTechnicians}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/settings/users" className="font-medium text-primary-700 hover:text-primary-900">
                Manage
              </Link>
            </div>
          </div>
        </div>

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
              <Link to="/reports" className="font-medium text-primary-700 hover:text-primary-900">
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
              <Link to="/patients" className="font-medium text-primary-700 hover:text-primary-900">
                View all
              </Link>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">Revenue (Month)</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">${stats.revenueThisMonth}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/finance" className="font-medium text-primary-700 hover:text-primary-900">
                View details
              </Link>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BeakerIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">Inventory Items</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.inventoryItems}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/inventory" className="font-medium text-primary-700 hover:text-primary-900">
                Manage
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="p-6">
          <h3 className="text-base font-medium text-gray-900">Quick Actions</h3>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/settings/users/create"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <UserGroupIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Add Technician
            </Link>
            <Link
              to="/reports/create"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <DocumentTextIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Create Report
            </Link>
            <Link
              to="/patients/create"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <UserIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Add Patient
            </Link>
            <Link
              to="/finance/reports"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <ChartBarIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Financial Reports
            </Link>
            <Link
              to="/inventory/manage"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <BeakerIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Manage Inventory
            </Link>
            <Link
              to="/technician-mode"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <ArrowPathIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Switch to Technician Mode
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
                          <Link to={`/reports/${report.id}`} className="text-primary-600 hover:text-primary-900 mr-4">
                            View
                          </Link>
                          <Link to={`/reports/${report.id}/edit`} className="text-primary-600 hover:text-primary-900 mr-4">
                            Edit
                          </Link>
                          <button className="text-red-600 hover:text-red-900">Delete</button>
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

      {/* Lab Technicians */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-gray-900">Lab Technicians</h3>
            <Link to="/settings/users/create" className="text-sm font-medium text-primary-600 hover:text-primary-900">
              <PlusIcon className="inline-block h-5 w-5 mr-1" />
              Add Technician
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
                        Email
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Assigned Tests
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentTechnicians.map((tech) => (
                      <tr key={tech.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                          {tech.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{tech.email}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              tech.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {tech.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{tech.assignedTests}</td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                          <Link to={`/settings/users/${tech.id}`} className="text-primary-600 hover:text-primary-900 mr-4">
                            Edit
                          </Link>
                          <Link to={`/settings/users/${tech.id}/tasks`} className="text-primary-600 hover:text-primary-900 mr-4">
                            Assign Tasks
                          </Link>
                          <button className="text-red-600 hover:text-red-900">Delete</button>
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
              to="/settings/users"
              className="flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Manage all technicians
            </Link>
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="p-6">
          <h3 className="text-base font-medium text-gray-900">Financial Overview</h3>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 border border-gray-200">
              <dt className="truncate text-sm font-medium text-gray-500">Revenue (This Month)</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">${stats.revenueThisMonth}</dd>
            </div>
            <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 border border-gray-200">
              <dt className="truncate text-sm font-medium text-gray-500">Pending Payments</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">$1,250</dd>
            </div>
            <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 border border-gray-200">
              <dt className="truncate text-sm font-medium text-gray-500">Expenses (This Month)</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">$3,200</dd>
            </div>
          </div>
          <div className="mt-6">
            <Link
              to="/finance/reports"
              className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <ChartBarIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Generate Financial Reports
            </Link>
          </div>
        </div>
      </div>

      {/* Inventory Status */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="p-6">
          <h3 className="text-base font-medium text-gray-900">Inventory Status</h3>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 border border-gray-200">
              <dt className="truncate text-sm font-medium text-gray-500">Total Items</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{stats.inventoryItems}</dd>
            </div>
            <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 border border-gray-200">
              <dt className="truncate text-sm font-medium text-gray-500">Low Stock Items</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">8</dd>
            </div>
            <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 border border-gray-200">
              <dt className="truncate text-sm font-medium text-gray-500">Out of Stock</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">3</dd>
            </div>
            <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 border border-gray-200">
              <dt className="truncate text-sm font-medium text-gray-500">Value</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">$12,500</dd>
            </div>
          </div>
          <div className="mt-6">
            <Link
              to="/inventory/manage"
              className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <BeakerIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Manage Inventory
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
