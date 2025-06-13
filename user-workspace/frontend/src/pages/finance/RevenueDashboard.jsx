import { useState, useEffect } from 'react';
import { revenue } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  ArrowDownTrayIcon, 
  CalendarDaysIcon, 
  CurrencyRupeeIcon,
  DocumentChartBarIcon
} from '@heroicons/react/24/outline';

export default function RevenueDashboard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [revenueData, setRevenueData] = useState({
    totalRevenue: 0,
    totalReportCount: 0,
    revenueByDate: []
  });
  
  // Date range state
  const [dateRange, setDateRange] = useState('monthly');
  const [customRange, setCustomRange] = useState({
    from: new Date(new Date().setDate(1)).toISOString().split('T')[0], // First day of current month
    to: new Date().toISOString().split('T')[0] // Today
  });
  
  // Chart type state
  const [chartType, setChartType] = useState('line');
  
  // Labs state (for super admin)
  const [selectedLabId, setSelectedLabId] = useState('');
  const [labs, setLabs] = useState([]);
  
  // Fetch labs if user is super admin
  useEffect(() => {
    const fetchLabs = async () => {
      if (user?.role === 'super-admin') {
        try {
          const response = await fetch('/api/lab-management', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          const data = await response.json();
          if (data.success) {
            setLabs(data.data);
          }
        } catch (err) {
          console.error('Error fetching labs:', err);
        }
      }
    };
    
    if (user?.role === 'super-admin') {
      fetchLabs();
    }
  }, [user]);
  
  // Fetch revenue data
  useEffect(() => {
    const fetchRevenueData = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        const params = {
          range: dateRange
        };
        
        // Add lab ID if selected (for super admin)
        if (selectedLabId) {
          params.labId = selectedLabId;
        }
        
        // Add custom date range if applicable
        if (dateRange === 'custom') {
          params.from = customRange.from;
          params.to = customRange.to;
        }
        
        const data = await revenue.getData(params);
        
        if (data.success) {
          setRevenueData(data.data);
        } else {
          setError(data.message || 'Failed to fetch revenue data');
        }
      } catch (err) {
        console.error('Error fetching revenue data:', err);
        setError(err.message || 'An error occurred while fetching revenue data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRevenueData();
  }, [dateRange, customRange, selectedLabId, user]);
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Handle export
  const handleExport = async (format) => {
    try {
      const params = {
        range: dateRange
      };
      
      if (selectedLabId) {
        params.labId = selectedLabId;
      }
      
      if (dateRange === 'custom') {
        params.from = customRange.from;
        params.to = customRange.to;
      }
      
      const response = await revenue.exportData(format, params);
      
      // Create a download link
      const blob = new Blob([response], { type: format === 'csv' ? 'text/csv' : 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `revenue-report-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting data:', err);
      setError(err.message || 'Failed to export data');
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="px-8 py-6 bg-gradient-to-r from-blue-700 to-blue-500">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <CurrencyRupeeIcon className="h-8 w-8 text-white mr-3" />
                <div>
                  <h1 className="text-3xl font-extrabold text-white">Revenue Dashboard</h1>
                  <p className="text-base text-blue-100 mt-1">
                    Track and analyze your lab's revenue
                  </p>
                </div>
              </div>
              
              {/* Export buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleExport('csv')}
                  className="flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg shadow hover:bg-blue-50 transition"
                >
                  <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                  Export CSV
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg shadow hover:bg-blue-50 transition"
                >
                  <DocumentChartBarIcon className="h-5 w-5 mr-2" />
                  Export PDF
                </button>
              </div>
            </div>
          </div>
          
          {/* Filters */}
          <div className="px-8 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Date range selector */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <CalendarDaysIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Date Range:</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setDateRange('daily')}
                    className={`px-3 py-1.5 text-sm rounded-md ${
                      dateRange === 'daily'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setDateRange('weekly')}
                    className={`px-3 py-1.5 text-sm rounded-md ${
                      dateRange === 'weekly'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => setDateRange('monthly')}
                    className={`px-3 py-1.5 text-sm rounded-md ${
                      dateRange === 'monthly'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    This Month
                  </button>
                  <button
                    onClick={() => setDateRange('custom')}
                    className={`px-3 py-1.5 text-sm rounded-md ${
                      dateRange === 'custom'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Custom
                  </button>
                </div>
              </div>
              
              {/* Chart type selector */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700">Chart Type:</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setChartType('line')}
                    className={`px-3 py-1.5 text-sm rounded-md ${
                      chartType === 'line'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Line
                  </button>
                  <button
                    onClick={() => setChartType('bar')}
                    className={`px-3 py-1.5 text-sm rounded-md ${
                      chartType === 'bar'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Bar
                  </button>
                </div>
              </div>
              
              {/* Lab selector (for super admin) */}
              {user?.role === 'super-admin' && (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700">Lab:</span>
                  </div>
                  <select
                    value={selectedLabId}
                    onChange={(e) => setSelectedLabId(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">All Labs</option>
                    {labs.map((lab) => (
                      <option key={lab._id} value={lab._id}>
                        {lab.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            {/* Custom date range inputs */}
            {dateRange === 'custom' && (
              <div className="mt-4 flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label htmlFor="from-date" className="text-sm font-medium text-gray-700">
                    From:
                  </label>
                  <input
                    type="date"
                    id="from-date"
                    value={customRange.from}
                    onChange={(e) => setCustomRange({ ...customRange, from: e.target.value })}
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <label htmlFor="to-date" className="text-sm font-medium text-gray-700">
                    To:
                  </label>
                  <input
                    type="date"
                    id="to-date"
                    value={customRange.to}
                    onChange={(e) => setCustomRange({ ...customRange, to: e.target.value })}
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="p-8">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Stats cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white rounded-xl shadow-md p-6 border border-blue-100">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                        <CurrencyRupeeIcon className="h-8 w-8" />
                      </div>
                      <div className="ml-5">
                        <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                        <h3 className="text-3xl font-bold text-gray-900">
                          {formatCurrency(revenueData.totalRevenue)}
                        </h3>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-md p-6 border border-blue-100">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-green-100 text-green-600">
                        <DocumentChartBarIcon className="h-8 w-8" />
                      </div>
                      <div className="ml-5">
                        <p className="text-sm font-medium text-gray-500">Total Reports</p>
                        <h3 className="text-3xl font-bold text-gray-900">
                          {revenueData.totalReportCount}
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Chart */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-blue-100 mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === 'line' ? (
                        <LineChart
                          data={revenueData.revenueByDate}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value) => formatCurrency(value)}
                            labelFormatter={(label) => `Date: ${label}`}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            name="Revenue"
                            stroke="#3b82f6"
                            activeDot={{ r: 8 }}
                            strokeWidth={2}
                          />
                        </LineChart>
                      ) : (
                        <BarChart
                          data={revenueData.revenueByDate}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value) => formatCurrency(value)}
                            labelFormatter={(label) => `Date: ${label}`}
                          />
                          <Legend />
                          <Bar
                            dataKey="revenue"
                            name="Revenue"
                            fill="#3b82f6"
                          />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Data table */}
                <div className="bg-white rounded-xl shadow-md border border-blue-100 overflow-hidden">
                  <h3 className="text-lg font-semibold text-gray-900 p-6 border-b border-gray-200">
                    Revenue by Date
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Date
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Revenue
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Reports
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Avg. Revenue per Report
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {revenueData.revenueByDate.map((item) => (
                          <tr key={item.date}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.date}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(item.revenue)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.count}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.count > 0
                                ? formatCurrency(item.revenue / item.count)
                                : formatCurrency(0)}
                            </td>
                          </tr>
                        ))}
                        
                        {revenueData.revenueByDate.length === 0 && (
                          <tr>
                            <td
                              colSpan="4"
                              className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"
                            >
                              No data available for the selected date range
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
