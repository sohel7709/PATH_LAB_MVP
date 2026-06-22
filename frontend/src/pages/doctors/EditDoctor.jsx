import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UserIcon } from '@heroicons/react/24/outline';
import { doctors } from '../../utils/api';
import {
  FormShell, FormSection, FormGrid, FormField,
  Input, Alert, FormActions,
} from '../../components/common/FormShell';

const SPECIALTIES = [
  'Cardiologist', 'Neurologist', 'Pathologist', 'Radiologist', 'Orthopaedic',
  'General Physician', 'Gynaecologist', 'Paediatrician', 'Dermatologist', 'ENT Specialist',
  'Urologist', 'Ophthalmologist', 'Psychiatrist', 'Endocrinologist', 'Gastroenterologist',
];

export default function EditDoctor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({ name: '', specialty: '', phone: '', email: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await doctors.getById(id);
        const d = res.data || res;
        setFormData({ name: d.name || '', specialty: d.specialty || '', phone: d.phone || '', email: d.email || '' });
      } catch { setError('Failed to load doctor details.'); }
      finally { setIsLoading(false); }
    })();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true); setError('');
    try {
      await doctors.update(id, formData);
      navigate('/doctors');
    } catch (err) {
      setError(err.message || 'Failed to update doctor.');
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-10 rounded-lg" />)}
    </div>
  );

  return (
    <FormShell icon={UserIcon} title="Edit Doctor" subtitle="Update doctor information" backTo="/doctors">
      <form onSubmit={handleSubmit}>
        <FormSection>
          {error && <Alert type="error">{error}</Alert>}
          <FormGrid cols={2}>
            <FormField label="Doctor Name" required>
              <Input name="name" placeholder="e.g. Dr. Priya Sharma" value={formData.name}
                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} required />
            </FormField>
            <FormField label="Specialty" hint="optional">
              <Input name="specialty" list="specialty-list" placeholder="e.g. Cardiologist"
                value={formData.specialty} onChange={(e) => setFormData(p => ({ ...p, specialty: e.target.value }))} />
              <datalist id="specialty-list">
                {SPECIALTIES.map(s => <option key={s} value={s} />)}
              </datalist>
            </FormField>
            <FormField label="Phone" hint="optional">
              <Input type="tel" name="phone" placeholder="9876543210" value={formData.phone}
                onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                inputMode="numeric" maxLength={10} />
            </FormField>
            <FormField label="Email" hint="optional">
              <Input type="email" name="email" placeholder="doctor@hospital.com"
                value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} />
            </FormField>
          </FormGrid>
        </FormSection>
        <FormActions onCancel={() => navigate('/doctors')} submitLabel="Save Changes" loadingLabel="Saving…" loading={isSaving} />
      </form>
    </FormShell>
  );
}
