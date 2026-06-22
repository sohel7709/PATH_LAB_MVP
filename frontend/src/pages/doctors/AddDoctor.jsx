import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function AddDoctor() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', specialty: '', phone: '', email: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setError('');
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { setError('Doctor name is required.'); return; }
    if (formData.phone.trim() && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      setError('Phone number must be exactly 10 digits.'); return;
    }
    setIsLoading(true);
    try {
      await doctors.create(formData);
      navigate('/doctors');
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to add doctor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormShell icon={UserIcon} title="Add Reference Doctor" subtitle="Add a referring doctor to your lab" backTo="/doctors">
      <form onSubmit={handleSubmit}>
        <FormSection>
          {error && <Alert type="error">{error}</Alert>}

          <FormGrid cols={2}>
            <FormField label="Doctor Name" required>
              <Input name="name" placeholder="e.g. Dr. Priya Sharma" value={formData.name} onChange={handleChange} required autoFocus />
            </FormField>
            <FormField label="Specialty" hint="optional">
              <Input
                name="specialty"
                list="specialty-list"
                placeholder="e.g. Cardiologist"
                value={formData.specialty}
                onChange={handleChange}
              />
              <datalist id="specialty-list">
                {SPECIALTIES.map(s => <option key={s} value={s} />)}
              </datalist>
            </FormField>
            <FormField label="Phone" hint="10 digits · optional">
              <Input type="tel" name="phone" placeholder="9876543210" value={formData.phone}
                onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                inputMode="numeric" maxLength={10} />
            </FormField>
            <FormField label="Email" hint="optional">
              <Input type="email" name="email" placeholder="doctor@hospital.com" value={formData.email} onChange={handleChange} />
            </FormField>
          </FormGrid>
        </FormSection>

        <FormActions onCancel={() => navigate('/doctors')} submitLabel="Add Doctor" loadingLabel="Adding…" loading={isLoading} />
      </form>
    </FormShell>
  );
}
