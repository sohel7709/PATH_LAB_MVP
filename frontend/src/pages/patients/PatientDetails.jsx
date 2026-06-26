import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeftIcon, PencilIcon, DocumentTextIcon,
  EyeIcon, PrinterIcon, PhoneIcon, EnvelopeIcon,
  MapPinIcon, UserIcon, CalendarIcon, ExclamationCircleIcon,
  BeakerIcon, PlusIcon,
} from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/helpers';
import { DATE_FORMATS } from '../../utils/constants';

const STATUS_STYLES = {
  pending:       'bg-yellow-100 text-yellow-700 border-yellow-200',
  'in-progress': 'bg-blue-100 text-blue-700 border-blue-200',
  completed:     'bg-green-100 text-green-700 border-green-200',
  verified:      'bg-indigo-100 text-indigo-700 border-indigo-200',
  delivered:     'bg-teal-100 text-teal-700 border-teal-200',
  cancelled:     'bg-red-100 text-red-700 border-red-200',
};

const GENDER_GRADIENT = {
  male:   'from-blue-600 to-indigo-600',
  female: 'from-pink-500 to-rose-500',
  other:  'from-slate-600 to-gray-700',
};

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
    <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon className="h-4 w-4 text-gray-500" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-gray-800 mt-0.5 break-words">{value || '—'}</p>
    </div>
  </div>
);

export default function PatientDetails() {
  const { id: patientMongoId } = useParams();
  const [patient, setPatient]         = useState(null);
  const [reports, setReports]         = useState([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState(null);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError]     = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!patientMongoId) return;
      setIsLoading(true); setReportsLoading(true);
      setError(null); setPatient(null); setReports([]);
      try {
        const { default: api } = await import('../../utils/api');
        const patientData = await api.patients.getById(patientMongoId);
        setPatient(patientData);
        if (patientData?.patientId) {
          try {
            const res = await api.reports.getByPatientId(patientData.patientId);
            setReports(res.data || []);
          } catch (e) { setReportsError(e.message || 'Failed to fetch reports'); }
        }
      } catch (e) { setError(e.message || 'Failed to fetch patient details'); }
      finally { setIsLoading(false); setReportsLoading(false); }
    };
    load();
  }, [patientMongoId]);

  /* ── Loading ── */
  if (isLoading) return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <div className="h-40 rounded-2xl bg-gray-100 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-52 rounded-xl bg-gray-100 animate-pulse" />
        <div className="h-52 rounded-xl bg-gray-100 animate-pulse" />
      </div>
      <div className="h-64 rounded-xl bg-gray-100 animate-pulse" />
    </div>
  );

  /* ── Error ── */
  if (error && !patient) return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
        <ExclamationCircleIcon className="h-5 w-5 text-red-500 shrink-0" />
        <p className="text-sm text-red-700">{error}</p>
      </div>
      <Link to="/patients" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900">
        <ArrowLeftIcon className="h-4 w-4" /> Back to Patients
      </Link>
    </div>
  );

  if (!patient) return null;

  const initials = (patient.fullName || 'P')
    .split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  const gradient = GENDER_GRADIENT[patient.gender] || GENDER_GRADIENT.other;
  const totalReports   = reports.length;
  const lastReport     = reports[0];
  const pendingReports = reports.filter(r => r.status === 'pending').length;
  const completedReports = reports.filter(r => ['completed','verified','delivered'].includes(r.status)).length;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">

      {/* ── Header banner ── */}
      <div className={`rounded-2xl bg-gradient-to-r ${gradient} px-6 py-6 shadow-sm`}>
        {/* Back */}
        <Link to="/patients" className="inline-flex items-center gap-1.5 text-xs font-medium text-white/70 hover:text-white mb-4 transition-colors">
          <ArrowLeftIcon className="h-3.5 w-3.5" /> Back to Patients
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Avatar */}
          <div className="h-20 w-20 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-2xl font-bold text-white">{initials}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white leading-tight">{patient.fullName}</h1>
            <p className="text-white/70 text-sm mt-0.5 font-mono">{patient.patientId || 'No ID'}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {patient.age && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 text-white">
                  {patient.age} years
                </span>
              )}
              {patient.gender && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 text-white capitalize">
                  {patient.gender}
                </span>
              )}
              {patient.phone && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 text-white">
                  <PhoneIcon className="h-3 w-3" /> {patient.phone}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 flex-shrink-0">
            <Link
              to={`/patients/${patient._id}/edit`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <PencilIcon className="h-4 w-4" /> Edit
            </Link>
            <Link
              to={`/reports/create?patientId=${patient._id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white text-gray-800 text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
            >
              <PlusIcon className="h-4 w-4" /> New Report
            </Link>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            { label: 'Total Reports', value: totalReports },
            { label: 'Pending',       value: pendingReports },
            { label: 'Completed',     value: completedReports },
          ].map(s => (
            <div key={s.label} className="bg-white/15 rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-white/70 font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Info cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Contact */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg bg-blue-100 flex items-center justify-center">
              <PhoneIcon className="h-4 w-4 text-blue-600" />
            </div>
            <h2 className="text-sm font-bold text-gray-800">Contact Information</h2>
          </div>
          <InfoRow icon={PhoneIcon}   label="Phone"   value={patient.phone} />
          <InfoRow icon={EnvelopeIcon} label="Email"  value={patient.email} />
          <InfoRow icon={MapPinIcon}  label="Address" value={patient.address} />
        </div>

        {/* Medical */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg bg-purple-100 flex items-center justify-center">
              <UserIcon className="h-4 w-4 text-purple-600" />
            </div>
            <h2 className="text-sm font-bold text-gray-800">Patient Details</h2>
          </div>
          <InfoRow icon={UserIcon}    label="Full Name"    value={`${patient.designation || ''} ${patient.fullName || ''}`.trim()} />
          <InfoRow icon={CalendarIcon} label="Age"         value={patient.age ? `${patient.age} years` : null} />
          <InfoRow icon={UserIcon}    label="Gender"       value={<span className="capitalize">{patient.gender}</span>} />
          <InfoRow icon={CalendarIcon} label="Registered"  value={patient.createdAt ? formatDate(patient.createdAt, DATE_FORMATS.DD_MM_YYYY) : null} />
          {patient.lastTestType && (
            <InfoRow icon={BeakerIcon} label="Last Test"   value={patient.lastTestType} />
          )}
        </div>
      </div>

      {/* ── Reports ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <DocumentTextIcon className="h-4 w-4 text-blue-500" />
            Reports
            {totalReports > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">{totalReports}</span>
            )}
          </h2>
          <Link
            to={`/reports/create?patientId=${patient._id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-3.5 w-3.5" /> New Report
          </Link>
        </div>

        {/* Loading */}
        {reportsLoading && (
          <div className="p-5 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gray-100 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-gray-100 rounded w-1/3 animate-pulse" />
                  <div className="h-3 bg-gray-100 rounded w-1/4 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {reportsError && !reportsLoading && (
          <div className="flex items-center gap-2 m-5 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            <ExclamationCircleIcon className="h-4 w-4 flex-shrink-0" />
            {reportsError}
          </div>
        )}

        {/* Empty */}
        {!reportsLoading && !reportsError && reports.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <DocumentTextIcon className="h-7 w-7 text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-700">No reports yet</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">Create the first report for this patient</p>
            <Link
              to={`/reports/create?patientId=${patient._id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4" /> Create Report
            </Link>
          </div>
        )}

        {/* Reports list */}
        {!reportsLoading && !reportsError && reports.length > 0 && (
          <div className="divide-y divide-gray-50">
            {reports.map((report, idx) => {
              const statusStyle = STATUS_STYLES[report.status] || 'bg-gray-100 text-gray-600 border-gray-200';
              const testName = report.testInfo?.name || `Report #${report.reportId || idx + 1}`;
              const date = formatDate(report.testInfo?.sampleCollectionDate || report.createdAt, DATE_FORMATS.DD_MM_YYYY);
              return (
                <div key={report._id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 transition-colors group">
                  {/* Icon */}
                  <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <BeakerIcon className="h-5 w-5 text-blue-500" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/reports/${report._id}`}
                      className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate block"
                    >
                      {testName}
                    </Link>
                    <p className="text-xs text-gray-400 mt-0.5">{date}</p>
                  </div>

                  {/* Status */}
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize flex-shrink-0 ${statusStyle}`}>
                    {report.status || 'N/A'}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Link
                      to={`/reports/${report._id}`}
                      title="View"
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-blue-500 bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Link>
                    <Link
                      to={`/reports/${report._id}/print`}
                      target="_blank"
                      title="Print"
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      <PrinterIcon className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
