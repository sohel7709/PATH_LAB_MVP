import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../utils/api';
import { UserCircleIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { FormSection, FormGrid, FormField, Input, Alert } from '../../components/common/FormShell';

const roleLabel = (role) => ({ 'super-admin': 'Super Admin', admin: 'Lab Admin', technician: 'Lab Technician' }[role] || role);

export default function Profile() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });

  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [pwdData, setPwdData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    (async () => {
      try {
        const res = await auth.getProfile();
        setProfileData(res.data);
        setFormData({ name: res.data.name || '', email: res.data.email || '', phone: res.data.phone || '' });
      } catch { setError('Failed to load profile'); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      const payload = { ...formData };
      if (profileData?.role !== 'super-admin') delete payload.email;
      await auth.updateProfile(payload);
      setSuccess('Profile updated successfully.');
    } catch (err) { setError(err.message || 'Failed to update profile'); }
    finally { setSaving(false); }
  };

  const handlePwdSubmit = async (e) => {
    e.preventDefault();
    if (pwdData.newPassword !== pwdData.confirmPassword) { setError('New passwords do not match'); return; }
    setChangingPwd(true); setError(''); setSuccess('');
    try {
      await auth.changePassword({ currentPassword: pwdData.currentPassword, newPassword: pwdData.newPassword });
      setSuccess('Password changed successfully.');
      setPwdData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { setError(err.message || 'Failed to change password'); }
    finally { setChangingPwd(false); }
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-4">
      {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-10 rounded-lg" />)}
    </div>
  );

  const initials = (profileData?.name || user?.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-5 page-enter">

      {/* Avatar header */}
      <div className="flex items-center gap-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
          {initials}
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{profileData?.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="badge badge-blue">{roleLabel(profileData?.role || user?.role)}</span>
            {profileData?.lab?.name && (
              <span className="text-sm text-slate-500">{profileData.lab.name}</span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-0.5">{profileData?.email}</p>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {/* Personal Info */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <UserCircleIcon className="h-5 w-5 text-blue-600" />
          <h2 className="text-base font-semibold text-slate-900">Personal Information</h2>
        </div>
        <form onSubmit={handleProfileSubmit}>
          <div className="px-6 py-5">
            <FormGrid cols={2}>
              <FormField label="Full Name" required>
                <Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} required />
              </FormField>
              <FormField label="Phone" hint="optional">
                <Input type="tel" value={formData.phone} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} />
              </FormField>
              <FormField label="Email" hint={profileData?.role !== 'super-admin' ? 'Only super-admin can change email' : ''}>
                <Input type="email" value={formData.email}
                  onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                  disabled={profileData?.role !== 'super-admin'}
                  className={profileData?.role !== 'super-admin' ? 'bg-slate-50 cursor-not-allowed' : ''} />
              </FormField>
              <FormField label="Role">
                <div className="input bg-slate-50 text-slate-500 cursor-not-allowed">{roleLabel(profileData?.role)}</div>
              </FormField>
            </FormGrid>
          </div>
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? <><span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <LockClosedIcon className="h-5 w-5 text-blue-600" />
          <h2 className="text-base font-semibold text-slate-900">Change Password</h2>
        </div>
        <form onSubmit={handlePwdSubmit}>
          <div className="px-6 py-5 space-y-4">
            {(['currentPassword', 'newPassword', 'confirmPassword']).map((field) => {
              const labels = { currentPassword: 'Current Password', newPassword: 'New Password', confirmPassword: 'Confirm New Password' };
              const key = field === 'currentPassword' ? 'current' : field === 'newPassword' ? 'new' : 'confirm';
              return (
                <FormField key={field} label={labels[field]} required>
                  <div className="relative">
                    <Input type={showPwd[key] ? 'text' : 'password'} value={pwdData[field]}
                      onChange={(e) => setPwdData(p => ({ ...p, [field]: e.target.value }))}
                      required minLength={6} className="pr-10" />
                    <button type="button" tabIndex={-1} onClick={() => setShowPwd(p => ({ ...p, [key]: !p[key] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPwd[key] ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                </FormField>
              );
            })}
          </div>
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button type="submit" disabled={changingPwd} className="btn btn-primary">
              {changingPwd ? <><span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Changing…</> : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
