import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BeakerIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/helpers';
import { DATE_FORMATS } from '../../utils/constants';
import {
  FormShell, FormSection, FormGrid, FormField,
  Input, Select, Alert, FormActions,
} from '../../components/common/FormShell';

const API = import.meta.env.VITE_API_BASE_URL;
const authFetch = (url, opts = {}) => fetch(url, {
  ...opts,
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}`, ...opts.headers },
}).then(r => r.json());

export default function EditLab() {
  const { id: labId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super-admin';

  const [labData, setLabData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: { street: '', city: '', state: '', zipCode: '', country: '' },
    contact: { phone: '', email: '' },
  });
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [planError, setPlanError] = useState('');
  const [planSuccess, setPlanSuccess] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [labRes, histRes] = await Promise.all([
        authFetch(`${API}/lab-management/${labId}`),
        authFetch(`${API}/lab-management/${labId}/subscription-history`),
      ]);
      if (labRes.success) {
        const lab = labRes.data;
        setLabData(lab);
        setFormData({ name: lab.name || '', address: lab.address || { street:'',city:'',state:'',zipCode:'',country:'' }, contact: lab.contact || { phone:'',email:'' } });
        if (lab.subscription?.plan) setSelectedPlan(lab.subscription.plan._id || lab.subscription.plan);
      } else setError(labRes.message || 'Failed to load lab');

      if (histRes.success) setHistory(histRes.data || []);

      if (isSuperAdmin) {
        const plansRes = await authFetch(`${API}/plans`);
        if (plansRes.success) setPlans(plansRes.data || []);
      }
    } catch { setError('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, [labId]);

  const setAddr = (k, v) => setFormData(p => ({ ...p, address: { ...p.address, [k]: v } }));
  const setContact = (k, v) => setFormData(p => ({ ...p, contact: { ...p.contact, [k]: v } }));

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError(''); setSuccess('');
    try {
      const res = await authFetch(`${API}/lab-management/${labId}`, { method: 'PUT', body: JSON.stringify(formData) });
      if (res.success) { setSuccess('Lab updated successfully!'); setLabData(res.data); setTimeout(() => setSuccess(''), 3000); }
      else setError(res.message || 'Failed to update lab');
    } catch { setError('Failed to update lab'); }
    finally { setSubmitting(false); }
  };

  const handleAssignPlan = async () => {
    if (!selectedPlan) { setPlanError('Select a plan first.'); return; }
    setAssigning(true); setPlanError(''); setPlanSuccess('');
    try {
      const res = await authFetch(`${API}/lab-management/${labId}/assign-plan`, { method: 'POST', body: JSON.stringify({ planId: selectedPlan }) });
      if (res.success) { setPlanSuccess(res.message || 'Plan assigned!'); loadAll(); setTimeout(() => setPlanSuccess(''), 4000); }
      else setPlanError(res.message || 'Failed to assign plan');
    } catch { setPlanError('Failed to assign plan'); }
    finally { setAssigning(false); }
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-4">
      {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-10 rounded-lg" />)}
    </div>
  );

  if (error && !labData) return (
    <div className="max-w-3xl mx-auto py-6 px-4"><Alert type="error">{error}</Alert></div>
  );

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-5 page-enter">

      {/* Lab info form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <BeakerIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-900">Edit Lab — {labData?.name}</h1>
            <p className="text-xs text-slate-500 mt-0.5">Update lab information</p>
          </div>
          <button type="button" onClick={() => navigate('/labs')} className="ml-auto btn btn-secondary btn-sm">← Labs</button>
        </div>

        <form onSubmit={handleInfoSubmit}>
          <div className="px-6 py-5 space-y-4">
            {error && <Alert type="error">{error}</Alert>}
            {success && <Alert type="success">{success}</Alert>}

            <FormField label="Lab Name" required>
              <Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} required />
            </FormField>

            <FormGrid cols={2}>
              <FormField label="Phone">
                <Input type="tel" value={formData.contact.phone}
                  onChange={(e) => setContact('phone', e.target.value.replace(/\D/g,'').slice(0,10))} inputMode="numeric" maxLength={10} />
              </FormField>
              <FormField label="Email">
                <Input type="email" value={formData.contact.email} onChange={(e) => setContact('email', e.target.value)} />
              </FormField>
            </FormGrid>

            <FormField label="Street">
              <Input value={formData.address.street} onChange={(e) => setAddr('street', e.target.value)} />
            </FormField>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <FormField label="City"><Input value={formData.address.city} onChange={(e) => setAddr('city', e.target.value)} /></FormField>
              <FormField label="State"><Input value={formData.address.state} onChange={(e) => setAddr('state', e.target.value)} /></FormField>
              <FormField label="Zip"><Input value={formData.address.zipCode} onChange={(e) => setAddr('zipCode', e.target.value)} /></FormField>
              <FormField label="Country"><Input value={formData.address.country} onChange={(e) => setAddr('country', e.target.value)} /></FormField>
            </div>
          </div>
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? <><span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Subscription plan assignment — super-admin only */}
      {isSuperAdmin && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
            <CreditCardIcon className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-900">Subscription Plan</h2>
          </div>
          <div className="px-6 py-5">
            {planError && <Alert type="error">{planError}</Alert>}
            {planSuccess && <Alert type="success">{planSuccess}</Alert>}

            {labData?.subscription?.plan && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm">
                <span className="font-medium text-blue-800">Current plan:</span>
                <span className="ml-2 text-blue-700">{labData.subscription.plan.name || 'Active Plan'}</span>
                {labData.subscriptionExpiry && (
                  <span className="ml-3 text-slate-500">· Expires {formatDate(labData.subscriptionExpiry, DATE_FORMATS.DISPLAY)}</span>
                )}
              </div>
            )}

            <div className="flex gap-3 items-end">
              <FormField label="Assign New Plan">
                <Select value={selectedPlan} onChange={(e) => setSelectedPlan(e.target.value)}>
                  <option value="">Select a plan</option>
                  {plans.map(p => <option key={p._id} value={p._id}>{p.name} — ₹{p.price}/mo</option>)}
                </Select>
              </FormField>
              <button type="button" onClick={handleAssignPlan} disabled={assigning} className="btn btn-primary mb-0.5">
                {assigning ? 'Assigning…' : 'Assign'}
              </button>
            </div>

            {/* Subscription history */}
            {history.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Subscription History</p>
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Plan</th><th>Started</th><th>Expires</th><th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.slice(0, 5).map((h, i) => (
                        <tr key={i}>
                          <td>{h.planName || h.plan?.name || '—'}</td>
                          <td>{h.startDate ? formatDate(h.startDate, DATE_FORMATS.DISPLAY) : '—'}</td>
                          <td>{h.endDate ? formatDate(h.endDate, DATE_FORMATS.DISPLAY) : '—'}</td>
                          <td><span className={`badge ${h.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{h.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
