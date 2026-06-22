import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

/**
 * Consistent wrapper for all create/edit forms.
 * Replaces full-screen gradient backgrounds with a compact centered card.
 */
export function FormShell({ icon: Icon, title, subtitle, backTo, children }) {
  const navigate = useNavigate();
  return (
    <div className="page-enter max-w-2xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        {backTo && (
          <button
            type="button"
            onClick={() => navigate(backTo)}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
        )}
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Icon className="h-5 w-5 text-blue-600" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {/* Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {children}
      </div>
    </div>
  );
}

/** Labelled section inside FormShell */
export function FormSection({ title, children }) {
  return (
    <div className="px-6 py-5 border-b border-slate-100 last:border-b-0">
      {title && (
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">{title}</p>
      )}
      {children}
    </div>
  );
}

/** 2-column responsive grid */
export function FormGrid({ cols = 2, children }) {
  const colClass = cols === 3 ? 'grid-cols-1 sm:grid-cols-3'
    : cols === 4 ? 'grid-cols-2 sm:grid-cols-4'
    : 'grid-cols-1 sm:grid-cols-2';
  return <div className={`grid ${colClass} gap-4`}>{children}</div>;
}

/** Single field wrapper */
export function FormField({ label, required, hint, error, children, span }) {
  return (
    <div className={span ? `sm:col-span-${span}` : ''}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

/** Standard text input */
export function Input({ className = '', ...props }) {
  return (
    <input
      className={`input ${className}`}
      {...props}
    />
  );
}

/** Standard select */
export function Select({ children, className = '', ...props }) {
  return (
    <select className={`input select ${className}`} {...props}>
      {children}
    </select>
  );
}

/** Standard textarea */
export function Textarea({ className = '', ...props }) {
  return (
    <textarea
      className={`input resize-none ${className}`}
      {...props}
    />
  );
}

/** Toggle switch */
export function Toggle({ label, description, checked, onChange }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <div className="flex-shrink-0 mt-0.5">
        <button
          type="button"
          onClick={() => onChange(!checked)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-200'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
      </div>
      <div>
        <div className="text-sm font-medium text-slate-700">{label}</div>
        {description && <div className="text-xs text-slate-400 mt-0.5">{description}</div>}
      </div>
    </label>
  );
}

/** Alert banner */
export function Alert({ type = 'error', children }) {
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${styles[type]}`}>
      {children}
    </div>
  );
}

/** Bottom action bar */
export function FormActions({ onCancel, cancelLabel = 'Cancel', submitLabel = 'Save', loading, loadingLabel, extra }) {
  return (
    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
      <div>{extra}</div>
      <div className="flex items-center gap-3">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            {cancelLabel}
          </button>
        )}
        <button type="submit" disabled={loading} className="btn btn-primary min-w-[100px]">
          {loading ? (
            <>
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {loadingLabel || 'Saving…'}
            </>
          ) : submitLabel}
        </button>
      </div>
    </div>
  );
}
