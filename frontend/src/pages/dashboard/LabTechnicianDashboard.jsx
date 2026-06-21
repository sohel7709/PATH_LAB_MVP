import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  UserIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  PencilSquareIcon,
  PrinterIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { formatDate, truncateText } from '../../utils/helpers';
import { DATE_FORMATS } from '../../utils/constants';

const statusBadge = (status) => {
  const map = { completed: 'badge badge-green', pending: 'badge badge-yellow', processing: 'badge badge-blue' };
  return map[status] || 'badge badge-gray';
};

const LabTechnicianDashboard = () => {
  const [stats, setStats] = useState({ pendingReports: 0, completedReports: 0, samplesCollected: 0, assignedTasks: 0 });
  const [recentPatients, setRecentPatients] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [labDetails, setLabDetails] = useState(null);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [reportSearchTerm, setReportSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const { dashboard, patients, reports } = await import('../../utils/api');

        try {
          const statsData = await dashboard.getStats(user?.lab);
          setStats({
            pendingReports: statsData.pendingReports || 0,
            completedReports: statsData.completedReports || 0,
            samplesCollected: statsData.samplesCollected || 0,
            assignedTasks: statsData.assignedTasks || 0,
          });
          if (user?.lab) setLabDetails({ name: statsData?.labName || 'Your Lab' });
        } catch {}

        try {
          const patientsData = await patients.getAll(user?.lab);
          if (Array.isArray(patientsData)) {
            setRecentPatients(patientsData.slice(0, 5).map(p => ({
              id: p._id, name: p.fullName, age: p.age, gender: p.gender, contact: p.phone,
            })));
          }
        } catch {}

        try {
          const response = await reports.getAll({ lab: user?.lab });
          let arr = [];
          if (response?.data && Array.isArray(response.data)) arr = response.data;
          else if (Array.isArray(response)) arr = response;
          setRecentReports(arr.slice(0, 5).map(r => ({
            id: r.id || r._id,
            patientName: r.patientName || r.patientInfo?.name || 'Unknown',
            testName: r.testName || r.testInfo?.name || 'Unknown',
            status: r.status || 'pending',
            date: r.createdAt || r.reportMeta?.generatedAt || new Date(),
          })));
        } catch {}
      } catch {} finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, [user]);

  const filteredPatients = recentPatients.filter(p =>
    !patientSearchTerm || p.name?.toLowerCase().includes(patientSearchTerm.toLowerCase()) || p.contact?.includes(patientSearchTerm)
  );

  const filteredReports = recentReports.filter(r =>
    !reportSearchTerm || r.patientName?.toLowerCase().includes(reportSearchTerm.toLowerCase()) || r.testName?.toLowerCase().includes(reportSearchTerm.toLowerCase())
  );

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (isLoading) {
    return (
      <div className="page-enter flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Technician Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Welcome, {user?.name || 'Lab Technician'}
            {labDetails?.name && <> &mdash; {labDetails.name}</>}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/patients/add" className="btn btn-secondary">
            <UserIcon className="h-4 w-4" />
            Add Patient
          </Link>
          <Link to="/reports/create" className="btn btn-primary">
            <DocumentTextIcon className="h-4 w-4" />
            Create Report
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Pending Reports', value: stats.pendingReports, icon: DocumentTextIcon, iconBg: 'bg-amber-100', iconColor: 'text-amber-600', link: '/reports?status=pending' },
          { label: 'Completed Reports', value: stats.completedReports, icon: ClipboardDocumentCheckIcon, iconBg: 'bg-green-100', iconColor: 'text-green-600', link: '/reports?status=completed' },
          { label: 'Assigned Tasks', value: stats.assignedTasks, icon: ClipboardDocumentCheckIcon, iconBg: 'bg-purple-100', iconColor: 'text-purple-600', link: '/tasks' },
        ].map(s => (
          <div key={s.label} className="stat-card card-hover">
            <div className={`stat-icon ${s.iconBg}`}>
              <s.icon className={`h-5 w-5 ${s.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{s.value}</p>
              <Link to={s.link} className="text-xs text-blue-600 hover:text-blue-700 mt-1 inline-block">View &rarr;</Link>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Patients */}
      <div className="card">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-800">Recent Patients</h2>
            <Link to="/patients" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View all &rarr;</Link>
          </div>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={patientSearchTerm}
              onChange={e => setPatientSearchTerm(e.target.value)}
              placeholder="Search patients..."
              className="input pl-9"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Age/Gender</th>
                <th>Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.length > 0 ? filteredPatients.map(patient => (
                <tr key={patient.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                        {patient.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-900">{patient.name}</span>
                    </div>
                  </td>
                  <td className="text-slate-500">{patient.age} / {patient.gender?.charAt(0).toUpperCase() + patient.gender?.slice(1)}</td>
                  <td className="text-slate-500">{patient.contact}</td>
                  <td>
                    <div className="flex gap-1">
                      <Link to={`/reports/create?patientId=${patient.id}`} className="p-1 rounded hover:bg-blue-50 text-blue-600 transition-colors" title="Create Report">
                        <PencilSquareIcon className="h-4 w-4" />
                      </Link>
                      <Link to={`/patients/${patient.id}`} className="p-1 rounded hover:bg-slate-100 text-slate-500 transition-colors" title="View Patient">
                        <UserIcon className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4}>
                    <div className="empty-state py-6">
                      <UserIcon className="h-10 w-10 text-slate-300 mb-2" />
                      <p className="text-sm">{patientSearchTerm ? 'No patients match your search' : 'No recent patients'}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="card">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-800">Recent Reports</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className={`p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-all ${refreshing ? 'animate-spin' : ''}`}
                title="Refresh"
              >
                <ArrowPathIcon className="h-4 w-4" />
              </button>
              <Link to="/reports" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View all &rarr;</Link>
            </div>
          </div>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={reportSearchTerm}
              onChange={e => setReportSearchTerm(e.target.value)}
              placeholder="Search reports..."
              className="input pl-9"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Test</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length > 0 ? filteredReports.map(report => (
                <tr key={report.id}>
                  <td className="font-medium text-slate-900">{report.patientName}</td>
                  <td className="text-slate-500 max-w-[160px] truncate" title={report.testName}>
                    {truncateText(report.testName, 35)}
                  </td>
                  <td>
                    <span className={statusBadge(report.status)}>
                      {report.status?.charAt(0).toUpperCase() + report.status?.slice(1)}
                    </span>
                  </td>
                  <td className="text-slate-500">{formatDate(report.date, DATE_FORMATS.DD_MM_YYYY)}</td>
                  <td>
                    <div className="flex gap-1">
                      <Link to={`/reports/${report.id}/print`} className="p-1 rounded hover:bg-blue-50 text-blue-600 transition-colors" title="View">
                        <DocumentTextIcon className="h-4 w-4" />
                      </Link>
                      <Link to={`/reports/${report.id}/edit`} className="p-1 rounded hover:bg-green-50 text-green-600 transition-colors" title="Edit">
                        <PencilSquareIcon className="h-4 w-4" />
                      </Link>
                      <Link to={`/reports/${report.id}/print`} className="p-1 rounded hover:bg-slate-100 text-slate-500 transition-colors" title="Print">
                        <PrinterIcon className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state py-6">
                      <DocumentTextIcon className="h-10 w-10 text-slate-300 mb-2" />
                      <p className="text-sm">{reportSearchTerm ? 'No reports match your search' : 'No recent reports'}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LabTechnicianDashboard;
