import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  UserGroupIcon,
  DocumentTextIcon,
  UserIcon,
  CurrencyDollarIcon,
  BeakerIcon,
  PlusIcon,
  PencilSquareIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { formatDate, truncateText } from '../../utils/helpers';
import { DATE_FORMATS } from '../../utils/constants';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const statusBadge = (status) => {
  const map = {
    completed: 'badge badge-green',
    pending: 'badge badge-yellow',
    processing: 'badge badge-blue',
  };
  return map[status] || 'badge badge-gray';
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalReports: 0, totalPatients: 0, revenueThisMonth: 0, inventoryItems: 0 });
  const [recentReports, setRecentReports] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [labDetails, setLabDetails] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const apiModules = await import('../../utils/api');
        const { dashboard, superAdmin, reports, patients } = apiModules;

        if (user?.lab) {
          try {
            const labResponse = await superAdmin.getLab(user.lab);
            if (labResponse.success) {
              setLabDetails(labResponse.data);

              try {
                const statsData = await dashboard.getStats(user.lab);
                setStats(prev => ({
                  ...prev,
                  totalReports: statsData.totalReports || 0,
                  revenueThisMonth: statsData.revenueThisMonth || 0,
                  inventoryItems: statsData.inventoryItems || 0,
                }));
              } catch {}

              try {
                const patientsData = await patients.getAll(user.lab);
                if (patientsData && Array.isArray(patientsData)) {
                  setStats(prev => ({ ...prev, totalPatients: patientsData.length }));
                  setRecentPatients(patientsData.slice(0, 5).map(p => ({
                    id: p._id || p.id, name: p.fullName, age: p.age, gender: p.gender, contact: p.phone,
                  })));
                }
              } catch {}

              try {
                const reportsResponse = await reports.getAll({ lab: user.lab });
                let arr = [];
                if (reportsResponse?.data && Array.isArray(reportsResponse.data)) arr = reportsResponse.data;
                else if (Array.isArray(reportsResponse)) arr = reportsResponse;
                setRecentReports(arr.slice(0, 5).map(r => ({
                  id: r._id || r.id,
                  patientName: r.patientName || r.patientInfo?.name || 'Unknown',
                  testName: r.testName || r.testInfo?.name || 'Unknown',
                  status: r.status || 'pending',
                  date: r.createdAt || r.reportMeta?.generatedAt || new Date().toISOString(),
                })));
              } catch {}
            }
          } catch {}
        }
      } catch {}
    };
    fetchDashboardData();
  }, [user]);

  const statCards = [
    {
      label: 'Total Patients', value: stats.totalPatients,
      icon: UserGroupIcon, iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
      link: '/patients', linkLabel: 'View patients',
    },
    {
      label: 'Total Reports', value: stats.totalReports,
      icon: DocumentTextIcon, iconBg: 'bg-purple-100', iconColor: 'text-purple-600',
      link: '/reports', linkLabel: 'View reports',
    },
    {
      label: 'Revenue This Month', value: `₹${stats.revenueThisMonth}`,
      icon: CurrencyDollarIcon, iconBg: 'bg-amber-100', iconColor: 'text-amber-600',
      link: '/finance/revenue', linkLabel: 'View revenue',
    },
    {
      label: 'Inventory Items', value: stats.inventoryItems,
      icon: BeakerIcon, iconBg: 'bg-green-100', iconColor: 'text-green-600',
      link: '/inventory', linkLabel: 'View inventory',
    },
  ];

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {getGreeting()}, {user?.name || 'Admin'}
          </h1>
          {labDetails?.name && (
            <p className="text-sm text-slate-500 mt-0.5">{labDetails.name}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link to="/reports/create" className="btn btn-primary">
            <PlusIcon className="h-4 w-4" />
            New Report
          </Link>
          <Link to="/patients/add" className="btn btn-secondary">
            <UserIcon className="h-4 w-4" />
            Add Patient
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className="stat-card card-hover">
            <div className={`stat-icon ${s.iconBg}`}>
              <s.icon className={`h-5 w-5 ${s.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{s.value}</p>
              <Link to={s.link} className="text-xs text-blue-600 hover:text-blue-700 mt-1 inline-block">
                {s.linkLabel} &rarr;
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="card p-5">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { to: '/patients/add', label: 'Add Patient', icon: UserIcon },
            { to: '/reports/create', label: 'Create Report', icon: DocumentTextIcon },
            { to: '/doctors', label: 'Manage Doctors', icon: UserGroupIcon },
            { to: '/finance/revenue', label: 'Financial Report', icon: ChartBarIcon },
          ].map(action => (
            <Link key={action.to} to={action.to} className="flex flex-col items-center gap-2 p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-center">
              <action.icon className="h-6 w-6 text-blue-600" />
              <span className="text-xs font-medium text-slate-700">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Reports */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800">Recent Reports</h2>
            <Link to="/reports/create" className="btn btn-sm btn-primary">
              <PlusIcon className="h-3.5 w-3.5" />
              New
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Test</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentReports.length > 0 ? recentReports.map((report, i) => (
                  <tr key={report.id || i}>
                    <td className="font-medium text-slate-900">{report.patientName}</td>
                    <td className="text-slate-500 max-w-[140px] truncate" title={report.testName}>
                      {truncateText(report.testName, 30)}
                    </td>
                    <td>
                      <span className={statusBadge(report.status)}>
                        {report.status?.charAt(0).toUpperCase() + report.status?.slice(1)}
                      </span>
                    </td>
                    <td className="text-slate-500">{formatDate(report.date, DATE_FORMATS.DD_MM_YYYY)}</td>
                    <td>
                      <div className="flex gap-1">
                        <Link to={`/reports/${report.id}/print`} className="p-1 rounded hover:bg-blue-50 text-blue-600 hover:text-blue-800 transition-colors">
                          <DocumentTextIcon className="h-4 w-4" />
                        </Link>
                        <Link to={`/reports/${report.id}/edit`} className="p-1 rounded hover:bg-green-50 text-green-600 hover:text-green-800 transition-colors">
                          <PencilSquareIcon className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state py-8">
                        <DocumentTextIcon className="h-10 w-10 text-slate-300 mb-2" />
                        <p className="text-sm">No reports yet</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-100">
            <Link to="/reports" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View all reports &rarr;</Link>
          </div>
        </div>

        {/* Recent Patients */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800">Recent Patients</h2>
            <Link to="/patients/add" className="btn btn-sm btn-primary">
              <PlusIcon className="h-3.5 w-3.5" />
              Add
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Age/Gender</th>
                  <th>Contact</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentPatients.length > 0 ? recentPatients.map(patient => (
                  <tr key={patient.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                          {patient.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900">{patient.name}</span>
                      </div>
                    </td>
                    <td className="text-slate-500">
                      {patient.age} / {patient.gender?.charAt(0).toUpperCase() + patient.gender?.slice(1)}
                    </td>
                    <td className="text-slate-500">{patient.contact}</td>
                    <td>
                      <div className="flex gap-1">
                        <Link to={`/patients/${patient.id}/edit`} className="p-1 rounded hover:bg-green-50 text-green-600 hover:text-green-800 transition-colors">
                          <PencilSquareIcon className="h-4 w-4" />
                        </Link>
                        <Link to={`/reports/create?patientId=${patient.id}`} className="p-1 rounded hover:bg-blue-50 text-blue-600 hover:text-blue-800 transition-colors">
                          <DocumentTextIcon className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4}>
                      <div className="empty-state py-8">
                        <UserGroupIcon className="h-10 w-10 text-slate-300 mb-2" />
                        <p className="text-sm">No patients yet</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-100">
            <Link to="/patients" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View all patients &rarr;</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
