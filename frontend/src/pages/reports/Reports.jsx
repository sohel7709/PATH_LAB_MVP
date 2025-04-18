import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowPathIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { reports } from '../../utils/api';
import { formatDate, getStatusColor } from '../../utils/helpers';
import { REPORT_STATUS } from '../../utils/constants';

export default function Reports() {
  const [reportsData, setReportsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching reports from API...');
      const response = await reports.getAll(); // Fetch all reports
      console.log('Reports response received:', response);
      
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
      } else if (response && Array.isArray(response.data)) {
        // Yet another format
        reportsArray = response.data;
      }
      
      console.log('Processed reports array:', reportsArray);
      setReportsData(reportsArray || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(`Failed to load reports: ${err.message}`);
      setReportsData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (report) => {
    setReportToDelete(report);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!reportToDelete) return;
    
    try {
      setIsLoading(true);
      const reportId = reportToDelete._id || reportToDelete.id;
      await reports.delete(reportId);
      
      // Remove the deleted report from the state
      setReportsData(prevReports => 
        prevReports.filter(report => {
          const id = report._id || report.id;
          return id !== reportId;
        })
      );
      
      setShowDeleteConfirm(false);
      setReportToDelete(null);
    } catch (err) {
      console.error('Error deleting report:', err);
      setError(`Failed to delete report: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setReportToDelete(null);
  };

  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedReports = [...reportsData].sort((a, b) => {
    if (sortConfig.direction === 'asc') {
      return a[sortConfig.key] > b[sortConfig.key] ? 1 : -1;
    }
    return a[sortConfig.key] < b[sortConfig.key] ? 1 : -1;
  });

  const filteredReports = sortedReports.filter((report) => {
    // Handle both old and new report data structures
    const patientName = report.patientInfo?.name || report.patientName || '';
    const testName = report.testInfo?.name || report.testName || '';
    
    const matchesSearch = patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         testName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || report.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return null;
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUpIcon className="h-4 w-4 inline-block ml-1" />
    ) : (
      <ArrowDownIcon className="h-4 w-4 inline-block ml-1" />
    );
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all laboratory reports including patient details and status.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex space-x-3">
          <button
            onClick={fetchReports}
            className="btn-secondary inline-flex items-center"
            disabled={isLoading}
          >
            <ArrowPathIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
          <Link
            to="/reports/create"
            className="btn-primary inline-flex items-center"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            New Report
          </Link>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 p-4 rounded-md">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col">
        <div className="mb-4 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              className="input-field pl-10"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter */}
          <div className="sm:w-64">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FunnelIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <select
                className="input-field pl-10"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                {Object.values(REPORT_STATUS).map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle">
            <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 lg:pl-8 cursor-pointer"
                      onClick={() => handleSort('patientName')}
                    >
                      Patient Name
                      <SortIcon columnKey="patientName" />
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                      onClick={() => handleSort('testName')}
                    >
                      Test Name
                      <SortIcon columnKey="testName" />
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                      onClick={() => handleSort('createdAt')}
                    >
                      Date
                      <SortIcon columnKey="createdAt" />
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                      onClick={() => handleSort('status')}
                    >
                      Status
                      <SortIcon columnKey="status" />
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 lg:pr-8">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-4 text-center text-sm text-gray-500">
                        No reports found
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((report) => {
                      // Handle both old and new report data structures
                      const patientName = report.patientInfo?.name || report.patientName || 'N/A';
                      const testName = report.testInfo?.name || report.testName || 'N/A';
                      const reportId = report._id || report.id;
                      
                      return (
                        <tr key={reportId}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 lg:pl-8">
                            {patientName}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {testName}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {formatDate(report.createdAt || report.reportMeta?.generatedAt)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(report.status)}`}>
                              {report.status}
                            </span>
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 lg:pr-8">
                          <div className="flex space-x-3">
                            <Link
                              to={`/reports/${reportId}/print`}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Report"
                            >
                              View
                            </Link>
                            <Link
                              to={`/reports/${reportId}/edit`}
                              className="text-green-600 hover:text-green-900"
                              title="Edit Report"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => window.open(`/reports/${reportId}/print`, '_blank')}
                              className="text-gray-600 hover:text-gray-900"
                              title="Print Report in New Tab"
                            >
                              Print
                            </button>
                            <button
                              onClick={() => handleDeleteClick(report)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Report"
                            >
                              Delete
                            </button>
                          </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
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
    </div>
  );
}
