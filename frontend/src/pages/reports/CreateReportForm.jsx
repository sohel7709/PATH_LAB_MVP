import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DocumentTextIcon, UserPlusIcon, MagnifyingGlassIcon,
  CheckCircleIcon, XMarkIcon, UserCircleIcon,
} from '@heroicons/react/24/outline';
import { reports, patients, doctors } from '../../utils/api';
import { REPORT_STATUS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import TestParametersForm from './TestParametersForm';
import SubscriptionRequiredModal from '../../components/subscription/SubscriptionRequiredModal';
import { Alert } from '../../components/common/FormShell';

const DESIGNATIONS = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Master', 'Miss'];
const SAMPLE_TYPES = ['Blood', 'Serum', 'Plasma', 'Urine', 'CSF', 'Stool', 'Sputum', 'Swab', 'Tissue', 'Other'];

const inputCls = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition';
const labelCls = 'block text-xs font-medium text-slate-600 mb-1';

export default function CreateReportForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const searchRef = useRef(null);

  // ── State ──────────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const patientListRef = useRef([]); // keep a sync ref so autoSelect can read latest list
  const [error, setError] = useState('');
  const [subscriptionModal, setSubscriptionModal] = useState(false);
  const [subscriptionErrorData, setSubscriptionErrorData] = useState(null);

  // Patient search
  const [patientList, setPatientList] = useState([]);
  const [doctorList, setDoctorList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Quick-add patient inline modal
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [addingPatient, setAddingPatient] = useState(false);
  const [addPatientError, setAddPatientError] = useState('');
  const [newPt, setNewPt] = useState({ designation: '', fullName: '', age: '', gender: '', phone: '' });

  // Report form
  const [formData, setFormData] = useState({
    patientId: '', patientName: '', patientAge: '', patientGender: '',
    patientDesignation: '', patientPhone: '',
    testName: '', category: '', sampleType: '', referenceDoctor: '',
    collectionDate: new Date().toISOString().split('T')[0],
    price: '', status: REPORT_STATUS.IN_PROGRESS, notes: '',
    technicianId: user?.id || '', labId: user?.lab || '',
    testParameters: [], templateNotes: {}, testNotes: '',
    selectedTemplateIds: [], whatsappNotificationEnabled: false,
  });

  // ── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const pid = params.get('patientId');

    const init = async () => {
      await Promise.all([loadPatients(), loadDoctors()]);
      if (pid) autoSelectPatient(pid);
    };
    init();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const fn = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const loadPatients = async () => {
    setPatientsLoading(true);
    try {
      const data = await patients.getAll(user?.lab || '');
      const list = Array.isArray(data) ? data
        : Array.isArray(data?.data) ? data.data
        : [];
      patientListRef.current = list; // keep sync ref
      setPatientList(list);
      return list;
    } catch {
      setPatientList([]);
      return [];
    } finally {
      setPatientsLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      const res = await doctors.getAll();
      const list = Array.isArray(res) ? res
        : Array.isArray(res?.data) ? res.data
        : [];
      setDoctorList(list);
    } catch { setDoctorList([]); }
  };

  const autoSelectPatient = async (pid) => {
    try {
      // Try from already-loaded list first (sync, no extra API call)
      const fromList = patientListRef.current.find(p => (p._id || p.id) === pid || p.patientId === pid);
      if (fromList) { selectPatient(fromList); return; }
      // Fallback: fetch from API
      const data = await patients.getById(pid);
      const p = data?.data || data;
      if (p) selectPatient(p);
    } catch {}
  };

  // ── Patient selection ─────────────────────────────────────────────────────
  const selectPatient = (p) => {
    setSelectedPatient(p);
    setSearchTerm('');
    setFormData(prev => ({
      ...prev,
      patientId: p.patientId || p._id || p.id || '',
      patientName: p.fullName || '',
      patientAge: p.age || '',
      patientGender: p.gender || '',
      patientDesignation: p.designation || '',
      patientPhone: p.phone || '',
      whatsappNotificationEnabled: p.whatsappNotificationEnabled || false,
    }));
    setShowDropdown(false);
  };

  const clearPatient = () => {
    setSelectedPatient(null);
    setSearchTerm('');
    setFormData(prev => ({ ...prev, patientId: '', patientName: '', patientAge: '', patientGender: '', patientDesignation: '', patientPhone: '' }));
  };

  const filteredPatients = searchTerm.trim()
    ? patientList.filter(p =>
        p.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(p.phone || '').includes(searchTerm) ||
        String(p.patientId || '').toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 30)
    : patientList.slice(0, 50); // show first 50 when no search term

  // ── Quick add patient ─────────────────────────────────────────────────────
  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!newPt.fullName.trim() || !newPt.age || !newPt.gender || !newPt.designation) {
      setAddPatientError('Name, age, gender and title are required.'); return;
    }
    setAddingPatient(true); setAddPatientError('');
    try {
      const created = await patients.create({ ...newPt, labId: user?.lab || '' });
      // Select immediately from response — don't wait for list reload
      const p = created?.patient || created?.data || created || {};
      selectPatient({
        ...newPt,
        _id: p._id || p.id || '',
        patientId: p.patientId || p._id || p.id || '',
        fullName: newPt.fullName,
      });
      setShowAddPatient(false);
      setNewPt({ designation: '', fullName: '', age: '', gender: '', phone: '' });
      // Reload patient list in background (don't await — don't block UX)
      loadPatients();
    } catch (err) {
      if (err.response?.data?.code === 'SUBSCRIPTION_REQUIRED' || err.response?.data?.code === 'MAX_PATIENTS_REACHED') {
        setSubscriptionErrorData(err.response.data); setSubscriptionModal(true); setShowAddPatient(false);
      } else if (err.response?.data?.duplicate) {
        setAddPatientError('Patient already exists — search and select them instead.');
      } else {
        setAddPatientError(err.response?.data?.message || err.message || 'Failed to add patient.');
      }
    } finally { setAddingPatient(false); }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientId) { setError('Please select a patient first.'); return; }
    if (!formData.testName || !formData.category || !formData.sampleType) { setError('Fill in all required test fields.'); return; }
    if (!formData.testParameters?.length) { setError('Select a test template or add at least one parameter.'); return; }
    const missing = formData.testParameters.filter(p => !p.isHeader && (!p.name || !p.value));
    if (missing.length) { setError('Fill in values for all test parameters.'); return; }

    setIsLoading(true); setError('');
    try {
      await reports.create({
        patientInfo: {
          designation: formData.patientDesignation,
          name: formData.patientName,
          age: parseInt(formData.patientAge),
          gender: formData.patientGender,
          contact: { phone: formData.patientPhone },
          patientId: formData.patientId,
        },
        testInfo: {
          name: formData.testName,
          category: formData.category,
          sampleType: formData.sampleType || 'Blood',
          sampleCollectionDate: new Date(formData.collectionDate),
          sampleId: `SAMPLE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          price: parseInt(formData.price, 10) || 0,
          referenceDoctor: formData.referenceDoctor || '',
        },
        results: formData.testParameters.map(p => ({
          parameter: p.name || 'Unknown',
          value: p.value || 'N/A',
          unit: p.unit || '',
          referenceRange: p.referenceRange || '',
          notes: p.notes || '',
          isHeader: p.isHeader || false,
          isSubparameter: p.isSubparameter || false,
          section: p.section || 'Default',
          templateId: p.templateId,
        })),
        templateNotes: formData.templateNotes || {},
        testNotes: formData.testNotes || '',
        status: REPORT_STATUS.IN_PROGRESS,
        lab: user?.lab,
        technician: user?.id,
        selectedTemplateIds: formData.selectedTemplateIds || [],
      });
      navigate('/reports');
    } catch (err) {
      if (err.response?.data?.code === 'SUBSCRIPTION_REQUIRED' || err.response?.data?.code === 'MAX_REPORTS_REACHED') {
        setSubscriptionErrorData(err.response.data); setSubscriptionModal(true);
      } else {
        setError(err.message || 'Failed to create report.');
      }
      setIsLoading(false);
    }
  };

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto py-5 px-4 page-enter">

      {/* Page header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
          <DocumentTextIcon className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Create Report</h1>
          <p className="text-sm text-slate-500">Select patient → choose test → enter results → save</p>
        </div>
      </div>

      {error && <Alert type="error"><p>{error}</p></Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── STEP 1: Patient ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-visible">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">1</span>
            <h2 className="text-sm font-semibold text-slate-800">Select Patient</h2>
          </div>
          <div className="px-5 py-4">
            {selectedPatient ? (
              /* Patient selected — show chip */
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {(selectedPatient.fullName || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 text-sm">
                    {selectedPatient.designation} {selectedPatient.fullName}
                  </div>
                  <div className="text-xs text-slate-500">
                    Age {selectedPatient.age} · {selectedPatient.gender} · {selectedPatient.phone || 'No phone'} · ID: {selectedPatient.patientId || selectedPatient._id?.slice(-6)}
                  </div>
                </div>
                <button type="button" onClick={clearPatient}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition flex-shrink-0">
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ) : (
              /* Search box */
              <div ref={searchRef} className="relative">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, phone or patient ID…"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                    className={`${inputCls} pl-9`}
                    autoFocus
                  />
                </div>

                {showDropdown && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-72 overflow-auto">
                    {/* Quick add button */}
                    <button type="button" onMouseDown={() => { setShowDropdown(false); setShowAddPatient(true); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-blue-600 font-medium hover:bg-blue-50 border-b border-slate-200 sticky top-0 bg-white">
                      <UserPlusIcon className="h-4 w-4 flex-shrink-0" />
                      {searchTerm ? `Add "${searchTerm}" as new patient` : 'Add new patient'}
                    </button>

                    {patientsLoading ? (
                      <div className="px-4 py-4 text-sm text-slate-400 text-center flex items-center justify-center gap-2">
                        <span className="h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        Loading patients…
                      </div>
                    ) : filteredPatients.length === 0 ? (
                      <div className="px-4 py-4 text-sm text-slate-400 text-center">
                        {searchTerm ? `No patient found for "${searchTerm}"` : 'No patients in your lab yet'}
                      </div>
                    ) : (
                      <>
                        {!searchTerm && (
                          <div className="px-4 py-1.5 text-xs text-slate-400 bg-slate-50 border-b border-slate-100">
                            {patientList.length} patient{patientList.length !== 1 ? 's' : ''} · type to search
                          </div>
                        )}
                        {filteredPatients.map(p => {
                          const pid = p._id || p.id;
                          return (
                            <div key={pid} onMouseDown={() => selectPatient(p)}
                              className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-blue-50 border-b border-slate-50 transition-colors">
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {(p.fullName || '?').charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-slate-800 truncate">
                                  {p.designation} {p.fullName}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {p.age ? `${p.age}y` : ''}{p.age && p.gender ? ' · ' : ''}{p.gender || ''}{p.phone ? ` · ${p.phone}` : ''}
                                </div>
                              </div>
                              {p.patientId && (
                                <span className="ml-auto text-xs text-slate-400 font-mono flex-shrink-0">{p.patientId}</span>
                              )}
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Quick-add patient inline form */}
            {showAddPatient && (
              <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-slate-800">Quick Add Patient</p>
                  <button type="button" onClick={() => setShowAddPatient(false)} className="text-slate-400 hover:text-slate-600">
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
                {addPatientError && <Alert type="error">{addPatientError}</Alert>}
                <form onSubmit={handleQuickAdd} className="space-y-3">
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-2">
                      <label className={labelCls}>Title<span className="text-red-500">*</span></label>
                      <select className={inputCls} value={newPt.designation} onChange={(e) => setNewPt(p => ({ ...p, designation: e.target.value }))} required>
                        <option value="">—</option>
                        {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="col-span-4">
                      <label className={labelCls}>Full Name<span className="text-red-500">*</span></label>
                      <input className={inputCls} placeholder="Patient name" value={newPt.fullName}
                        onChange={(e) => setNewPt(p => ({ ...p, fullName: e.target.value }))} required />
                    </div>
                    <div className="col-span-2">
                      <label className={labelCls}>Age<span className="text-red-500">*</span></label>
                      <input type="number" className={inputCls} placeholder="Yrs" min="0" max="150"
                        value={newPt.age} onChange={(e) => setNewPt(p => ({ ...p, age: e.target.value }))} required />
                    </div>
                    <div className="col-span-2">
                      <label className={labelCls}>Gender<span className="text-red-500">*</span></label>
                      <select className={inputCls} value={newPt.gender} onChange={(e) => setNewPt(p => ({ ...p, gender: e.target.value }))} required>
                        <option value="">—</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className={labelCls}>Phone</label>
                      <input type="tel" className={inputCls} placeholder="10 digits"
                        value={newPt.phone} onChange={(e) => setNewPt(p => ({ ...p, phone: e.target.value.replace(/\D/g,'').slice(0,10) }))}
                        maxLength={10} inputMode="numeric" />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setShowAddPatient(false)} className="btn btn-secondary btn-sm">Cancel</button>
                    <button type="submit" disabled={addingPatient} className="btn btn-primary btn-sm">
                      {addingPatient ? 'Adding…' : 'Add & Select'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* ── STEP 2: Test Info ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">2</span>
            <h2 className="text-sm font-semibold text-slate-800">Test Information</h2>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>Test Name<span className="text-red-500">*</span></label>
                <input className={inputCls} placeholder="e.g. Complete Blood Count"
                  value={formData.testName}
                  onChange={(e) => setFormData(p => ({ ...p, testName: e.target.value }))} required />
              </div>
              <div>
                <label className={labelCls}>Sample Type<span className="text-red-500">*</span></label>
                <select className={inputCls} value={formData.sampleType}
                  onChange={(e) => setFormData(p => ({ ...p, sampleType: e.target.value }))} required>
                  <option value="">Select</option>
                  {SAMPLE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Collection Date</label>
                <input type="date" className={inputCls} value={formData.collectionDate}
                  onChange={(e) => setFormData(p => ({ ...p, collectionDate: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Ref. Doctor</label>
                <input list="doctor-list" className={inputCls} placeholder="Select or type"
                  value={formData.referenceDoctor}
                  onChange={(e) => setFormData(p => ({ ...p, referenceDoctor: e.target.value }))} />
                <datalist id="doctor-list">
                  {doctorList.map(d => <option key={d._id} value={d.name}>{d.name} {d.specialty ? `— ${d.specialty}` : ''}</option>)}
                </datalist>
              </div>
              <div>
                <label className={labelCls}>Category<span className="text-red-500">*</span></label>
                <input className={inputCls} placeholder="e.g. Haematology"
                  value={formData.category}
                  onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))} required />
              </div>
              <div>
                <label className={labelCls}>Price (₹)</label>
                <input type="number" className={inputCls} placeholder="0"
                  value={formData.price}
                  onChange={(e) => setFormData(p => ({ ...p, price: e.target.value }))} min="0" />
              </div>
            </div>
          </div>
        </div>

        {/* ── STEP 3: Test Parameters ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">3</span>
            <h2 className="text-sm font-semibold text-slate-800">Test Parameters</h2>
            {formData.testParameters.length > 0 && (
              <span className="ml-auto badge badge-blue">{formData.testParameters.filter(p => !p.isHeader).length} parameters</span>
            )}
          </div>
          <div className="px-5 py-4">
            <TestParametersForm
              formData={formData}
              setFormData={setFormData}
              patientGender={formData.patientGender}
              setError={setError}
              hideTestInfoFields={true}
            />
          </div>
        </div>

        {/* ── STEP 4: Notes ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50">
            <span className="w-6 h-6 rounded-full bg-slate-300 text-white text-xs font-bold flex items-center justify-center">4</span>
            <h2 className="text-sm font-semibold text-slate-800">Notes <span className="text-slate-400 font-normal">(optional)</span></h2>
          </div>
          <div className="px-5 py-4">
            <textarea
              rows={2}
              className={inputCls}
              placeholder="General notes or observations printed at bottom of report…"
              value={formData.testNotes}
              onChange={(e) => setFormData(p => ({ ...p, testNotes: e.target.value }))}
            />
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <button type="button" onClick={() => navigate('/reports')} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={isLoading || !formData.patientId}
            className={`btn btn-primary px-8 ${(!formData.patientId) ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {isLoading ? (
              <><span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating…</>
            ) : (
              <><CheckCircleIcon className="h-4 w-4" /> Create Report &amp; Go to Print</>
            )}
          </button>
        </div>

      </form>

      <SubscriptionRequiredModal isOpen={subscriptionModal} onClose={() => setSubscriptionModal(false)} errorData={subscriptionErrorData} />
    </div>
  );
}
