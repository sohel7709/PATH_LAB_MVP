import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { reports } from '../../utils/api';
import { REPORT_STATUS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import { isOutsideRange } from '../../utils/reportUtils';

const DESIGNATIONS = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Master', 'Miss'];

const STATUS_OPTIONS = [
  { value: REPORT_STATUS.PENDING,     label: 'Pending',     color: 'border-yellow-400 bg-yellow-50 text-yellow-700' },
  { value: REPORT_STATUS.IN_PROGRESS, label: 'In Progress', color: 'border-blue-400 bg-blue-50 text-blue-700' },
  { value: REPORT_STATUS.COMPLETED,   label: 'Completed',   color: 'border-green-400 bg-green-50 text-green-700' },
  { value: REPORT_STATUS.VERIFIED,    label: 'Verified',    color: 'border-indigo-400 bg-indigo-50 text-indigo-700' },
  { value: REPORT_STATUS.DELIVERED,   label: 'Delivered',   color: 'border-teal-400 bg-teal-50 text-teal-700' },
];

const inputCls = 'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder-gray-400';
const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5';

const SectionCard = ({ title, icon, children }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-50 bg-gray-50/60">
      {icon && <span className="text-base">{icon}</span>}
      <h2 className="text-sm font-bold text-gray-800">{title}</h2>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

export default function EditReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isLoading, setIsLoading]   = useState(true);
  const [isSaving, setIsSaving]     = useState(false);
  const [error, setError]           = useState('');
  const [patientName, setPatientName] = useState('');

  const [formData, setFormData] = useState({
    patientDesignation: '', patientName: '', patientAge: '', patientGender: '',
    patientPhone: '', patientId: '',
    testName: '', category: '', collectionDate: '', price: '', status: '', notes: '',
    testParameters: [],
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await reports.getById(id);
        const d = res.data || res;
        const name = d.patientName || d.patientInfo?.name || '';
        setPatientName(name);
        setFormData({
          patientDesignation: d.patientInfo?.designation || '',
          patientName: name,
          patientAge:  d.patientInfo?.age || '',
          patientGender: d.patientInfo?.gender || '',
          patientPhone: d.patientInfo?.contact?.phone || '',
          patientId:   d.patientInfo?.patientId || '',
          testName:    d.testInfo?.name || '',
          category:    d.testInfo?.category || '',
          collectionDate: d.testInfo?.sampleCollectionDate
            ? new Date(d.testInfo.sampleCollectionDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          price:  d.testInfo?.price || '',
          status: d.status || REPORT_STATUS.PENDING,
          notes:  d.notes || d.testNotes || '',
          testParameters: d.results?.length
            ? d.results.map(r => ({
                name: r.parameter || r.name || '',
                value: r.value || '',
                unit: r.unit || '',
                referenceRange: r.referenceRange || '',
                isHeader: r.isHeader || false,
                isSubparameter: r.isSubparameter || false,
              }))
            : [{ name: '', value: '', unit: '', referenceRange: '', isHeader: false }],
        });
      } catch (err) {
        setError(err.message || 'Failed to load report');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  const set = (k, v) => setFormData(p => ({ ...p, [k]: v }));
  const setParam = (i, k, v) =>
    setFormData(p => { const t = [...p.testParameters]; t[i] = { ...t[i], [k]: v }; return { ...p, testParameters: t }; });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true); setError('');
    try {
      await reports.update(id, {
        patientInfo: {
          designation: formData.patientDesignation,
          name: formData.patientName,
          age: parseInt(formData.patientAge, 10),
          gender: formData.patientGender,
          contact: { phone: formData.patientPhone },
          patientId: formData.patientId,
        },
        testInfo: {
          name: formData.testName,
          category: formData.category,
          price: parseFloat(formData.price) || 0,
          sampleCollectionDate: formData.collectionDate,
          sampleType: formData.sampleType || 'blood',
          sampleId: formData.sampleId || `SMP-${Date.now().toString().slice(-6)}`,
        },
        status: formData.status,
        testNotes: formData.notes,
        results: formData.testParameters.map(p => ({
          parameter: p.name,
          value: p.value,
          unit: p.unit,
          referenceRange: p.referenceRange,
          isHeader: p.isHeader || false,
          isSubparameter: p.isSubparameter || false,
          flag: isOutsideRange(p.value, p.referenceRange, formData.patientGender) ? 'abnormal' : 'normal',
        })),
      });
      navigate(`/reports/${id}/print`);
    } catch (err) {
      setError(err.message || 'Failed to update report');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSaving(false);
    }
  };

  /* ── Loading ── */
  if (isLoading) return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <div className="h-20 rounded-2xl bg-gray-100 animate-pulse" />
      {[...Array(3)].map((_, i) => <div key={i} className="h-48 rounded-xl bg-gray-100 animate-pulse" />)}
    </div>
  );

  const abnormalParams = formData.testParameters.filter(
    p => !p.isHeader && p.value && isOutsideRange(p.value, p.referenceRange, formData.patientGender)
  );

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">

      {/* ── Header ── */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 shadow-sm">
        <div className="flex items-center gap-3 mb-1">
          <Link to={`/reports/${id}`} className="text-blue-200 hover:text-white transition-colors">
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
          <span className="text-blue-200 text-sm">Back to report</span>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <div className="h-11 w-11 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <CheckCircleIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Edit Report</h1>
            <p className="text-sm text-blue-100 mt-0.5">{patientName || 'Loading…'}</p>
          </div>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Status ── */}
        <SectionCard title="Report Status" icon="📋">
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => set('status', s.value)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                  formData.status === s.value
                    ? `${s.color} ring-2 ring-offset-1 ring-current shadow-sm`
                    : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:bg-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </SectionCard>

        {/* ── Patient info ── */}
        <SectionCard title="Patient Information" icon="👤">
          <div className="grid grid-cols-2 sm:grid-cols-12 gap-4">
            <div className="col-span-1 sm:col-span-2">
              <label className={labelCls}>Title</label>
              <select value={formData.patientDesignation} onChange={e => set('patientDesignation', e.target.value)} className={inputCls}>
                <option value="">—</option>
                {DESIGNATIONS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="col-span-1 sm:col-span-4">
              <label className={labelCls}>Full Name <span className="text-red-500">*</span></label>
              <input required value={formData.patientName} onChange={e => set('patientName', e.target.value)} placeholder="Patient name" className={inputCls} />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <label className={labelCls}>Age</label>
              <input type="number" min="0" max="150" value={formData.patientAge} onChange={e => set('patientAge', e.target.value)} placeholder="Age" className={inputCls} />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <label className={labelCls}>Gender</label>
              <select value={formData.patientGender} onChange={e => set('patientGender', e.target.value)} className={inputCls}>
                <option value="">—</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="col-span-1 sm:col-span-2">
              <label className={labelCls}>Phone</label>
              <input value={formData.patientPhone} onChange={e => set('patientPhone', e.target.value)} placeholder="+91…" className={inputCls} />
            </div>
          </div>
        </SectionCard>

        {/* ── Results ── */}
        <SectionCard
          title={`Test Results${abnormalParams.length > 0 ? ` · ${abnormalParams.length} abnormal` : ''}`}
          icon="🧪"
        >
          {abnormalParams.length > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4 text-xs text-amber-700 font-medium">
              <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
              {abnormalParams.map(p => p.name).join(', ')} — outside reference range
            </div>
          )}

          <div className="overflow-x-auto -mx-5 px-5">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pr-4 min-w-[160px]">Parameter</th>
                  <th className="pb-2 text-left text-xs font-semibold text-blue-500 uppercase tracking-wide pr-4 min-w-[120px]">Result ✎</th>
                  <th className="pb-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pr-4 w-24">Unit</th>
                  <th className="pb-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide w-40">Reference</th>
                  <th className="pb-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide w-28">Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {formData.testParameters.map((param, i) => {
                  if (param.isHeader) return (
                    <tr key={i} className="bg-gray-50/70">
                      <td colSpan={5} className="py-2 px-0">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{param.name}</span>
                      </td>
                    </tr>
                  );
                  const abnormal = !param.isHeader && param.value &&
                    isOutsideRange(param.value, param.referenceRange, formData.patientGender);
                  return (
                    <tr key={i} className={abnormal ? 'bg-amber-50/60' : ''}>
                      <td className={`py-2 pr-4 text-sm font-medium ${param.isSubparameter ? 'pl-4 text-gray-600' : 'text-gray-800'}`}>
                        {param.name}
                      </td>
                      <td className="py-1.5 pr-4">
                        <input
                          value={param.value}
                          onChange={e => setParam(i, 'value', e.target.value)}
                          placeholder="Enter result"
                          autoFocus={i === 0}
                          className={`w-full px-3 py-1.5 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2 ${
                            abnormal
                              ? 'border-amber-400 bg-amber-50 text-amber-800 font-bold focus:border-amber-500 focus:ring-amber-100'
                              : 'border-gray-200 bg-white focus:border-blue-400 focus:ring-blue-100'
                          }`}
                        />
                      </td>
                      <td className="py-2 pr-4 text-xs text-gray-500">{param.unit || '—'}</td>
                      <td className="py-2 pr-4 text-xs text-gray-500 whitespace-pre-line">{param.referenceRange || '—'}</td>
                      <td className="py-2">
                        {abnormal ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">
                            ⚠ Abnormal
                          </span>
                        ) : param.value ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 border border-green-200 rounded-full text-xs font-semibold">
                            ✓ Normal
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* ── Notes ── */}
        <SectionCard title="Notes" icon="📝">
          <label className={labelCls}>General notes <span className="font-normal text-gray-400 normal-case tracking-normal">(optional — printed at bottom of report)</span></label>
          <textarea
            rows={3}
            value={formData.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Add any clinical notes or observations…"
            className={`${inputCls} resize-y`}
          />
        </SectionCard>

        {/* ── Actions ── */}
        <div className="flex items-center justify-between gap-3 pt-1 pb-6">
          <Link
            to={`/reports/${id}`}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" /> Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {isSaving ? (
              <><span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
            ) : (
              <><CheckCircleIcon className="h-4 w-4" /> Save &amp; Go to Print</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
