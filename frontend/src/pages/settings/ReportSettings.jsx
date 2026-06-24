import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { labReportSettings } from "../../utils/api";
import {
  DocumentTextIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  PhotoIcon,
  PencilSquareIcon,
  SwatchIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import ReportPreview from "../../components/reports/ReportPreview";

// ── reusable primitives ──────────────────────────────────────────────────────

const SectionCard = ({ icon: Icon, title, subtitle, children }) => (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50">
      {Icon && <Icon className="h-5 w-5 text-blue-600 flex-shrink-0" />}
      <div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    <div className="px-6 py-5">{children}</div>
  </div>
);

const Field = ({ label, hint, children, span = "col-span-1" }) => (
  <div className={span}>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {children}
    {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
  </div>
);

const inputCls =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition";

const selectCls =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition";

// ── image upload widget ───────────────────────────────────────────────────────

const ImageUpload = ({ label, hint, value, onUpload, onRemove, uploading }) => {
  const ref = useRef(null);
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {value ? (
            <div className="relative inline-block">
              <img
                src={value}
                alt={label}
                className="h-20 max-w-[160px] object-contain rounded-lg border border-gray-200 bg-gray-50 p-1"
              />
              <button
                type="button"
                onClick={onRemove}
                className="absolute -top-2 -right-2 bg-white rounded-full border border-red-200 text-red-500 hover:bg-red-50 p-0.5 shadow-sm"
              >
                <XCircleIcon className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="h-20 w-36 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
              <PhotoIcon className="h-7 w-7 mb-1" />
              <span className="text-xs">No image</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            type="file"
            ref={ref}
            className="hidden"
            accept="image/png,image/jpeg,image/jpg"
            onChange={(e) => onUpload(e.target.files[0])}
          />
          <button
            type="button"
            onClick={() => ref.current.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 transition"
          >
            <ArrowUpTrayIcon className="h-4 w-4" />
            {uploading ? "Uploading…" : "Upload"}
          </button>
          {hint && <p className="text-xs text-gray-400 max-w-xs">{hint}</p>}
        </div>
      </div>
    </div>
  );
};

// ── main component ────────────────────────────────────────────────────────────

const ReportSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [previewMode, setPreviewMode] = useState(false);

  const [settings, setSettings] = useState({
    header: {
      headerMode: "generated",
      headerDesign: "classic",
      labName: "",
      doctorName: "",
      registrationNo: "",
      technicianName: "",
      technicianDesignation: "",
      address: "",
      phone: "",
      email: "",
    },
    footer: {
      footerMode: "generated",
      verifiedBy: "",
      designation: "Consultant Pathologist",
      signature: "",
      signatureType: "",
      footerImage: "",
      footerImageType: "",
    },
    styling: {
      primaryColor: "#2563eb",
      secondaryColor: "#1e40af",
      fontFamily: "Arial, sans-serif",
      fontSize: 12,
    },
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        if (!user?.lab) { setError("No lab associated with your account"); return; }
        const res = await labReportSettings.getSettings(user.lab);
        if (res.success) setSettings(res.data);
        else setError("Failed to fetch report settings");
      } catch { setError("Failed to load report settings. Please try again later."); }
      finally { setLoading(false); }
    };
    fetch();
  }, [user]);

  const handleChange = (section, field, value) =>
    setSettings((p) => ({ ...p, [section]: { ...p[section], [field]: value } }));

  const handleFileUpload = async (type, file) => {
    if (!file) return;
    const valid = ["image/png", "image/jpeg", "image/jpg"];
    if (!valid.includes(file.type)) { setError("Please upload a PNG or JPG image."); return; }
    setError(""); setUploading(true);
    try {
      const res = await labReportSettings.uploadImage(user.lab, file, type);
      if (res.success) {
        if (type === "footer")
          setSettings((p) => ({ ...p, footer: { ...p.footer, footerImage: res.data.url, footerImageType: res.data.mimeType } }));
        else if (type === "signature")
          setSettings((p) => ({ ...p, footer: { ...p.footer, signature: res.data.url, signatureType: res.data.mimeType } }));
        setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully`);
        setTimeout(() => setSuccess(""), 3000);
      } else setError(`Failed to upload ${type}`);
    } catch { setError(`Failed to upload ${type}. Please try again.`); }
    finally { setUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setSaving(true);
    try {
      const payload = {
        header: {
          headerMode: settings.header.headerMode,
          headerDesign: settings.header.headerDesign || "classic",
          labName: settings.header.labName,
          doctorName: settings.header.doctorName,
          registrationNo: settings.header.registrationNo,
          technicianName: settings.header.technicianName,
          technicianDesignation: settings.header.technicianDesignation,
          address: settings.header.address,
          phone: settings.header.phone,
          email: settings.header.email,
        },
        footer: {
          footerMode: settings.footer.footerMode,
          verifiedBy: settings.footer.verifiedBy,
          designation: settings.footer.designation,
          signature: settings.footer.signature,
          signatureType: settings.footer.signatureType,
          footerImage: settings.footer.footerImage,
          footerImageType: settings.footer.footerImageType,
        },
        styling: { primaryColor: settings.styling.primaryColor, secondaryColor: settings.styling.secondaryColor, fontFamily: settings.styling.fontFamily, fontSize: settings.styling.fontSize },
      };
      const res = await labReportSettings.updateSettings(user.lab, payload);
      if (res.success) { setSuccess("Settings saved successfully!"); setTimeout(() => setSuccess(""), 3000); }
      else setError("Failed to save settings");
    } catch { setError("Failed to save settings. Please try again."); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="text-sm text-gray-500">Loading settings…</p>
      </div>
    </div>
  );

  const headerDesigns = [
    { value: "classic",  label: "Classic",  desc: "Lab left · Doctor right",          preview: "🏛️" },
    { value: "centered", label: "Centered", desc: "Centered name + accent rule",      preview: "📄" },
    { value: "modern",   label: "Modern",   desc: "Gradient banner + contact bar",    preview: "🎨" },
    { value: "minimal",  label: "Minimal",  desc: "Accent bar · gradient underline",  preview: "✨" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DocumentTextIcon className="h-7 w-7 text-blue-600" />
            Report Settings
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Customize how your lab reports look when printed or exported as PDF.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPreviewMode((p) => !p)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition"
        >
          <EyeIcon className="h-4 w-4" />
          {previewMode ? "Back to Edit" : "Preview Report"}
        </button>
      </div>

      {/* ── Alerts ── */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <ExclamationCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3">
          <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {previewMode ? (
        <ReportPreview settings={settings} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── HEADER ── */}
          <SectionCard icon={PencilSquareIcon} title="Header Settings" subtitle="Appears at the top of every report page">

            {/* Header type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
              <Field label="Header Type">
                <select
                  value={settings.header.headerMode || "generated"}
                  onChange={(e) => handleChange("header", "headerMode", e.target.value)}
                  className={selectCls}
                >
                  <option value="generated">Generated (text-based)</option>
                  <option value="none">No Header</option>
                </select>
              </Field>
            </div>

            {/* Design picker — only for generated mode */}
            {(settings.header.headerMode === "generated" || !settings.header.headerMode) && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Header Design</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {headerDesigns.map((d) => {
                    const active = (settings.header.headerDesign || "classic") === d.value;
                    return (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => handleChange("header", "headerDesign", d.value)}
                        className={`rounded-xl border-2 p-3 text-left transition-all ${
                          active
                            ? "border-blue-600 bg-blue-50 shadow-sm"
                            : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="text-2xl mb-1">{d.preview}</div>
                        <div className={`text-sm font-semibold ${active ? "text-blue-700" : "text-gray-800"}`}>{d.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{d.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Lab & Doctor info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <Field label="Lab Name" hint="Displayed prominently in the header">
                <input type="text" className={inputCls} placeholder="e.g. City Diagnostic Lab"
                  value={settings.header.labName || ""}
                  onChange={(e) => handleChange("header", "labName", e.target.value)} />
              </Field>
              <Field label="Doctor / Pathologist Name">
                <input type="text" className={inputCls} placeholder="e.g. Dr. Priya Sharma"
                  value={settings.header.doctorName || ""}
                  onChange={(e) => handleChange("header", "doctorName", e.target.value)} />
              </Field>
              <Field label="Registration Number">
                <input type="text" className={inputCls} placeholder="e.g. MCI-12345"
                  value={settings.header.registrationNo || ""}
                  onChange={(e) => handleChange("header", "registrationNo", e.target.value)} />
              </Field>
              <Field label="Phone">
                <input type="text" className={inputCls} placeholder="e.g. +91 98765 43210"
                  value={settings.header.phone || ""}
                  onChange={(e) => handleChange("header", "phone", e.target.value)} />
              </Field>
              <Field label="Email">
                <input type="email" className={inputCls} placeholder="e.g. lab@example.com"
                  value={settings.header.email || ""}
                  onChange={(e) => handleChange("header", "email", e.target.value)} />
              </Field>
            </div>

            {/* Address full-width */}
            <div className="mb-6">
              <Field label="Address">
                <textarea rows={2} className={inputCls} placeholder="123, Main Street, City, State - 400001"
                  value={settings.header.address || ""}
                  onChange={(e) => handleChange("header", "address", e.target.value)} />
              </Field>
            </div>

            {/* Technician */}
            <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-4 mb-6">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3">Technician Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Technician Name">
                  <input type="text" className={inputCls} placeholder="e.g. Rahul Verma"
                    value={settings.header.technicianName || ""}
                    onChange={(e) => handleChange("header", "technicianName", e.target.value)} />
                </Field>
                <Field label="Technician Designation">
                  <input type="text" className={inputCls} placeholder="e.g. Lab Technician, DMLT"
                    value={settings.header.technicianDesignation || ""}
                    onChange={(e) => handleChange("header", "technicianDesignation", e.target.value)} />
                </Field>
              </div>
            </div>

          </SectionCard>

          {/* ── FOOTER ── */}
          <SectionCard icon={DocumentTextIcon} title="Footer Settings" subtitle="Appears at the bottom of every report page">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
              <Field label="Footer Type">
                <select
                  value={settings.footer.footerMode || "generated"}
                  onChange={(e) => handleChange("footer", "footerMode", e.target.value)}
                  className={selectCls}
                >
                  <option value="generated">Generated (text-based)</option>
                  <option value="image">Custom Image</option>
                  <option value="none">No Footer</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <Field label="Verified By">
                <input type="text" className={inputCls} placeholder="e.g. Dr. Priya Sharma"
                  value={settings.footer.verifiedBy || ""}
                  onChange={(e) => handleChange("footer", "verifiedBy", e.target.value)} />
              </Field>
              <Field label="Designation">
                <input type="text" className={inputCls} placeholder="e.g. Consultant Pathologist"
                  value={settings.footer.designation || ""}
                  onChange={(e) => handleChange("footer", "designation", e.target.value)} />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <ImageUpload
                label="Signature"
                hint="Recommended: 200 × 100 px · PNG with transparent background"
                value={settings.footer.signature}
                uploading={uploading}
                onUpload={(f) => handleFileUpload("signature", f)}
                onRemove={() => handleChange("footer", "signature", "")}
              />
              <ImageUpload
                label="Footer Image (used when mode is 'Custom Image')"
                hint="Recommended: 2480 × 200 px @ 300 DPI · PNG or JPG"
                value={settings.footer.footerImage}
                uploading={uploading}
                onUpload={(f) => handleFileUpload("footer", f)}
                onRemove={() => { handleChange("footer", "footerImage", ""); handleChange("footer", "footerImageType", ""); }}
              />
            </div>
          </SectionCard>

          {/* ── STYLING ── */}
          <SectionCard icon={SwatchIcon} title="Styling" subtitle="Colors applied to the generated header design">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { id: "primaryColor", label: "Primary Color", hint: "Used for lab name and accents" },
                { id: "secondaryColor", label: "Secondary Color", hint: "Used for sub-headings" },
              ].map(({ id, label, hint }) => (
                <div key={id}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.styling[id]}
                      onChange={(e) => setSettings((p) => ({ ...p, styling: { ...p.styling, [id]: e.target.value } }))}
                      className="h-10 w-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
                    />
                    <span className="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-md">{settings.styling[id]}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">{hint}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* ── Save button ── */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {saving && <span className="text-sm text-gray-500">Saving…</span>}
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 transition"
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving…
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4" />
                  Save Settings
                </>
              )}
            </button>
          </div>

        </form>
      )}
    </div>
  );
};

export default ReportSettings;
