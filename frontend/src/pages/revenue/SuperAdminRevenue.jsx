import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  CurrencyRupeeIcon,
  BanknotesIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const SuperAdminRevenue = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    activeSubscriptions: 0,
    totalLabsSubscribed: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [monthlyChartData, setMonthlyChartData] = useState([]);
  const [planChartData, setPlanChartData] = useState([]);
  const [search, setSearch] = useState('');

  const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/super-admin/revenue`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (err) {}
  };

  const fetchTransactions = async (p = 1) => {
    try {
      const res = await fetch(`${API_BASE}/super-admin/revenue/transactions?page=${p}&limit=20`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setTransactions(data.data);
        setTotalPages(data.pages);
        setPage(data.page);
      }
    } catch (err) {}
  };

  const fetchMonthlyChart = async () => {
    try {
      const res = await fetch(`${API_BASE}/super-admin/revenue/monthly-chart`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setMonthlyChartData(data.data);
    } catch (err) {}
  };

  const fetchPlanChart = async () => {
    try {
      const res = await fetch(`${API_BASE}/super-admin/revenue/plan-chart`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setPlanChartData(data.data);
    } catch (err) {}
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setError('');
      try {
        await Promise.all([fetchStats(), fetchTransactions(1), fetchMonthlyChart(), fetchPlanChart()]);
      } catch (err) {
        setError('Failed to load revenue data');
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

  const filteredTransactions = transactions.filter(tx =>
    !search ||
    tx.lab?.name?.toLowerCase().includes(search.toLowerCase()) ||
    tx.admin?.name?.toLowerCase().includes(search.toLowerCase()) ||
    tx.subscriptionPlan?.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="page-enter max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="skeleton h-10 w-64 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
        <div className="skeleton h-80 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="page-enter max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="stat-icon" style={{ background: 'var(--primary-bg)' }}>
          <CurrencyRupeeIcon className="h-5 w-5" style={{ color: 'var(--primary)' }} />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text)' }}>
            Global Revenue Dashboard
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Subscription-based revenue from all labs
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="stat-card" style={{ borderLeft: '3px solid var(--primary)' }}>
          <div className="stat-icon" style={{ background: 'var(--primary-bg)' }}>
            <CurrencyRupeeIcon className="h-5 w-5" style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Revenue</p>
            <p className="text-xl font-bold" style={{ color: 'var(--text)' }}>{formatCurrency(stats.totalRevenue)}</p>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '3px solid var(--success)' }}>
          <div className="stat-icon" style={{ background: 'var(--success-bg)' }}>
            <ArrowTrendingUpIcon className="h-5 w-5" style={{ color: 'var(--success)' }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Monthly Revenue</p>
            <p className="text-xl font-bold" style={{ color: 'var(--text)' }}>{formatCurrency(stats.monthlyRevenue)}</p>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '3px solid #8b5cf6' }}>
          <div className="stat-icon" style={{ background: '#f3e8ff' }}>
            <CalendarDaysIcon className="h-5 w-5" style={{ color: '#8b5cf6' }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Yearly Revenue</p>
            <p className="text-xl font-bold" style={{ color: 'var(--text)' }}>{formatCurrency(stats.yearlyRevenue)}</p>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '3px solid #f97316' }}>
          <div className="stat-icon" style={{ background: '#fff7ed' }}>
            <BanknotesIcon className="h-5 w-5" style={{ color: '#f97316' }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Active Subscriptions</p>
            <p className="text-xl font-bold" style={{ color: 'var(--text)' }}>{stats.activeSubscriptions}</p>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '3px solid #14b8a6' }}>
          <div className="stat-icon" style={{ background: '#f0fdfa' }}>
            <BuildingOffice2Icon className="h-5 w-5" style={{ color: '#14b8a6' }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Labs Subscribed</p>
            <p className="text-xl font-bold" style={{ color: 'var(--text)' }}>{stats.totalLabsSubscribed}</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="section-title">Monthly Revenue {new Date().getFullYear()}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <Tooltip
                formatter={(value) => [formatCurrency(value), 'Revenue']}
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}
              />
              <Legend />
              <Bar dataKey="revenue" fill="var(--primary)" name="Revenue (₹)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h2 className="section-title">Subscription Sales by Plan</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={planChartData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ planName, subscriptions }) => `${planName} (${subscriptions})`}
                outerRadius={100}
                dataKey="subscriptions"
                nameKey="planName"
              >
                {planChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value} sales`, '']}
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card overflow-hidden">
        <div className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="section-title" style={{ margin: 0 }}>Revenue Transactions</h2>
          <div className="relative w-full sm:w-64">
            <MagnifyingGlassIcon
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search lab, admin, plan..."
              className="input w-full pl-9"
            />
          </div>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Lab Name</th>
                <th>Admin</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state py-12">
                      <BanknotesIcon className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--text-faint)' }} />
                      <p style={{ color: 'var(--text-muted)' }}>
                        {search ? 'No transactions match your search.' : 'No revenue transactions yet. Activate subscriptions to generate revenue.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx._id}>
                    <td className="font-medium" style={{ color: 'var(--text)' }}>{tx.lab?.name || 'N/A'}</td>
                    <td style={{ color: 'var(--text-2)' }}>{tx.admin?.name || 'N/A'}</td>
                    <td>
                      <span className="badge badge-blue">{tx.subscriptionPlan?.name || 'N/A'}</span>
                    </td>
                    <td className="font-semibold" style={{ color: 'var(--success)' }}>
                      {formatCurrency(tx.amount)}
                    </td>
                    <td style={{ color: 'var(--text-2)' }}>
                      {new Date(tx.activatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <button
              onClick={() => fetchTransactions(page - 1)}
              disabled={page <= 1}
              className="btn btn-secondary btn-sm"
            >
              Previous
            </button>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => fetchTransactions(page + 1)}
              disabled={page >= totalPages}
              className="btn btn-secondary btn-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminRevenue;
