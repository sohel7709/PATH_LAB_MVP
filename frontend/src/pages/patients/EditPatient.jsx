import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import {
  FormShell, FormSection, FormGrid, FormField,
  Input, Select, Textarea, Toggle, Alert, FormActions,
} from '../../components/common/FormShell';

const DESIGNATIONS = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Master', 'Miss'];

export default function EditPatient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [formData, setFormData] = useState({
    designation: '', fullName: '', age: '', gender: '',
    phone: '', email: '', address: '', labId: user?.lab || '',
    whatsappNotificationEnabled: false,
  });

  useEffect(() => {
    if (!id) { setError('Patient ID is missing'); setIsLoading(false); return; }
    (async () => {
      try {
        const { patients } = await import('../../utils/api');
        const res = await patients.getById(id);
        const d = res.data || res;
        setFormData({
          designation: d.designation || '',
          fullName: d.fullName || '',
          age: d.age || '',
          gender: d.gender || '',
          phone: d.phone || '',
          email: d.email || '',
          address: d.address || '',
          labId: d.labId || user?.lab || '',
          whatsappNotificationEnabled: d.whatsappNotificationEnabled || false,
        });
      } catch (err) {
        setError(err.message || 'Failed to load patient');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

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
    setIsSaving(true); setError('');
    try {
      const { patients } = await import('../../utils/api');
      await patients.update(id, formData);
      navigate('/patients');
    } catch (err) {
      setError(err.message || 'Failed to update patient');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-6 px-4 space-y-4">
        {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-10 rounded-lg" />)}
      </div>
    );
  }

  return (
    <FormShell icon={UserIcon} title="Edit Patient" subtitle="Update patient information" backTo="/patients">
      <form onSubmit={handleSubmit}>
        <FormSection>
          {error && <Alert type="error"><p>{error}</p></Alert>}

          <div className="grid grid-cols-2 sm:grid-cols-12 gap-3 mt-2">
            <div className="col-span-2 sm:col-span-2">
              <FormField label="Title">
                <Select name="designation" value={formData.designation} onChange={handleChange}>
                  <option value="">—</option>
                  {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </Select>
              </FormField>
            </div>
            <div className="col-span-2 sm:col-span-5">
              <FormField label="Full Name" required>
                <Input name="fullName" placeholder="Full name" value={formData.fullName} onChange={handleChange} required />
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

          <FormGrid cols={2}>
            <FormField label="Phone" hint="10 digits · optional" error={phoneError}>
              <Input type="tel" name="phone" placeholder="9876543210" value={formData.phone} onChange={handleChange} maxLength={10} inputMode="numeric" />
            </FormField>
            <FormField label="Email" hint="optional">
              <Input type="email" name="email" placeholder="patient@email.com" value={formData.email} onChange={handleChange} />
            </FormField>
          </FormGrid>

          <FormField label="Address" hint="optional">
            <Textarea name="address" rows={2} placeholder="Street, City, State" value={formData.address} onChange={handleChange} />
          </FormField>

          <div className="mt-3">
            <Toggle
              label="WhatsApp Notifications"
              description="Patient receives report links via WhatsApp"
              checked={formData.whatsappNotificationEnabled}
              onChange={(v) => setFormData(p => ({ ...p, whatsappNotificationEnabled: v }))}
            />
          </div>
        </FormSection>

        <FormActions onCancel={() => navigate('/patients')} submitLabel="Save Changes" loadingLabel="Saving…" loading={isSaving} />
      </form>
    </FormShell>
  );
}
