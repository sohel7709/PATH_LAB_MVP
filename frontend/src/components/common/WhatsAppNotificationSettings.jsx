import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { whatsappSettings } from '../../utils/api';

const DEFAULT_SETTINGS = {
  enabled: false,
  sendToPatientOnReportComplete: true,
  sendToDoctorOnReportComplete: false,
  patientTemplateName: 'report_ready',
  doctorTemplateName: 'doctor_report_ready',
  templateLanguage: 'en_US',
  sendGoogleReviewOnDelivery: false,
  googleReviewTemplateName: 'google_review_request',
  googleReviewUrl: '',
};

const Toggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => !disabled && onChange(!checked)}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none
      ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
      ${checked ? 'bg-green-500' : 'bg-gray-300'}`}
  >
    <span
      className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200"
      style={{ transform: checked ? 'translateX(1.25rem)' : 'translateX(0)' }}
    />
  </button>
);

const Field = ({ label, hint, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
    {children}
  </div>
);

export default function WhatsAppNotificationSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await whatsappSettings.getSettings(user?.lab);
      const data = res.data || res;
      if (data) {
        setSettings({
          enabled: data.enabled ?? false,
          sendToPatientOnReportComplete: data.sendToPatientOnReportComplete !== false,
          sendToDoctorOnReportComplete: data.sendToDoctorOnReportComplete ?? false,
          patientTemplateName: data.patientTemplateName || 'report_ready',
          doctorTemplateName: data.doctorTemplateName || 'doctor_report_ready',
          templateLanguage: data.templateLanguage || 'en_US',
          sendGoogleReviewOnDelivery: data.sendGoogleReviewOnDelivery ?? false,
          googleReviewTemplateName: data.googleReviewTemplateName || 'google_review_request',
          googleReviewUrl: data.googleReviewUrl || '',
        });
      }
    } catch {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const set = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSaved(false);
      await whatsappSettings.updateSettings(settings, user?.lab);
      setSaved(true);
    } catch {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (!user || !['admin', 'super-admin'].includes(user.role)) return null;

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 animate-pulse space-y-3">
        <div className="h-5 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-100 rounded w-2/3" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">WhatsApp Notifications</h3>
          <p className="text-xs text-green-100 mt-0.5">Meta Business API — sends report links to patients &amp; doctors</p>
        </div>
        <div className="ml-auto">
          <Toggle
            checked={settings.enabled}
            onChange={(v) => set('enabled', v)}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Settings saved successfully
          </div>
        )}

        {/* Who to notify */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700">Notify on report creation</p>

          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50">
            <div>
              <p className="text-sm font-medium text-gray-700">Patients</p>
              <p className="text-xs text-gray-400">Patient must also have WhatsApp opt-in enabled on their profile</p>
            </div>
            <Toggle
              checked={settings.sendToPatientOnReportComplete}
              onChange={(v) => set('sendToPatientOnReportComplete', v)}
              disabled={!settings.enabled}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50">
            <div>
              <p className="text-sm font-medium text-gray-700">Referring Doctors</p>
              <p className="text-xs text-gray-400">Doctor must have a phone number saved in the Doctors directory</p>
            </div>
            <Toggle
              checked={settings.sendToDoctorOnReportComplete}
              onChange={(v) => set('sendToDoctorOnReportComplete', v)}
              disabled={!settings.enabled}
            />
          </div>
        </div>

        {/* Google Review */}
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-yellow-200">
            <div className="flex items-center gap-2">
              <span className="text-lg">⭐</span>
              <div>
                <p className="text-sm font-semibold text-yellow-800">Google Review Request</p>
                <p className="text-xs text-yellow-600">Sent automatically when a report is marked as <strong>Delivered</strong></p>
              </div>
            </div>
            <Toggle
              checked={settings.sendGoogleReviewOnDelivery}
              onChange={(v) => set('sendGoogleReviewOnDelivery', v)}
              disabled={!settings.enabled}
            />
          </div>

          <div className="p-4 space-y-4">
            <Field
              label="Your Google Review Link"
              hint="Go to your Google Business Profile → Get more reviews → copy the link"
            >
              <input
                type="url"
                value={settings.googleReviewUrl}
                onChange={(e) => set('googleReviewUrl', e.target.value)}
                disabled={!settings.enabled || !settings.sendGoogleReviewOnDelivery}
                placeholder="https://g.page/r/your-review-link/review"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 disabled:bg-gray-50 disabled:text-gray-400"
              />
            </Field>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Saving…
              </>
            ) : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
