import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserGroupIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { superAdmin, users } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  FormShell, FormSection, FormGrid, FormField,
  Input, Select, Alert, FormActions,
} from '../../components/common/FormShell';

const ROLE_INFO = {
  admin: { label: 'Lab Admin', desc: 'Manages lab settings, users, and reports' },
  technician: { label: 'Lab Technician', desc: 'Creates and manages patient reports' },
  'super-admin': { label: 'Super Admin', desc: 'Full system access across all labs' },
};

export default function CreateUser() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const isAdmin = currentUser?.role === 'admin';

  const [formData, setFormData] = useState({
    name: '', email: '', password: '',
    role: isAdmin ? 'technician' : 'admin',
    lab: '',
  });
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingLabs, setFetchingLabs] = useState(!isAdmin);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isAdmin) return;
    (async () => {
      try {
        const res = await superAdmin.getLabs();
        if (res.success) setLabs(res.data || []);
      } catch {}
      finally { setFetchingLabs(false); }
    })();
  }, [isAdmin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      if (!isAdmin && formData.role !== 'super-admin' && !formData.lab)
        throw new Error('Please select a lab for this user');
      if (isAdmin) {
        await users.create({ name: formData.name, email: formData.email, password: formData.password });
      } else {
        await superAdmin.createUser({
          name: formData.name, email: formData.email, password: formData.password,
          role: formData.role,
          labId: formData.role !== 'super-admin' ? formData.lab : undefined,
        });
      }
      setSuccess('User created successfully!');
      setTimeout(() => navigate('/users'), 1500);
    } catch (err) {
      setError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormShell
      icon={UserGroupIcon}
      title={isAdmin ? 'Create Technician' : 'Create User'}
      subtitle={isAdmin ? 'Add a technician to your lab' : 'Add a user to the system'}
      backTo="/users"
    >
      <form onSubmit={handleSubmit}>
        <FormSection title="Account Details">
          {error && <Alert type="error">{error}</Alert>}
          {success && <Alert type="success">{success}</Alert>}
          <FormGrid cols={2}>
            <FormField label="Full Name" required>
              <Input placeholder="e.g. Rahul Verma" value={formData.name}
                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} required autoFocus />
            </FormField>
            <FormField label="Email Address" required>
              <Input type="email" placeholder="user@lab.com" value={formData.email}
                onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} required />
            </FormField>
          </FormGrid>
          <FormField label="Password" required hint="Minimum 6 characters">
            <div className="relative">
              <Input type={showPassword ? 'text' : 'password'} placeholder="Set a strong password"
                value={formData.password} onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                required minLength={6} className="pr-10" />
              <button type="button" tabIndex={-1} onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </FormField>
        </FormSection>

        {!isAdmin && (
          <FormSection title="Role & Lab Assignment">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {Object.entries(ROLE_INFO).map(([key, info]) => (
                <button key={key} type="button"
                  onClick={() => setFormData(p => ({ ...p, role: key, lab: key === 'super-admin' ? '' : p.lab }))}
                  className={`text-left rounded-xl border-2 p-3 transition-all ${
                    formData.role === key ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-blue-300'
                  }`}>
                  <div className={`text-sm font-semibold ${formData.role === key ? 'text-blue-700' : 'text-slate-800'}`}>{info.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{info.desc}</div>
                </button>
              ))}
            </div>
            {formData.role !== 'super-admin' && (
              <FormField label="Assign to Lab" required>
                {fetchingLabs ? <div className="skeleton h-10 rounded-lg" /> : (
                  <Select value={formData.lab} onChange={(e) => setFormData(p => ({ ...p, lab: e.target.value }))} required>
                    <option value="">Select a lab</option>
                    {labs.map(lab => <option key={lab._id} value={lab._id}>{lab.name}</option>)}
                  </Select>
                )}
              </FormField>
            )}
          </FormSection>
        )}

        {isAdmin && (
          <FormSection title="Assignment">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Role</p>
                <p className="font-semibold text-blue-800">Lab Technician</p>
                <p className="text-xs text-slate-400 mt-0.5">Auto-assigned</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Lab</p>
                <p className="font-semibold text-blue-800">{currentUser?.lab?.name || 'Your Lab'}</p>
                <p className="text-xs text-slate-400 mt-0.5">Auto-assigned</p>
              </div>
            </div>
          </FormSection>
        )}

        <FormActions onCancel={() => navigate('/users')}
          submitLabel={isAdmin ? 'Create Technician' : 'Create User'}
          loadingLabel="Creating…" loading={loading} />
      </form>
    </FormShell>
  );
}
