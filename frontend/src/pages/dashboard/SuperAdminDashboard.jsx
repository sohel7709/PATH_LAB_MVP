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
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  CreditCardIcon,
  ArrowPathIcon,
  EyeIcon,
  PlusCircleIcon,
  PencilSquareIcon,
  UserIcon,
  UsersIcon,
  ShieldCheckIcon,
  CloudArrowDownIcon,
} from '@heroicons/react/24/outline';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState({ totalLabs: 0, totalUsers: 0, activeSubscriptions: 0, revenueThisMonth: 0 });
  const [recentLabs, setRecentLabs] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [systemHealth] = useState({ systemStatus: 'Operational', databaseHealth: 'Good', lastBackup: 'Today' });
  const [analyticsData, setAnalyticsData] = useState({ labsBySubscription: [], usersByRole: [] });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
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
          });
        }
      } catch {
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handleExport = async (type, format) => {
    try {
      await superAdmin.exportData(type, format);
      alert(`${type.toUpperCase()} data exported in ${format.toUpperCase()} format successfully!`);
    } catch {
      alert(`Failed to export ${type} data. Please try again.`);
    }
  };

  const statCards = [
    { label: 'Total Labs', value: stats.totalLabs, icon: BuildingOfficeIcon, iconBg: 'bg-blue-100', iconColor: 'text-blue-600', link: '/labs', linkLabel: 'View labs' },
    { label: 'Total Users', value: stats.totalUsers, icon: UserGroupIcon, iconBg: 'bg-purple-100', iconColor: 'text-purple-600', link: '/users', linkLabel: 'View users' },
    { label: 'Active Subscriptions', value: stats.activeSubscriptions, icon: ClipboardDocumentCheckIcon, iconBg: 'bg-green-100', iconColor: 'text-green-600', link: '/plans', linkLabel: 'View plans' },
    { label: 'Revenue This Month', value: `₹${stats.revenueThisMonth}`, icon: CreditCardIcon, iconBg: 'bg-amber-100', iconColor: 'text-amber-600', link: '/revenue', linkLabel: 'View revenue' },
  ];

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-inherit">Super Admin Dashboard</h1>
          <p className="text-sm text-inherit opacity-60 mt-0.5">Welcome back, {user?.name || 'Super Admin'}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/labs/create" className="btn btn-primary">
            <PlusCircleIcon className="h-4 w-4" />
            New Lab
          </Link>
          <button onClick={() => handleExport('analytics', 'csv')} className="btn btn-secondary">
            <CloudArrowDownIcon className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(s => (
          <div key={s.label} className="stat-card card-hover">
            <div className={`stat-icon ${s.iconBg}`}>
              <s.icon className={`h-5 w-5 ${s.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-inherit opacity-60 font-medium">{s.label}</p>
              <p className="text-2xl font-bold text-inherit mt-0.5">{s.value}</p>
              <Link to={s.link} className="text-xs text-blue-600 hover:text-blue-700 mt-1 inline-block">
                {s.linkLabel} &rarr;
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card p-5">
        <h2 className="text-lg font-semibold text-inherit mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { to: '/labs/create', label: 'Create Lab', icon: BuildingOfficeIcon },
            { to: '/labs', label: 'View Labs', icon: EyeIcon },
            { to: '/users/create', label: 'Create User', icon: UserGroupIcon },
            { to: '/users', label: 'View Users', icon: EyeIcon },
            { to: '/templates/create', label: 'New Template', icon: PlusCircleIcon },
            { to: '/analytics', label: 'Analytics', icon: ChartBarIcon },
          ].map(a => (
            <Link key={a.to} to={a.to} className="flex flex-col items-center gap-2 p-3 rounded-lg border border-inherit hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-center">
              <a.icon className="h-5 w-5 text-blue-600" />
              <span className="text-xs font-medium text-inherit">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Labs & Users */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Labs */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-inherit">
            <h2 className="text-lg font-semibold text-inherit">Recent Labs</h2>
            <Link to="/labs" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View all &rarr;</Link>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 skeleton" />
                ))}
              </div>
            ) : error ? (
              <p className="text-sm text-red-500 text-center py-4">{error}</p>
            ) : recentLabs.length > 0 ? (
              <ul className="divide-y divide-inherit">
                {recentLabs.map(lab => (
                  <li key={lab._id} className="py-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-inherit truncate">{lab.name}</p>
                      <p className="text-xs text-inherit opacity-60 truncate">
                        {lab.subscription?.plan?.name || 'No Plan'} &bull; {lab.status || 'Unknown'}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Link to={`/labs/${lab._id}`} className="p-1 rounded hover:bg-blue-50 text-blue-600 transition-colors" title="View">
                        <EyeIcon className="h-4 w-4" />
                      </Link>
                      <Link to={`/labs/${lab._id}/edit`} className="p-1 rounded hover:bg-green-50 text-green-600 transition-colors" title="Edit">
                        <PencilSquareIcon className="h-4 w-4" />
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state py-6">
                <BuildingOfficeIcon className="h-10 w-10 text-slate-300 mb-2" />
                <p className="text-sm">No labs found</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-inherit">
            <h2 className="text-lg font-semibold text-inherit">Recent Users</h2>
            <Link to="/users" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View all &rarr;</Link>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 skeleton" />
                ))}
              </div>
            ) : error ? (
              <p className="text-sm text-red-500 text-center py-4">{error}</p>
            ) : recentUsers.length > 0 ? (
              <ul className="divide-y divide-inherit">
                {recentUsers.map(u => (
                  <li key={u._id} className="py-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                      {u.role === 'super-admin' ? (
                        <ShieldCheckIcon className="h-5 w-5 text-purple-600" />
                      ) : u.role === 'admin' ? (
                        <UserIcon className="h-5 w-5 text-purple-600" />
                      ) : (
                        <UsersIcon className="h-5 w-5 text-purple-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-inherit truncate">{u.name}</p>
                      <p className="text-xs text-inherit opacity-60 truncate">
                        {u.role.charAt(0).toUpperCase() + u.role.slice(1).replace('-', ' ')} &bull; {u.lab?.name || 'No Lab'}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Link to={`/users/${u._id}`} className="p-1 rounded hover:bg-blue-50 text-blue-600 transition-colors" title="View">
                        <EyeIcon className="h-4 w-4" />
                      </Link>
                      <Link to={`/users/${u._id}/edit`} className="p-1 rounded hover:bg-green-50 text-green-600 transition-colors" title="Edit">
                        <PencilSquareIcon className="h-4 w-4" />
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state py-6">
                <UserGroupIcon className="h-10 w-10 text-slate-300 mb-2" />
                <p className="text-sm">No users found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-inherit">Analytics Overview</h2>
          <div className="flex gap-2">
            <button onClick={() => handleExport('analytics', 'csv')} className="btn btn-sm btn-secondary">
              <CloudArrowDownIcon className="h-3.5 w-3.5" />
              CSV
            </button>
            <button onClick={() => handleExport('analytics', 'pdf')} className="btn btn-sm btn-secondary">
              <DocumentTextIcon className="h-3.5 w-3.5" />
              PDF
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className=" rounded-lg p-4">
            <h4 className="text-sm font-medium text-inherit mb-4">Labs by Subscription</h4>
            <div className="space-y-3">
              {analyticsData.labsBySubscription.map(item => (
                <div key={item._id} className="flex items-center gap-3">
                  <span className="text-sm text-inherit w-24 shrink-0">
                    {item._id ? (item._id.charAt(0).toUpperCase() + item._id.slice(1)) : 'Unknown'}
                  </span>
                  <div className="flex-1 rounded-full h-2" style={{ background: 'var(--border)' }}>
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${stats.totalLabs ? (item.count / stats.totalLabs) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-inherit opacity-60 w-6 text-right">{item.count}</span>
                </div>
              ))}
              {analyticsData.labsBySubscription.length === 0 && (
                <p className="text-sm text-inherit opacity-40 text-center py-2">No data available</p>
              )}
            </div>
          </div>
          <div className=" rounded-lg p-4">
            <h4 className="text-sm font-medium text-inherit mb-4">Users by Role</h4>
            <div className="space-y-3">
              {analyticsData.usersByRole.map(item => (
                <div key={item._id} className="flex items-center gap-3">
                  <span className="text-sm text-inherit w-24 shrink-0">
                    {item._id ? (item._id.charAt(0).toUpperCase() + item._id.slice(1).replace('-', ' ')) : 'Unknown'}
                  </span>
                  <div className="flex-1 rounded-full h-2" style={{ background: 'var(--border)' }}>
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${stats.totalUsers ? (item.count / stats.totalUsers) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-inherit opacity-60 w-6 text-right">{item.count}</span>
                </div>
              ))}
              {analyticsData.usersByRole.length === 0 && (
                <p className="text-sm text-inherit opacity-40 text-center py-2">No data available</p>
              )}
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-center">
          <Link to="/analytics" className="btn btn-primary">
            <ChartBarIcon className="h-4 w-4" />
            View Detailed Analytics
          </Link>
        </div>
      </div>

      {/* System Health */}
      <div className="card p-5">
        <h2 className="text-lg font-semibold text-inherit mb-4">System Health</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: 'System Status', value: systemHealth.systemStatus, iconColor: 'var(--success)' },
            { label: 'Database Health', value: systemHealth.databaseHealth, iconColor: 'var(--primary)' },
            { label: 'Last Backup', value: systemHealth.lastBackup, iconColor: '#6366f1' },
          ].map(h => (
            <div key={h.label} className="rounded-lg px-4 py-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{h.label}</p>
              <p className="text-xl font-semibold" style={{ color: h.iconColor }}>{h.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
