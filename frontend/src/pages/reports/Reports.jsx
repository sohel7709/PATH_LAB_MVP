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
import LoadingSpinner, { SkeletonLoader, ButtonLoader } from '../../components/common/LoadingSpinner';
import { reports } from '../../utils/api';
import { formatDate, getStatusColor } from '../../utils/helpers';
import { REPORT_STATUS } from '../../utils/constants';

export default function Reports() {
  const [reportsData, setReportsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // Removed unused state for reportToDelete

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
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
      setIsRefreshing(false);
    }
  };



  const cancelDelete = () => {
    setShowDeleteConfirm(false);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-7xl mx-auto bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
          <div className="px-8 py-6 bg-gradient-to-r from-blue-700 to-blue-500">
            <div className="animate-pulse">
              <div className="h-8 bg-white/30 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-white/20 rounded w-1/2"></div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" text="Loading reports..." />
            </div>
            
            <SkeletonLoader type="table-row" count={5} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl mx-auto bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
        <div className="px-8 py-6 bg-gradient-to-r from-blue-700 to-blue-500">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold text-white">Reports</h1>
              <p className="text-base text-blue-100 mt-1">
                A list of all laboratory reports including patient details and status
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => fetchReports(true)}
                className="inline-flex items-center justify-center rounded-lg border border-transparent bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 transition-all duration-300"
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <ButtonLoader text="Refreshing..." />
                ) : (
                  <>
                    <ArrowPathIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Refresh
                  </>
                )}
              </button>
              <Link
                to="/reports/create"
                className="inline-flex items-center justify-center rounded-lg border border-transparent bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 transition-all duration-300"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                New Report
              </Link>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="mb-6 rounded-lg bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <TrashIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col">
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  className="block w-full rounded-lg border border-blue-300 pl-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filter */}
              <div className="sm:w-64">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FunnelIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
                  </div>
                  <select
                    className="block w-full rounded-lg border border-blue-300 pl-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300"
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

            {isRefreshing && (
              <div className="mb-4 flex justify-center">
                <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing data...
                </div>
              </div>
            )}
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-blue-200">
                <thead className="bg-blue-50">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider cursor-pointer transition-colors duration-300 hover:bg-blue-100"
                      onClick={() => handleSort('patientName')}
                    >
                      Patient Name
                      <SortIcon columnKey="patientName" />
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-xs font-medium text-blue-700 uppercase tracking-wider cursor-pointer transition-colors duration-300 hover:bg-blue-100"
                      onClick={() => handleSort('testName')}
                    >
                      Test Name
                      <SortIcon columnKey="testName" />
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-xs font-medium text-blue-700 uppercase tracking-wider cursor-pointer transition-colors duration-300 hover:bg-blue-100"
                      onClick={() => handleSort('createdAt')}
                    >
                      Date
                      <SortIcon columnKey="createdAt" />
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-xs font-medium text-blue-700 uppercase tracking-wider cursor-pointer transition-colors duration-300 hover:bg-blue-100"
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
                <tbody className="bg-white divide-y divide-blue-100">
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
                        <tr key={reportId} className="hover:bg-blue-50 transition-colors duration-150">
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
                                className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50 transition-colors"
                                title="View Report"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </Link>
                              <Link
                                to={`/reports/${reportId}/edit`}
                                className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-50 transition-colors"
                                title="Edit Report"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </Link>
                            <Link
                                to={`/reports/${reportId}/print`}
                                className="text-gray-600 hover:text-gray-900 p-1 rounded-full hover:bg-gray-100 transition-colors"
                                title="Print Report"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                            </Link>
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
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full">
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
                className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors duration-300"
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
