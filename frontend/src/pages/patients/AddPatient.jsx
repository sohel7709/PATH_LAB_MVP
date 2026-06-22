import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlusIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import SubscriptionRequiredModal from '../../components/subscription/SubscriptionRequiredModal';
import {
  FormShell, FormSection, FormGrid, FormField,
  Input, Select, Textarea, Toggle, Alert, FormActions,
} from '../../components/common/FormShell';

const DESIGNATIONS = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Master', 'Miss'];

export default function AddPatient() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [duplicatePatient, setDuplicatePatient] = useState(null);
  const [phoneError, setPhoneError] = useState('');
  const [subscriptionModal, setSubscriptionModal] = useState(false);
  const [subscriptionErrorData, setSubscriptionErrorData] = useState(null);

  const [formData, setFormData] = useState({
    designation: '',
    fullName: '',
    age: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    labId: user?.lab || '',
    whatsappNotificationEnabled: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const digits = value.replace(/\D/g, '').slice(0, 10);
      setFormData(p => ({ ...p, phone: digits }));
      setPhoneError(digits.length > 0 && digits.length < 10 ? 'Must be 10 digits' : '');
    } else {
      setFormData(p => ({ ...p, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (phoneError) return;
    setIsLoading(true);
    setError('');
    setDuplicatePatient(null);
    try {
      const { patients } = await import('../../utils/api');
      await patients.create(formData);
      setSuccess(true);
    } catch (err) {
      if (err.response?.data?.code === 'SUBSCRIPTION_REQUIRED' || err.response?.data?.code === 'MAX_PATIENTS_REACHED') {
        setSubscriptionErrorData(err.response.data);
        setSubscriptionModal(true);
      } else if (err.response?.data?.duplicate) {
        setDuplicatePatient(err.response.data.patient);
        setError('A patient with these details already exists.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to add patient');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <FormShell icon={UserPlusIcon} title="Patient Added" subtitle="Patient has been registered successfully">
        <FormSection>
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              {formData.designation} {formData.fullName} registered
            </h3>
            <p className="text-sm text-slate-500 mb-6">What would you like to do next?</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => navigate('/reports/create')} className="btn btn-primary">
                Create Report for this Patient
              </button>
              <button onClick={() => { setSuccess(false); setFormData({ designation: '', fullName: '', age: '', gender: '', phone: '', email: '', address: '', labId: user?.lab || '', whatsappNotificationEnabled: false }); }} className="btn btn-secondary">
                Add Another Patient
              </button>
              <button onClick={() => navigate('/patients')} className="btn btn-secondary">
                Back to Patients
              </button>
            </div>
          </div>
        </FormSection>
      </FormShell>
    );
  }

  return (
    <FormShell icon={UserPlusIcon} title="Add Patient" subtitle="Register a new patient" backTo="/patients">
      <form onSubmit={handleSubmit}>
        <FormSection>
          {error && (
            <Alert type="error">
              <p>{error}</p>
              {duplicatePatient && (
                <div className="mt-2 p-2 bg-white rounded border border-red-200 text-xs space-y-1">
                  <p className="font-semibold">Existing patient:</p>
                  <p>{duplicatePatient.fullName} · Age {duplicatePatient.age} · {duplicatePatient.phone}</p>
                  <button type="button" onClick={() => navigate(`/patients/${duplicatePatient._id}`)} className="text-blue-600 underline">
                    View Patient →
                  </button>
                </div>
              )}
            </Alert>
          )}

          {/* Row 1: Designation | Name | Age | Gender */}
          <div className="grid grid-cols-2 sm:grid-cols-12 gap-3 mt-2">
            <div className="col-span-2 sm:col-span-2">
              <FormField label="Title" required>
                <Select name="designation" value={formData.designation} onChange={handleChange} required>
                  <option value="">—</option>
                  {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </Select>
              </FormField>
            </div>
            <div className="col-span-2 sm:col-span-5">
              <FormField label="Full Name" required>
                <Input name="fullName" placeholder="Patient's full name" value={formData.fullName} onChange={handleChange} required autoFocus />
              </FormField>
            </div>
            <div className="col-span-1 sm:col-span-2">
              <FormField label="Age" required>
                <Input type="number" name="age" placeholder="Yrs" min="0" max="150" value={formData.age} onChange={handleChange} required />
              </FormField>
            </div>
            <div className="col-span-1 sm:col-span-3">
              <FormField label="Gender" required>
                <Select name="gender" value={formData.gender} onChange={handleChange} required>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </Select>
              </FormField>
            </div>
          </div>

          {/* Row 2: Phone | Email */}
          <FormGrid cols={2} >
            <FormField label="Phone" hint="10 digits · optional" error={phoneError}>
              <Input type="tel" name="phone" id="phone" placeholder="9876543210" value={formData.phone} onChange={handleChange} maxLength={10} inputMode="numeric" />
            </FormField>
            <FormField label="Email" hint="optional">
              <Input type="email" name="email" placeholder="patient@email.com" value={formData.email} onChange={handleChange} />
            </FormField>
          </FormGrid>

          {/* Row 3: Address */}
          <FormField label="Address" hint="optional">
            <Textarea name="address" rows={2} placeholder="Street, City, State" value={formData.address} onChange={handleChange} />
          </FormField>

          {/* WhatsApp toggle */}
          <div className="mt-3">
            <Toggle
              label="Enable WhatsApp Notifications"
              description="Patient receives report links via WhatsApp when reports are created"
              checked={formData.whatsappNotificationEnabled}
              onChange={(v) => setFormData(p => ({ ...p, whatsappNotificationEnabled: v }))}
            />
          </div>
        </FormSection>

        <FormActions
          onCancel={() => navigate('/patients')}
          submitLabel="Add Patient"
          loadingLabel="Adding…"
          loading={isLoading}
        />
      </form>

      <SubscriptionRequiredModal isOpen={subscriptionModal} onClose={() => setSubscriptionModal(false)} errorData={subscriptionErrorData} />
    </FormShell>
  );
}
