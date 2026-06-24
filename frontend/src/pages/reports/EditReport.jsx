import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { reports } from '../../utils/api';
import { REPORT_STATUS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import { isOutsideRange } from '../../utils/reportUtils';
import {
  FormShell, FormSection, FormGrid, FormField,
  Input, Select, Textarea, Alert, FormActions,
} from '../../components/common/FormShell';

const DESIGNATIONS = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Master', 'Miss'];
const STATUS_OPTIONS = [
  { value: REPORT_STATUS.PENDING,     label: 'Pending' },
  { value: REPORT_STATUS.IN_PROGRESS, label: 'In Progress' },
  { value: REPORT_STATUS.COMPLETED,   label: 'Completed' },
  { value: REPORT_STATUS.VERIFIED,    label: 'Verified' },
  { value: REPORT_STATUS.DELIVERED,   label: 'Delivered' },
];

export default function EditReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super-admin';

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

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
        setFormData({
          patientDesignation: d.patientInfo?.designation || '',
          patientName: d.patientName || d.patientInfo?.name || '',
          patientAge: d.patientAge || d.patientInfo?.age || '',
          patientGender: d.patientGender || d.patientInfo?.gender || '',
          patientPhone: d.patientPhone || d.patientInfo?.contact?.phone || '',
          patientId: d.patientInfo?.patientId || '',
          testName: d.testName || d.testInfo?.name || '',
          category: d.category || d.testInfo?.category || '',
          collectionDate: d.collectionDate || (d.testInfo?.sampleCollectionDate
            ? new Date(d.testInfo.sampleCollectionDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0]),
          price: d.price || d.testInfo?.price || '',
          status: d.status || REPORT_STATUS.PENDING,
          notes: d.notes || '',
          testParameters: d.testParameters || (d.results?.length
            ? d.results.map(r => ({ name: r.parameter || '', value: r.value || '', unit: r.unit || '', referenceRange: r.referenceRange || '' }))
            : [{ name: '', value: '', unit: '', referenceRange: '' }]),
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
        notes: formData.notes,
        results: formData.testParameters.map(p => ({
          parameter: p.name, value: p.value, unit: p.unit, referenceRange: p.referenceRange,
          flag: isOutsideRange(p.value, p.referenceRange, formData.patientGender) ? 'abnormal' : 'normal',
        })),
      });
      navigate(`/reports/${id}/print`);
    } catch (err) {
      setError(err.message || 'Failed to update report');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-4">
      {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-10 rounded-lg" />)}
    </div>
  );

  return (
    <FormShell icon={DocumentTextIcon} title="Edit Report" subtitle="Update test results and report status" backTo={`/reports/${id}`}>
      <form onSubmit={handleSubmit}>

        {/* Status — most important, shown first */}
        <FormSection title="Status">
          {error && <Alert type="error">{error}</Alert>}
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map(s => (
              <button key={s.value} type="button" onClick={() => set('status', s.value)}
                className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  formData.status === s.value
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-200 text-slate-700 hover:border-blue-300'
                }`}>
                {s.label}
              </button>
            ))}
          </div>
        </FormSection>

        {/* Patient info — read-mostly */}
        <FormSection title="Patient Information">
          <div className="grid grid-cols-2 sm:grid-cols-12 gap-3">
            <div className="col-span-1 sm:col-span-2">
              <FormField label="Title">
                <Select value={formData.patientDesignation} onChange={(e) => set('patientDesignation', e.target.value)}>
                  <option value="">—</option>
                  {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </Select>
              </FormField>
            </div>
            <div className="col-span-1 sm:col-span-4">
              <FormField label="Patient Name" required>
                <Input value={formData.patientName} onChange={(e) => set('patientName', e.target.value)} required />
              </FormField>
            </div>
            <div className="col-span-1 sm:col-span-2">
              <FormField label="Age">
                <Input type="number" value={formData.patientAge} onChange={(e) => set('patientAge', e.target.value)} min="0" max="150" />
              </FormField>
            </div>
            <div className="col-span-1 sm:col-span-2">
              <FormField label="Gender">
                <Select value={formData.patientGender} onChange={(e) => set('patientGender', e.target.value)}>
                  <option value="">—</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </Select>
              </FormField>
            </div>
            <div className="col-span-1 sm:col-span-2">
              <FormField label="Phone">
                <Input value={formData.patientPhone} onChange={(e) => set('patientPhone', e.target.value)} />
              </FormField>
            </div>
          </div>
        </FormSection>

        {/* Test Parameters — the main editing area */}
        <FormSection title="Test Results">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-2 px-3 font-medium text-slate-600">Parameter</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-600 w-36">
                    Result <span className="text-blue-600">(editable)</span>
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-slate-600 w-24">Unit</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-600 w-36">Ref. Range</th>
                  <th className="w-16 text-center py-2 px-3 font-medium text-slate-600">Flag</th>
                </tr>
              </thead>
              <tbody>
                {formData.testParameters.map((param, i) => {
                  const abnormal = isOutsideRange(param.value, param.referenceRange, formData.patientGender);
                  return (
                    <tr key={i} className={`border-b border-slate-100 ${abnormal ? 'bg-amber-50' : 'hover:bg-slate-50'}`}>
                      <td className="py-2 px-3 text-slate-700 font-medium">{param.name}</td>
                      <td className="py-1.5 px-2">
                        <Input
                          value={param.value}
                          onChange={(e) => setParam(i, 'value', e.target.value)}
                          className={abnormal ? 'border-amber-400 font-bold' : ''}
                          placeholder="Enter result"
                          autoFocus={i === 0}
                        />
                      </td>
                      <td className="py-2 px-3 text-slate-500 text-xs">{param.unit}</td>
                      <td className="py-2 px-3 text-slate-500 text-xs">{param.referenceRange}</td>
                      <td className="py-2 px-3 text-center">
                        {abnormal ? (
                          <span className="badge badge-yellow">⚠ Abnormal</span>
                        ) : param.value ? (
                          <span className="badge badge-green">✓ Normal</span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </FormSection>

        {/* Notes */}
        <FormSection title="Notes">
          <FormField label="General Notes" hint="optional — printed at bottom of report">
            <Textarea rows={3} placeholder="Add any clinical notes or observations…"
              value={formData.notes} onChange={(e) => set('notes', e.target.value)} />
          </FormField>
        </FormSection>

        <FormActions
          onCancel={() => navigate(`/reports/${id}`)}
          submitLabel="Save & Go to Print"
          loadingLabel="Saving…"
          loading={isSaving}
        />
      </form>
    </FormShell>
  );
}
