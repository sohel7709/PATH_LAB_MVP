import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  UserGroupIcon, DocumentTextIcon, UserIcon,
  CurrencyDollarIcon, BeakerIcon, PlusIcon,
  PencilSquareIcon, ChartBarIcon, ArrowRightIcon,
  ClockIcon, CheckCircleIcon, ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon, XCircleIcon,
} from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/helpers';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', emoji: '☀️' };
  if (h < 17) return { text: 'Good afternoon', emoji: '🌤️' };
  return { text: 'Good evening', emoji: '🌙' };
};

const STATUS_STYLES = {
  pending:       'bg-yellow-100 text-yellow-700 border-yellow-200',
  'in-progress': 'bg-blue-100 text-blue-700 border-blue-200',
  completed:     'bg-green-100 text-green-700 border-green-200',
  verified:      'bg-indigo-100 text-indigo-700 border-indigo-200',
  delivered:     'bg-teal-100 text-teal-700 border-teal-200',
};

const AVATAR_COLORS = ['bg-blue-500','bg-indigo-500','bg-violet-500','bg-pink-500','bg-teal-500','bg-orange-500'];
const avatarColor = (name = '') => AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];

export default function AdminDashboard() {
  const { user } = useAuth();
  const greeting = getGreeting();

  const [stats, setStats] = useState({ totalReports: 0, totalPatients: 0, revenueThisMonth: 0, pending: 0, completed: 0, verified: 0, waSentTotal: 0, waDoctorTotal: 0, waPending: 0, waSentToday: 0 });
  const [recentReports, setRecentReports]   = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [labDetails, setLabDetails]         = useState(null);
  const [loading, setLoading]               = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const api = await import('../../utils/api');
        const { dashboard, superAdmin, reports, patients } = api;
        if (!user?.lab) return;

        const labRes = await superAdmin.getLab(user.lab).catch(() => null);
        if (labRes?.success) setLabDetails(labRes.data);

        const [statsData, patientsData, reportsRes] = await Promise.allSettled([
          dashboard.getStats(user.lab),
          patients.getAll(user.lab),
          reports.getAll({ lab: user.lab }),
        ]);

        if (statsData.status === 'fulfilled') {
          setStats(prev => ({ ...prev, totalReports: statsData.value.totalReports || 0, revenueThisMonth: statsData.value.revenueThisMonth || 0 }));
        }

        if (patientsData.status === 'fulfilled') {
          const arr = Array.isArray(patientsData.value) ? patientsData.value : (patientsData.value?.data || []);
          setStats(prev => ({ ...prev, totalPatients: arr.length }));
          setRecentPatients(arr.slice(0, 5).map(p => ({ id: p._id, name: p.fullName, age: p.age, gender: p.gender, phone: p.phone })));
        }

        if (reportsRes.status === 'fulfilled') {
          const v = reportsRes.value;
          const arr = Array.isArray(v) ? v : (v?.data || []);
          const today = new Date().toDateString();
          const waSentTotal = arr.filter(r => r.reportMeta?.deliveryStatus?.whatsapp?.sent === true).length;
          const waDoctorTotal = arr.filter(r => r.reportMeta?.deliveryStatus?.whatsappDoctor?.sent === true).length;
          const waPending = arr.filter(r => !r.reportMeta?.deliveryStatus?.whatsapp?.sent).length;
          const waSentToday = arr.filter(r => {
            const sentAt = r.reportMeta?.deliveryStatus?.whatsapp?.sentAt;
            return sentAt && new Date(sentAt).toDateString() === today;
          }).length;
          setStats(prev => ({
            ...prev,
            totalReports: arr.length || prev.totalReports,
            pending:   arr.filter(r => r.status === 'pending').length,
            completed: arr.filter(r => r.status === 'completed').length,
            verified:  arr.filter(r => r.status === 'verified').length,
            waSentTotal, waDoctorTotal, waPending, waSentToday,
          }));
          setRecentReports(arr.slice(0, 6).map(r => ({
            id: r._id, patientName: r.patientInfo?.name || 'Unknown',
            testName: r.testInfo?.name || 'Unknown', status: r.status || 'pending',
            date: r.createdAt || r.reportMeta?.generatedAt,
            waSent: r.reportMeta?.deliveryStatus?.whatsapp?.sent === true,
          })));
        }
      } catch {}
      finally { setLoading(false); }
    })();
  }, [user]);

  const statCards = [
    { label: 'Total Patients', value: stats.totalPatients, icon: UserGroupIcon, gradient: 'from-blue-500 to-blue-600', link: '/patients' },
    { label: 'Total Reports',  value: stats.totalReports,  icon: DocumentTextIcon, gradient: 'from-purple-500 to-purple-600', link: '/reports' },
    { label: 'Revenue / Month', value: `₹${(stats.revenueThisMonth || 0).toLocaleString('en-IN')}`, icon: CurrencyDollarIcon, gradient: 'from-amber-500 to-orange-500', link: '/finance/revenue' },
    { label: 'Pending Reports', value: stats.pending, icon: ClockIcon, gradient: 'from-rose-500 to-red-500', link: '/reports' },
  ];

  const quickActions = [
    { to: '/patients/add',    label: 'Add Patient',    icon: UserIcon,        color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
    { to: '/reports/create',  label: 'New Report',     icon: DocumentTextIcon, color: 'bg-purple-50 text-purple-600 hover:bg-purple-100' },
    { to: '/doctors',         label: 'Doctors',        icon: UserGroupIcon,   color: 'bg-teal-50 text-teal-600 hover:bg-teal-100' },
    { to: '/finance/revenue', label: 'Revenue',        icon: ChartBarIcon,    color: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
    { to: '/templates',       label: 'Templates',      icon: BeakerIcon,      color: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' },
    { to: '/settings/report', label: 'Report Design',  icon: PencilSquareIcon, color: 'bg-pink-50 text-pink-600 hover:bg-pink-100' },
  ];

  if (loading) return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="h-36 rounded-2xl bg-gray-100 animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-gray-100 animate-pulse" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[...Array(2)].map((_, i) => <div key={i} className="h-80 rounded-xl bg-gray-100 animate-pulse" />)}
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">

      {/* ── Welcome banner ── */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 px-6 py-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-blue-200 text-sm font-medium mb-1">{greeting.emoji} {greeting.text}</p>
            <h1 className="text-2xl font-bold text-white">{user?.name || 'Admin'}</h1>
            {labDetails?.name && (
              <p className="text-blue-200 text-sm mt-1 flex items-center gap-1.5">
                <BeakerIcon className="h-3.5 w-3.5" />
                {labDetails.name}
              </p>
            )}
          </div>
          <div className="flex gap-2.5">
            <Link to="/reports/create" className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white text-blue-700 text-sm font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-sm">
              <PlusIcon className="h-4 w-4" /> New Report
            </Link>
            <Link to="/patients/add" className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white/15 text-white text-sm font-semibold rounded-xl hover:bg-white/25 transition-colors">
              <UserIcon className="h-4 w-4" /> Add Patient
            </Link>
          </div>
        </div>

        {/* Status pills */}
        <div className="flex flex-wrap gap-3 mt-5">
          {[
            { label: `${stats.pending} Pending`,   color: 'bg-yellow-400/20 text-yellow-100 border-yellow-400/30' },
            { label: `${stats.completed} Completed`, color: 'bg-green-400/20 text-green-100 border-green-400/30' },
            { label: `${stats.verified} Verified`,  color: 'bg-indigo-400/20 text-indigo-100 border-indigo-400/30' },
          ].map(p => (
            <span key={p.label} className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${p.color}`}>
              {p.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <Link key={s.label} to={s.link} className="group bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-4 shadow-sm`}>
              <s.icon className="h-5 w-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">{s.label}</p>
            <p className="text-xs text-blue-500 mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
              View <ArrowRightIcon className="h-3 w-3" />
            </p>
          </Link>
        ))}
      </div>

      {/* ── Quick actions ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Quick Actions</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {quickActions.map(a => (
            <Link key={a.to} to={a.to} className={`flex flex-col items-center gap-2.5 p-3.5 rounded-xl transition-all text-center ${a.color}`}>
              <a.icon className="h-5 w-5" />
              <span className="text-xs font-semibold leading-tight">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Recent Reports + Patients ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Recent Reports */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-bold text-gray-800">Recent Reports</h2>
            <Link to="/reports/create" className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors">
              <PlusIcon className="h-3 w-3" /> New
            </Link>
          </div>

          {recentReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <DocumentTextIcon className="h-10 w-10 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No reports yet</p>
              <Link to="/reports/create" className="text-xs text-blue-500 mt-2 font-medium">Create first report →</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentReports.map(r => (
                <Link key={r.id} to={`/reports/${r.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors group">
                  <div className={`h-8 w-8 rounded-full ${avatarColor(r.patientName)} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-xs font-bold text-white">{r.patientName.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{r.patientName}</p>
                    <p className="text-xs text-gray-400 truncate">{r.testName}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${STATUS_STYLES[r.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {r.status}
                    </span>
                    <span className="text-xs text-gray-400">{r.date ? formatDate(r.date) : ''}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="px-5 py-3 border-t border-gray-50">
            <Link to="/reports" className="text-xs text-blue-500 font-semibold hover:text-blue-600 flex items-center gap-1">
              View all reports <ArrowRightIcon className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Recent Patients */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-bold text-gray-800">Recent Patients</h2>
            <Link to="/patients/add" className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors">
              <PlusIcon className="h-3 w-3" /> Add
            </Link>
          </div>

          {recentPatients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <UserGroupIcon className="h-10 w-10 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No patients yet</p>
              <Link to="/patients/add" className="text-xs text-blue-500 mt-2 font-medium">Add first patient →</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentPatients.map(p => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors group">
                  <div className={`h-8 w-8 rounded-full ${avatarColor(p.name)} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-xs font-bold text-white">{p.name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">
                      {p.age ? `${p.age}y` : ''}{p.age && p.gender ? ' · ' : ''}<span className="capitalize">{p.gender}</span>
                      {p.phone ? ` · ${p.phone}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link to={`/patients/${p.id}/edit`} className="h-7 w-7 rounded-lg flex items-center justify-center text-green-600 hover:bg-green-100 transition-colors">
                      <PencilSquareIcon className="h-3.5 w-3.5" />
                    </Link>
                    <Link to={`/reports/create?patientId=${p.id}`} className="h-7 w-7 rounded-lg flex items-center justify-center text-blue-500 hover:bg-blue-100 transition-colors">
                      <DocumentTextIcon className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="px-5 py-3 border-t border-gray-50">
            <Link to="/patients" className="text-xs text-blue-500 font-semibold hover:text-blue-600 flex items-center gap-1">
              View all patients <ArrowRightIcon className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Report status breakdown ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Report Status Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Pending',     count: stats.pending,   icon: ClockIcon,         color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
            { label: 'In Progress', count: 0,               icon: ChartBarIcon,      color: 'bg-blue-50 text-blue-700 border-blue-200' },
            { label: 'Completed',   count: stats.completed, icon: CheckCircleIcon,   color: 'bg-green-50 text-green-700 border-green-200' },
            { label: 'Verified',    count: stats.verified,  icon: CheckCircleIcon,   color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
            { label: 'Total',       count: stats.totalReports, icon: DocumentTextIcon, color: 'bg-gray-50 text-gray-700 border-gray-200' },
          ].map(s => (
            <div key={s.label} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border ${s.color}`}>
              <s.icon className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="text-xl font-bold">{s.count}</p>
                <p className="text-xs font-medium opacity-80">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── WhatsApp Delivery Tracking ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="h-4 w-4 text-green-600" />
            </div>
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">WhatsApp Delivery</h2>
          </div>
          <Link to="/reports" className="text-xs text-blue-500 font-semibold hover:text-blue-600 flex items-center gap-1">
            View Reports <ArrowRightIcon className="h-3 w-3" />
          </Link>
        </div>

        {/* Message credit balance */}
        {labDetails && typeof labDetails.whatsappCredits === 'number' && (
          <div className={`flex items-center justify-between mb-4 px-4 py-3 rounded-xl border ${labDetails.whatsappCredits > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div>
              <p className="text-xs font-medium text-gray-500">Message Credit Balance</p>
              <p className={`text-2xl font-bold ${labDetails.whatsappCredits > 0 ? 'text-green-700' : 'text-red-600'}`}>
                {labDetails.whatsappCredits} <span className="text-sm font-normal text-gray-500">credits left</span>
              </p>
            </div>
            {labDetails.whatsappCredits <= 10 && (
              <span className="text-xs font-semibold text-red-600 bg-white px-3 py-1.5 rounded-lg border border-red-200">
                {labDetails.whatsappCredits === 0 ? 'Out of credits — messages paused' : 'Low balance'}
              </span>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Sent to Patients', count: stats.waSentTotal, icon: CheckCircleIcon, color: 'bg-green-50 text-green-700 border-green-200' },
            { label: 'Sent to Doctors',  count: stats.waDoctorTotal, icon: ChatBubbleLeftRightIcon, color: 'bg-blue-50 text-blue-700 border-blue-200' },
            { label: 'Pending (Not Sent)', count: stats.waPending, icon: XCircleIcon, color: 'bg-orange-50 text-orange-700 border-orange-200' },
            { label: 'Sent Today',       count: stats.waSentToday, icon: CheckCircleIcon, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          ].map(s => (
            <div key={s.label} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border ${s.color}`}>
              <s.icon className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="text-2xl font-bold">{s.count}</p>
                <p className="text-xs font-medium opacity-80 leading-tight mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Delivery rate bar */}
        {stats.totalReports > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-500 font-medium">Delivery Rate</span>
              <span className="text-xs font-bold text-green-600">
                {Math.round((stats.waSentTotal / stats.totalReports) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.round((stats.waSentTotal / stats.totalReports) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {stats.waSentTotal} of {stats.totalReports} reports notified via WhatsApp
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
