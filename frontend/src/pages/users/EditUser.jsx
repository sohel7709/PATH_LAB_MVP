import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { users, superAdmin } from '../../utils/api.js';
import { UserIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import {
  FormShell, FormSection, FormGrid, FormField,
  Input, Select, Alert, FormActions,
} from '../../components/common/FormShell';

export default function EditUser() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isSuperAdmin = currentUser?.role === 'super-admin';

  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'technician', labId: '' });
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    (async () => {
      try {
        let userData;
        if (isSuperAdmin) {
          const [userRes, labsRes] = await Promise.all([superAdmin.getUser(id), superAdmin.getLabs()]);
          userData = userRes.data;
          setLabs(labsRes.data || []);
        } else {
          const res = await users.getById(id);
          userData = res.data;
        }
        const labId = typeof userData.lab === 'object' ? userData.lab?._id : userData.lab || '';
        setFormData({ name: userData.name || '', email: userData.email || '', password: '', role: userData.role || 'technician', labId });
      } catch (err) {
        setError(err.message || 'Failed to load user');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isSuperAdmin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        labId: formData.role !== 'super-admin' ? formData.labId : undefined,
        ...(formData.password ? { password: formData.password } : {}),
      };
      isSuperAdmin ? await superAdmin.updateUser(id, payload) : await users.update(id, payload);
      setSuccess('User updated successfully!');
      setTimeout(() => navigate('/users'), 1200);
    } catch (err) {
      setError(err.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-10 rounded-lg" />)}
    </div>
  );

  return (
    <FormShell icon={UserIcon} title="Edit User" subtitle="Update user account details" backTo="/users">
      <form onSubmit={handleSubmit}>
        <FormSection title="Account Details">
          {error && <Alert type="error">{error}</Alert>}
          {success && <Alert type="success">{success}</Alert>}
          <FormGrid cols={2}>
            <FormField label="Full Name" required>
              <Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} required />
            </FormField>
            <FormField label="Email Address" required>
              <Input type="email" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} required />
            </FormField>
          </FormGrid>
          <FormField label="New Password" hint="Leave blank to keep current password">
            <div className="relative">
              <Input type={showPassword ? 'text' : 'password'} placeholder="Leave blank to keep unchanged"
                value={formData.password} onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))} className="pr-10" />
              <button type="button" tabIndex={-1} onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </FormField>
        </FormSection>

        {isSuperAdmin && (
          <FormSection title="Role & Lab">
            <FormGrid cols={2}>
              <FormField label="Role" required>
                <Select value={formData.role} onChange={(e) => setFormData(p => ({ ...p, role: e.target.value }))}>
                  <option value="technician">Lab Technician</option>
                  <option value="admin">Lab Admin</option>
                  <option value="super-admin">Super Admin</option>
                </Select>
              </FormField>
              {formData.role !== 'super-admin' && (
                <FormField label="Assigned Lab">
                  {formData.labId ? (
                    <div className="input bg-slate-50 text-slate-500 cursor-not-allowed">
                      {labs.find(l => l._id === formData.labId)?.name || 'Lab assigned'}
                      <span className="text-xs ml-2">(cannot change)</span>
                    </div>
                  ) : (
                    <Select value={formData.labId} onChange={(e) => setFormData(p => ({ ...p, labId: e.target.value }))}>
                      <option value="">No Lab</option>
                      {labs.map(lab => <option key={lab._id} value={lab._id}>{lab.name}</option>)}
                    </Select>
                  )}
                </FormField>
              )}
            </FormGrid>
          </FormSection>
        )}

        <FormActions onCancel={() => navigate('/users')} submitLabel="Save Changes" loadingLabel="Saving…" loading={saving} />
      </form>
    </FormShell>
  );
}
