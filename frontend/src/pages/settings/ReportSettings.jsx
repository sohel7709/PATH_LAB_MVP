import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { labReportSettings } from "../../utils/api";
import {
  DocumentTextIcon, ArrowUpTrayIcon, CheckCircleIcon,
  ExclamationCircleIcon, XCircleIcon, PhotoIcon,
  PencilSquareIcon, SwatchIcon, EyeIcon, BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import ReportPreview from "../../components/reports/ReportPreview";

// ── primitives ─────────────────────────────────────────────────────────────────

const inputCls = "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition";
const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5";

const Field = ({ label, hint, children, className = "" }) => (
  <div className={className}>
    {label && <label className={labelCls}>{label}</label>}
    {children}
    {hint && <p className="mt-1.5 text-xs text-gray-400">{hint}</p>}
  </div>
);

const SectionCard = ({ icon: Icon, title, subtitle, badge, children, accent = "blue" }) => {
  const accents = {
    blue:   { bg: 'bg-blue-600',   ring: 'ring-blue-100',   dot: 'bg-blue-500' },
    purple: { bg: 'bg-purple-600', ring: 'ring-purple-100', dot: 'bg-purple-500' },
    amber:  { bg: 'bg-amber-500',  ring: 'ring-amber-100',  dot: 'bg-amber-500' },
  };
  const a = accents[accent] || accents.blue;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-lg ${a.bg} flex items-center justify-center flex-shrink-0`}>
            {Icon && <Icon className="h-4 w-4 text-white" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">{title}</h3>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {badge && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
            {badge}
          </span>
        )}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
};

const ImageUpload = ({ label, hint, value, onUpload, onRemove, uploading }) => {
  const ref = useRef(null);
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {value ? (
            <div className="relative">
              <img src={value} alt={label} className="h-20 max-w-[160px] object-contain rounded-xl border border-gray-200 bg-gray-50 p-1.5" />
              <button type="button" onClick={onRemove}
                className="absolute -top-2 -right-2 h-5 w-5 bg-white rounded-full border border-red-200 text-red-500 hover:bg-red-50 flex items-center justify-center shadow-sm">
                <XCircleIcon className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="h-20 w-36 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-300 bg-gray-50 gap-1">
              <PhotoIcon className="h-6 w-6" />
              <span className="text-xs">No image</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 pt-1">
          <input type="file" ref={ref} className="hidden" accept="image/png,image/jpeg,image/jpg"
            onChange={e => onUpload(e.target.files[0])} />
          <button type="button" onClick={() => ref.current.click()} disabled={uploading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-sm font-medium text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition shadow-sm">
            <ArrowUpTrayIcon className="h-3.5 w-3.5" />
            {uploading ? "Uploading…" : "Upload"}
          </button>
          {hint && <p className="text-xs text-gray-400 max-w-[180px] leading-relaxed">{hint}</p>}
        </div>
      </div>
    </div>
  );
};

// ── component ──────────────────────────────────────────────────────────────────

export default function ReportSettings() {
  const { user } = useAuth();
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [previewMode, setPreviewMode] = useState(false);

  const [settings, setSettings] = useState({
    header: {
      headerMode: "generated", headerDesign: "classic",
      labName: "", doctorName: "", registrationNo: "",
      technicianName: "", technicianDesignation: "",
      address: "", phone: "", email: "",
    },
    footer: {
      footerMode: "generated", verifiedBy: "",
      designation: "Consultant Pathologist",
      signature: "", signatureType: "", footerImage: "", footerImageType: "",
    },
    styling: { primaryColor: "#2563eb", secondaryColor: "#1e40af", fontFamily: "Arial, sans-serif", fontSize: 12 },
  });

  useEffect(() => {
    (async () => {
      try {
        if (!user?.lab) { setError("No lab associated with your account"); return; }
        const res = await labReportSettings.getSettings(user.lab);
        if (res.success) setSettings(res.data);
        else setError("Failed to fetch report settings");
      } catch { setError("Failed to load settings. Please try again."); }
      finally { setLoading(false); }
    })();
  }, [user]);

  const hc = (section, field, value) =>
    setSettings(p => ({ ...p, [section]: { ...p[section], [field]: value } }));

  const handleFileUpload = async (type, file) => {
    if (!file) return;
    if (!["image/png","image/jpeg","image/jpg"].includes(file.type)) { setError("Please upload PNG or JPG."); return; }
    setError(""); setUploading(true);
    try {
      const res = await labReportSettings.uploadImage(user.lab, file, type);
      if (res.success) {
        if (type === "footer")
          setSettings(p => ({ ...p, footer: { ...p.footer, footerImage: res.data.url, footerImageType: res.data.mimeType } }));
        else if (type === "signature")
          setSettings(p => ({ ...p, footer: { ...p.footer, signature: res.data.url, signatureType: res.data.mimeType } }));
        setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded!`);
        setTimeout(() => setSuccess(""), 3000);
      } else setError(`Failed to upload ${type}`);
    } catch { setError(`Failed to upload ${type}. Please try again.`); }
    finally { setUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setSaving(true);
    try {
      const res = await labReportSettings.updateSettings(user.lab, {
        header: { ...settings.header },
        footer: { ...settings.footer },
        styling: { ...settings.styling },
      });
      if (res.success) { setSuccess("Settings saved!"); setTimeout(() => setSuccess(""), 3000); }
      else setError("Failed to save settings");
    } catch { setError("Failed to save. Please try again."); }
    finally { setSaving(false); }
  };

  const headerDesigns = [
    { value: "classic",  label: "Classic",  desc: "Lab left · Doctor right", emoji: "🏛️" },
    { value: "centered", label: "Centered", desc: "Centered with accent rule", emoji: "📄" },
    { value: "modern",   label: "Modern",   desc: "Gradient banner + bar",    emoji: "🎨" },
    { value: "minimal",  label: "Minimal",  desc: "Clean accent underline",   emoji: "✨" },
  ];

  if (loading) return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <div className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
      {[...Array(3)].map((_, i) => <div key={i} className="h-64 rounded-2xl bg-gray-100 animate-pulse" />)}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 pb-12">

      {/* ── Header ── */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-800 to-blue-900 px-6 py-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <DocumentTextIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Report Settings</h1>
              <p className="text-sm text-slate-300 mt-0.5">Customize how your lab reports look when printed or exported</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPreviewMode(p => !p)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-slate-800 text-sm font-semibold rounded-xl hover:bg-slate-100 transition-colors shadow-sm"
          >
            <EyeIcon className="h-4 w-4" />
            {previewMode ? "Back to Edit" : "Preview"}
          </button>
        </div>
      </div>

      {/* ── Alerts ── */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <ExclamationCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3">
          <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {previewMode ? (
        <ReportPreview settings={settings} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── HEADER ── */}
          <SectionCard icon={BuildingOfficeIcon} title="Header Settings" subtitle="Appears at the top of every report page" accent="blue">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <Field label="Header Type">
                <select value={settings.header.headerMode || "generated"} onChange={e => hc("header","headerMode",e.target.value)} className={inputCls}>
                  <option value="generated">Generated (text-based)</option>
                  <option value="none">No Header</option>
                </select>
              </Field>
            </div>

            {/* Design picker */}
            {(settings.header.headerMode === "generated" || !settings.header.headerMode) && (
              <div className="mb-6">
                <label className={labelCls}>Header Design</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {headerDesigns.map(d => {
                    const active = (settings.header.headerDesign || "classic") === d.value;
                    return (
                      <button key={d.value} type="button" onClick={() => hc("header","headerDesign",d.value)}
                        className={`rounded-xl border-2 p-4 text-left transition-all ${active ? "border-blue-600 bg-blue-50 shadow-sm" : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"}`}>
                        <div className="text-2xl mb-2">{d.emoji}</div>
                        <div className={`text-sm font-bold ${active ? "text-blue-700" : "text-gray-800"}`}>{d.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{d.desc}</div>
                        {active && <div className="mt-2 h-1 w-6 bg-blue-600 rounded-full" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Lab info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <Field label="Lab Name *" hint="Displayed prominently in the header">
                <input type="text" className={inputCls} placeholder="e.g. City Diagnostic Lab"
                  value={settings.header.labName || ""} onChange={e => hc("header","labName",e.target.value)} />
              </Field>
              <Field label="Doctor / Pathologist Name *">
                <input type="text" className={inputCls} placeholder="e.g. Dr. Priya Sharma"
                  value={settings.header.doctorName || ""} onChange={e => hc("header","doctorName",e.target.value)} />
              </Field>
              <Field label="Registration Number">
                <input type="text" className={inputCls} placeholder="e.g. MCI-12345"
                  value={settings.header.registrationNo || ""} onChange={e => hc("header","registrationNo",e.target.value)} />
              </Field>
              <Field label="Phone">
                <input type="text" className={inputCls} placeholder="+91 98765 43210"
                  value={settings.header.phone || ""} onChange={e => hc("header","phone",e.target.value)} />
              </Field>
              <Field label="Email">
                <input type="email" className={inputCls} placeholder="lab@example.com"
                  value={settings.header.email || ""} onChange={e => hc("header","email",e.target.value)} />
              </Field>
            </div>
            <Field label="Address" className="mb-6">
              <textarea rows={2} className={inputCls} placeholder="123, Main Street, City, State - 400001"
                value={settings.header.address || ""} onChange={e => hc("header","address",e.target.value)} />
            </Field>

            {/* Technician sub-section */}
            <div className="rounded-xl bg-blue-50 border border-blue-100 px-5 py-4">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-4">Technician Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Technician Name">
                  <input type="text" className={inputCls} placeholder="e.g. Rahul Verma"
                    value={settings.header.technicianName || ""} onChange={e => hc("header","technicianName",e.target.value)} />
                </Field>
                <Field label="Technician Designation">
                  <input type="text" className={inputCls} placeholder="e.g. Lab Technician, DMLT"
                    value={settings.header.technicianDesignation || ""} onChange={e => hc("header","technicianDesignation",e.target.value)} />
                </Field>
              </div>
            </div>
          </SectionCard>

          {/* ── FOOTER ── */}
          <SectionCard icon={DocumentTextIcon} title="Footer Settings" subtitle="Appears at the bottom of every report page" accent="purple">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <Field label="Footer Type">
                <select value={settings.footer.footerMode || "generated"} onChange={e => hc("footer","footerMode",e.target.value)} className={inputCls}>
                  <option value="generated">Generated (text-based)</option>
                  <option value="image">Custom Image</option>
                  <option value="none">No Footer</option>
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <Field label="Verified By">
                <input type="text" className={inputCls} placeholder="e.g. Dr. Priya Sharma"
                  value={settings.footer.verifiedBy || ""} onChange={e => hc("footer","verifiedBy",e.target.value)} />
              </Field>
              <Field label="Designation">
                <input type="text" className={inputCls} placeholder="e.g. Consultant Pathologist"
                  value={settings.footer.designation || ""} onChange={e => hc("footer","designation",e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <ImageUpload label="Signature"
                hint="200 × 100 px · PNG with transparent background"
                value={settings.footer.signature} uploading={uploading}
                onUpload={f => handleFileUpload("signature", f)}
                onRemove={() => hc("footer","signature","")} />
              <ImageUpload label="Footer Image"
                hint="Used when Footer Type is 'Custom Image' · 2480 × 200 px @ 300 DPI"
                value={settings.footer.footerImage} uploading={uploading}
                onUpload={f => handleFileUpload("footer", f)}
                onRemove={() => { hc("footer","footerImage",""); hc("footer","footerImageType",""); }} />
            </div>
          </SectionCard>

          {/* ── STYLING ── */}
          <SectionCard icon={SwatchIcon} title="Colors & Styling" subtitle="Applied to the generated header and report accents" accent="amber">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              {[
                { id: "primaryColor",   label: "Primary Color",   hint: "Lab name, accents, borders" },
                { id: "secondaryColor", label: "Secondary Color", hint: "Sub-headings and secondary elements" },
              ].map(({ id, label, hint }) => (
                <div key={id}>
                  <label className={labelCls}>{label}</label>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <input type="color" value={settings.styling[id]}
                        onChange={e => setSettings(p => ({ ...p, styling: { ...p.styling, [id]: e.target.value } }))}
                        className="h-11 w-11 rounded-xl border border-gray-200 cursor-pointer p-1 shadow-sm" />
                    </div>
                    <div className="flex-1">
                      <input type="text" value={settings.styling[id]}
                        onChange={e => setSettings(p => ({ ...p, styling: { ...p.styling, [id]: e.target.value } }))}
                        className="w-full px-3 py-2.5 text-sm font-mono rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition" />
                    </div>
                    <div className="h-11 w-11 rounded-xl border border-gray-200 flex-shrink-0" style={{ background: settings.styling[id] }} />
                  </div>
                  <p className="mt-1.5 text-xs text-gray-400">{hint}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Font Family">
                <select value={settings.styling.fontFamily}
                  onChange={e => setSettings(p => ({ ...p, styling: { ...p.styling, fontFamily: e.target.value } }))}
                  className={inputCls}>
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="'Times New Roman', serif">Times New Roman</option>
                  <option value="'Helvetica Neue', sans-serif">Helvetica Neue</option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="'Courier New', monospace">Courier New</option>
                </select>
              </Field>
              <Field label="Font Size (pt)">
                <div className="flex items-center gap-3">
                  <input type="range" min="10" max="16" step="1"
                    value={settings.styling.fontSize}
                    onChange={e => setSettings(p => ({ ...p, styling: { ...p.styling, fontSize: parseInt(e.target.value) } }))}
                    className="flex-1 accent-blue-600" />
                  <span className="text-sm font-bold text-gray-700 w-8 text-center">{settings.styling.fontSize}</span>
                </div>
              </Field>
            </div>
          </SectionCard>

          {/* ── Save ── */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm">
              {saving ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Saving…</>
              ) : (
                <><CheckCircleIcon className="h-4 w-4" /> Save Settings</>
              )}
            </button>
          </div>

        </form>
      )}
    </div>
  );
}
