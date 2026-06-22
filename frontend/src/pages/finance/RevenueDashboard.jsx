import { useState, useEffect } from 'react';
import { revenue } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  CurrencyRupeeIcon,
  DocumentChartBarIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

const DATE_FILTERS = [
  { key: 'daily', label: 'Today' },
  { key: 'weekly', label: 'This Week' },
  { key: 'monthly', label: 'This Month' },
  { key: 'custom', label: 'Custom' },
];

export default function RevenueDashboard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [revenueData, setRevenueData] = useState({
    totalRevenue: 0,
    totalReportCount: 0,
    revenueByDate: [],
  });

  const [dateRange, setDateRange] = useState('monthly');
  const [customRange, setCustomRange] = useState({
    from: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  const [chartType, setChartType] = useState('line');
  const [selectedLabId, setSelectedLabId] = useState('');
  const [labs, setLabs] = useState([]);

  useEffect(() => {
    if (user?.role === 'super-admin') {
      fetch('/api/lab-management', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      })
        .then(r => r.json())
        .then(data => { if (data.success) setLabs(data.data); })
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    const fetchRevenueData = async () => {
      setIsLoading(true);
      setError('');
      try {
        const params = { range: dateRange };
        if (selectedLabId) params.labId = selectedLabId;
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
        setError(err.message || 'An error occurred while fetching revenue data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRevenueData();
  }, [dateRange, customRange, selectedLabId, user]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const avgPerReport =
    revenueData.totalReportCount > 0
      ? revenueData.totalRevenue / revenueData.totalReportCount
      : 0;

  const thisMonthRevenue = revenueData.revenueByDate
    .filter(d => {
      const now = new Date();
      const date = new Date(d.date);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, d) => sum + (d.revenue || 0), 0);

  return (
    <div className="page-enter max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="stat-icon" style={{ background: 'var(--primary-bg)' }}>
            <CurrencyRupeeIcon className="h-5 w-5" style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text)' }}>
              Revenue Dashboard
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Track and analyze your lab&apos;s revenue
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <CalendarDaysIcon className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>Date Range:</span>
          </div>
          <div className="tab-list flex-wrap">
            {DATE_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setDateRange(f.key)}
                className={`tab-item${dateRange === f.key ? ' active' : ''}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <ChartBarIcon className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>Chart:</span>
            <div className="tab-list">
              <button onClick={() => setChartType('line')} className={`tab-item${chartType === 'line' ? ' active' : ''}`}>Line</button>
              <button onClick={() => setChartType('bar')} className={`tab-item${chartType === 'bar' ? ' active' : ''}`}>Bar</button>
            </div>
          </div>

          {user?.role === 'super-admin' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>Lab:</span>
              <select
                value={selectedLabId}
                onChange={e => setSelectedLabId(e.target.value)}
                className="select"
              >
                <option value="">All Labs</option>
                {labs.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
              </select>
            </div>
          )}
        </div>

        {dateRange === 'custom' && (
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>From:</label>
              <input
                type="date"
                value={customRange.from}
                onChange={e => setCustomRange({ ...customRange, from: e.target.value })}
                className="input"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>To:</label>
              <input
                type="date"
                value={customRange.to}
                onChange={e => setCustomRange({ ...customRange, to: e.target.value })}
                className="input"
              />
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'var(--primary-bg)' }}>
                <CurrencyRupeeIcon className="h-5 w-5" style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Revenue</p>
                <p className="text-2xl font-bold mt-0.5" style={{ color: 'var(--text)' }}>
                  {formatCurrency(revenueData.totalRevenue)}
                </p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'var(--success-bg)' }}>
                <ArrowTrendingUpIcon className="h-5 w-5" style={{ color: 'var(--success)' }} />
              </div>
              <div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>This Month</p>
                <p className="text-2xl font-bold mt-0.5" style={{ color: 'var(--text)' }}>
                  {formatCurrency(thisMonthRevenue)}
                </p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#f3e8ff' }}>
                <DocumentChartBarIcon className="h-5 w-5" style={{ color: '#9333ea' }} />
              </div>
              <div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Reports Count</p>
                <p className="text-2xl font-bold mt-0.5" style={{ color: 'var(--text)' }}>
                  {revenueData.totalReportCount}
                </p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fff7ed' }}>
                <ChartBarIcon className="h-5 w-5" style={{ color: '#ea580c' }} />
              </div>
              <div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Avg per Report</p>
                <p className="text-2xl font-bold mt-0.5" style={{ color: 'var(--text)' }}>
                  {formatCurrency(avgPerReport)}
                </p>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="card p-6">
            <h3 className="section-title">Revenue Trend</h3>
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'line' ? (
                  <LineChart data={revenueData.revenueByDate} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => [formatCurrency(value), 'Revenue']}
                      labelFormatter={(label) => `Date: ${label}`}
                      contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" name="Revenue" stroke="var(--primary)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 7 }} />
                  </LineChart>
                ) : (
                  <BarChart data={revenueData.revenueByDate} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => [formatCurrency(value), 'Revenue']}
                      labelFormatter={(label) => `Date: ${label}`}
                      contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}
                    />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table */}
          <div className="card overflow-hidden">
            <div className="p-5" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="section-title" style={{ margin: 0 }}>Revenue by Date</h3>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Revenue</th>
                    <th>Reports</th>
                    <th>Avg. per Report</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueData.revenueByDate.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
                        No data available for the selected date range.
                      </td>
                    </tr>
                  ) : (
                    revenueData.revenueByDate.map((item) => (
                      <tr key={item.date}>
                        <td className="font-medium" style={{ color: 'var(--text)' }}>{item.date}</td>
                        <td style={{ color: 'var(--success)' }} className="font-semibold">{formatCurrency(item.revenue)}</td>
                        <td style={{ color: 'var(--text-2)' }}>{item.count}</td>
                        <td style={{ color: 'var(--text-2)' }}>
                          {item.count > 0 ? formatCurrency(item.revenue / item.count) : formatCurrency(0)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
