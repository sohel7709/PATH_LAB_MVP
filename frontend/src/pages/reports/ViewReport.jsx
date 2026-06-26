import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  PrinterIcon, PencilIcon, DocumentTextIcon,
  ArrowDownTrayIcon, ArrowLeftIcon, BeakerIcon,
  ExclamationTriangleIcon, ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { reports } from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import { REPORT_STATUS } from '../../utils/constants';
import { isOutsideRange } from '../../utils/reportUtils';

const STATUS_STYLES = {
  pending:       'bg-yellow-100 text-yellow-700 border-yellow-300',
  'in-progress': 'bg-blue-100 text-blue-700 border-blue-300',
  completed:     'bg-green-100 text-green-700 border-green-300',
  verified:      'bg-indigo-100 text-indigo-700 border-indigo-300',
  delivered:     'bg-teal-100 text-teal-700 border-teal-300',
  cancelled:     'bg-red-100 text-red-700 border-red-300',
};

const AVATAR_COLORS = ['bg-blue-500','bg-indigo-500','bg-violet-500','bg-pink-500','bg-teal-500','bg-orange-500'];
const avatarColor = (name = '') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const DetailRow = ({ label, value }) => (
  <div className="flex items-start justify-between py-2.5 border-b border-gray-50 last:border-0">
    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-36 flex-shrink-0">{label}</span>
    <span className="text-sm font-medium text-gray-800 text-right">{value || '—'}</span>
  </div>
);

const WaIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function ViewReport() {
  const { id } = useParams();
  const [report, setReport]       = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [editedStatus, setEditedStatus] = useState('');
  const [resending, setResending] = useState(null);
  const [resendResult, setResendResult] = useState(null);

  useEffect(() => { fetchReport(); }, [id]);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const res = await reports.getById(id);
      const d = res.data || res;
      setReport(d);
      setEditedStatus(d.status);
      setError('');
    } catch (err) { setError(err.message); }
    finally { setIsLoading(false); }
  };

  const handleStatusSave = async (newStatus) => {
    try {
      setSavingStatus(true);
      await reports.update(id, { status: newStatus });
      setReport(prev => ({ ...prev, status: newStatus }));
      setEditedStatus(newStatus);
    } catch (err) { setError(err.message); }
    finally { setSavingStatus(false); }
  };

  const handleResend = async (target) => {
    try {
      setResending(target);
      setResendResult(null);
      const res = await reports.resendWhatsApp(id, target);
      setResendResult({ ok: true, data: res.data });
      fetchReport();
    } catch (err) {
      setResendResult({ ok: false, message: err.message || 'Failed to send' });
    } finally { setResending(null); }
  };

  /* ── Loading ── */
  if (isLoading) return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <div className="h-36 rounded-2xl bg-gray-100 animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => <div key={i} className="h-48 rounded-xl bg-gray-100 animate-pulse" />)}
      </div>
      <div className="h-64 rounded-xl bg-gray-100 animate-pulse" />
    </div>
  );

  /* ── Error ── */
  if (error && !report) return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
        <ExclamationCircleIcon className="h-5 w-5 text-red-500 shrink-0" />
        <p className="text-sm text-red-700">{error}</p>
      </div>
      <Link to="/reports" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900">
        <ArrowLeftIcon className="h-4 w-4" /> Back to Reports
      </Link>
    </div>
  );

  if (!report) return null;

  const patientName = report.patientInfo?.name || 'Unknown Patient';
  const testName    = report.testInfo?.name    || 'Unknown Test';
  const abnormalCount = (report.results || []).filter(p =>
    isOutsideRange(p.value, p.referenceRange, report.patientInfo?.gender)
  ).length;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">

      {/* ── Header banner ── */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-800 to-blue-900 px-6 py-5 shadow-sm print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`h-14 w-14 rounded-2xl ${avatarColor(patientName)} flex items-center justify-center flex-shrink-0 shadow-sm`}>
              <span className="text-xl font-bold text-white">{patientName.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">{patientName}</h1>
              <p className="text-sm text-slate-300 mt-0.5">{testName}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${STATUS_STYLES[report.status] || 'bg-gray-100 text-gray-600 border-gray-300'}`}>
                  {report.status}
                </span>
                {abnormalCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-200 border border-red-400/30">
                    <ExclamationTriangleIcon className="h-3 w-3" />
                    {abnormalCount} abnormal
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/reports/${id}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white text-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-100 transition-colors"
            >
              <PencilIcon className="h-3.5 w-3.5" /> Edit
            </Link>
            <Link
              to={`/reports/${id}/print`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/15 text-white text-xs font-semibold rounded-lg hover:bg-white/25 transition-colors"
            >
              <PrinterIcon className="h-3.5 w-3.5" /> Print
            </Link>
            <a
              href={`/api/reports/${id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/15 text-white text-xs font-semibold rounded-lg hover:bg-white/25 transition-colors"
            >
              <ArrowDownTrayIcon className="h-3.5 w-3.5" /> PDF
            </a>
            <Link
              to="/reports"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/10 text-white/80 text-xs font-semibold rounded-lg hover:bg-white/20 transition-colors"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" /> Back
            </Link>
          </div>
        </div>
      </div>

      {/* ── Inline error ── */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <ExclamationCircleIcon className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* ── Status changer ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 print:hidden">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Update Status</p>
        <div className="flex flex-wrap gap-2">
          {Object.values(REPORT_STATUS).map(s => (
            <button
              key={s}
              onClick={() => handleStatusSave(s)}
              disabled={savingStatus}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize disabled:opacity-50 ${
                (editedStatus || report.status) === s
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-white'
              }`}
            >
              {savingStatus && (editedStatus || report.status) === s ? (
                <span className="flex items-center gap-1">
                  <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving…
                </span>
              ) : s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Patient + Test info ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Patient */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className={`h-9 w-9 rounded-full ${avatarColor(patientName)} flex items-center justify-center flex-shrink-0`}>
              <span className="text-sm font-bold text-white">{patientName.charAt(0).toUpperCase()}</span>
            </div>
            <h2 className="text-sm font-bold text-gray-800">Patient Information</h2>
          </div>
          <DetailRow label="Patient ID"  value={<span className="font-mono text-blue-600 text-xs">{report.patientInfo?.patientId}</span>} />
          <DetailRow label="Full Name"   value={`${report.patientInfo?.designation || ''} ${patientName}`.trim()} />
          <DetailRow label="Age"         value={report.patientInfo?.age ? `${report.patientInfo.age} years` : null} />
          <DetailRow label="Gender"      value={<span className="capitalize">{report.patientInfo?.gender}</span>} />
          <DetailRow label="Phone"       value={report.patientInfo?.contact?.phone} />
          <DetailRow label="Address"     value={report.patientInfo?.contact?.address} />
        </div>

        {/* Test */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <BeakerIcon className="h-4.5 w-4.5 text-blue-600" />
            </div>
            <h2 className="text-sm font-bold text-gray-800">Test &amp; Sample Details</h2>
          </div>
          <DetailRow label="Test Name"       value={<span className="font-semibold">{report.testInfo?.name}</span>} />
          <DetailRow label="Category"        value={<span className="capitalize">{report.testInfo?.category}</span>} />
          <DetailRow label="Sample Type"     value={report.testInfo?.sampleType} />
          <DetailRow label="Sample ID"       value={<span className="font-mono text-xs">{report.testInfo?.sampleId}</span>} />
          <DetailRow label="Collection Date" value={formatDate(report.testInfo?.sampleCollectionDate)} />
          <DetailRow label="Ref. Doctor"     value={report.testInfo?.referenceDoctor} />
          <DetailRow label="Price"           value={report.testInfo?.price ? `₹${report.testInfo.price}` : null} />
        </div>
      </div>

      {/* ── Results table ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <BeakerIcon className="h-4 w-4 text-blue-500" />
            Test Results
          </h2>
          {abnormalCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-lg">
              <ExclamationTriangleIcon className="h-3.5 w-3.5" />
              {abnormalCount} abnormal value{abnormalCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {report.results?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-8">#</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Parameter</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Result</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Unit</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Reference Range</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {report.results.map((param, index) => {
                  if (param.isHeader) return (
                    <tr key={index} className="bg-gray-50">
                      <td colSpan={6} className="px-5 py-2">
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">{param.parameter || param.name}</span>
                      </td>
                    </tr>
                  );
                  const isAbnormal = isOutsideRange(param.value, param.referenceRange, report.patientInfo?.gender);
                  return (
                    <tr
                      key={index}
                      className={`transition-colors ${isAbnormal ? 'bg-red-50/60' : 'hover:bg-gray-50/60'}`}
                    >
                      <td className="px-5 py-3 text-xs text-gray-400">{index + 1}</td>
                      <td className="px-5 py-3">
                        <span className={`text-sm font-medium ${param.isSubparameter ? 'pl-4 text-gray-600' : 'text-gray-900'}`}>
                          {param.parameter || param.name}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-sm font-bold ${isAbnormal ? 'text-red-600' : 'text-gray-900'}`}>
                          {param.value || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">{param.unit || '—'}</td>
                      <td className="px-5 py-3 text-sm text-gray-500 whitespace-pre-line">{param.referenceRange || '—'}</td>
                      <td className="px-5 py-3">
                        {param.value ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                            isAbnormal
                              ? 'bg-red-100 text-red-700 border-red-200'
                              : 'bg-green-100 text-green-700 border-green-200'
                          }`}>
                            {isAbnormal ? '⚠ Abnormal' : '✓ Normal'}
                          </span>
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <BeakerIcon className="h-10 w-10 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No test parameters recorded</p>
          </div>
        )}
      </div>

      {/* ── WhatsApp Delivery ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden print:hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <WaIcon />
            </span>
            WhatsApp Delivery
          </h2>
          <button
            onClick={() => handleResend('both')}
            disabled={!!resending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {resending === 'both'
              ? <><span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending…</>
              : 'Resend to All'
            }
          </button>
        </div>

        {resendResult && (
          <div className={`mx-5 mt-4 flex items-center gap-2 text-sm px-3 py-2.5 rounded-lg ${resendResult.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {resendResult.ok
              ? <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              : <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            }
            {resendResult.ok ? 'Message sent successfully' : resendResult.message}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-5">
          {[
            {
              label: 'Patient',
              phone: report.patientInfo?.contact?.phone,
              delivery: report.reportMeta?.deliveryStatus?.whatsapp,
              target: 'patient',
            },
            {
              label: report.testInfo?.referenceDoctor || 'Referring Doctor',
              phone: report.reportMeta?.deliveryStatus?.whatsappDoctor?.recipient || 'From Doctors directory',
              delivery: report.reportMeta?.deliveryStatus?.whatsappDoctor,
              target: 'doctor',
            },
          ].map(({ label, phone, delivery, target }) => (
            <div key={target} className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 bg-gray-50/60">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{phone || 'No phone'}</p>
                {delivery?.sent && (
                  <p className="text-xs text-green-600 mt-0.5">
                    Sent {delivery.sentAt ? new Date(delivery.sentAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${delivery?.sent ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                  {delivery?.sent ? '✓ Sent' : 'Not sent'}
                </span>
                <button
                  onClick={() => handleResend(target)}
                  disabled={!!resending}
                  className="text-xs text-green-600 hover:text-green-700 font-semibold disabled:opacity-40 transition-colors"
                >
                  {resending === target ? '…' : 'Resend'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Notes ── */}
      {report.testNotes && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-800 mb-3">Notes</h2>
          <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{report.testNotes}</p>
        </div>
      )}
    </div>
  );
}
