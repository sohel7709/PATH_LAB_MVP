import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BeakerIcon } from '@heroicons/react/24/outline';
import { superAdmin } from '../../utils/api';
import {
  FormShell, FormSection, FormGrid, FormField,
  Input, Alert, FormActions,
} from '../../components/common/FormShell';

export default function CreateLab() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    contact: { phone: '', email: '' },
    address: { street: '', city: '', state: '', zipCode: '', country: 'India' },
  });

  const setContact = (field, value) =>
    setFormData(p => ({ ...p, contact: { ...p.contact, [field]: value } }));
  const setAddress = (field, value) =>
    setFormData(p => ({ ...p, address: { ...p.address, [field]: value } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const phone = formData.contact.phone.replace(/\D/g, '');
    if (!/^\d{10}$/.test(phone)) { setError('Mobile number must be exactly 10 digits.'); return; }
    setLoading(true); setError('');
    try {
      await superAdmin.createLab({ ...formData, contact: { ...formData.contact, phone } });
      navigate('/labs');
    } catch (err) {
      setError(err.message || 'Failed to create lab');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormShell icon={BeakerIcon} title="Create Lab" subtitle="Register a new diagnostic lab" backTo="/labs">
      <form onSubmit={handleSubmit}>
        <FormSection title="Lab Details">
          {error && <Alert type="error">{error}</Alert>}
          <FormField label="Lab Name" required>
            <Input placeholder="e.g. City Diagnostic Centre" value={formData.name}
              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} required autoFocus />
          </FormField>
        </FormSection>

        <FormSection title="Contact">
          <FormGrid cols={2}>
            <FormField label="Phone" required>
              <Input type="tel" placeholder="10-digit mobile" value={formData.contact.phone}
                onChange={(e) => setContact('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                inputMode="numeric" maxLength={10} required />
            </FormField>
            <FormField label="Email" hint="optional">
              <Input type="email" placeholder="lab@example.com" value={formData.contact.email}
                onChange={(e) => setContact('email', e.target.value)} />
            </FormField>
          </FormGrid>
        </FormSection>

        <FormSection title="Address">
          <div className="space-y-3">
            <FormField label="Street">
              <Input placeholder="Street / Area" value={formData.address.street}
                onChange={(e) => setAddress('street', e.target.value)} />
            </FormField>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <FormField label="City">
                <Input placeholder="City" value={formData.address.city}
                  onChange={(e) => setAddress('city', e.target.value)} />
              </FormField>
              <FormField label="State">
                <Input placeholder="State" value={formData.address.state}
                  onChange={(e) => setAddress('state', e.target.value)} />
              </FormField>
              <FormField label="Zip">
                <Input placeholder="400001" value={formData.address.zipCode}
                  onChange={(e) => setAddress('zipCode', e.target.value)} />
              </FormField>
              <FormField label="Country">
                <Input placeholder="India" value={formData.address.country}
                  onChange={(e) => setAddress('country', e.target.value)} />
              </FormField>
            </div>
          </div>
        </FormSection>

        <FormActions onCancel={() => navigate('/labs')} submitLabel="Create Lab" loadingLabel="Creating…" loading={loading} />
      </form>
    </FormShell>
  );
}
