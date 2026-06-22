import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DocumentDuplicateIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { testTemplates } from '../../utils/api';
import { TEST_CATEGORIES } from '../../utils/constants';
import {
  FormShell, FormSection, FormGrid, FormField,
  Input, Select, Textarea, Alert, FormActions,
} from '../../components/common/FormShell';

const SAMPLE_TYPES = ['Blood', 'Serum', 'Plasma', 'Urine', 'CSF', 'Stool', 'Sputum', 'Swab', 'Tissue', 'Other'];
const emptyParam = () => ({ parameter: '', unit: '', reference_range: '' });

export default function EditTestTemplate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '', sampleType: '', category: '', description: '',
    fields: [emptyParam()],
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await testTemplates.getById(id);
        if (!res.success) { setError('Failed to load template.'); return; }
        const t = res.data;
        if (t.isDefault) { setError('Default templates cannot be edited.'); return; }

        // Support both old (sections) and new (fields) data shapes
        let fields = [emptyParam()];
        if (Array.isArray(t.fields) && t.fields.length > 0) {
          fields = t.fields.map(f => ({
            parameter: f.parameter || f.name || '',
            unit: f.unit || '',
            reference_range: f.reference_range || f.normalRange || '',
          }));
        } else if (Array.isArray(t.sections) && t.sections.length > 0) {
          fields = t.sections.flatMap(s =>
            (s.parameters || []).map(p => ({
              parameter: p.name || '',
              unit: p.unit || '',
              reference_range: p.normalRange || '',
            }))
          );
          if (!fields.length) fields = [emptyParam()];
        }

        setFormData({
          name: t.templateName || t.name || '',
          sampleType: t.sampleType || '',
          category: t.category || '',
          description: t.description || '',
          fields,
        });
      } catch { setError('Failed to load template.'); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const setField = (k, v) => setFormData(p => ({ ...p, [k]: v }));
  const updateParam = (i, k, v) =>
    setFormData(p => { const f = [...p.fields]; f[i] = { ...f[i], [k]: v }; return { ...p, fields: f }; });
  const addParam = () => setFormData(p => ({ ...p, fields: [...p.fields, emptyParam()] }));
  const removeParam = (i) => setFormData(p => ({ ...p, fields: p.fields.length > 1 ? p.fields.filter((_, idx) => idx !== i) : p.fields }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const valid = formData.fields.filter(f => f.parameter.trim());
    if (!valid.length) { setError('Add at least one parameter.'); return; }
    setSaving(true); setError('');
    try {
      const res = await testTemplates.update(id, { ...formData, fields: valid });
      if (res.success) navigate(`/templates/${id}`);
      else setError(res.message || 'Failed to update template');
    } catch { setError('Failed to update template. Please try again.'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-4">
      {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-10 rounded-lg" />)}
    </div>
  );

  if (error === 'Default templates cannot be edited.') return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <Alert type="warning">
        <p className="font-semibold">Cannot edit default template</p>
        <p className="text-sm mt-1">Default templates are system templates and cannot be modified.</p>
        <button onClick={() => navigate('/templates')} className="btn btn-secondary btn-sm mt-3">Back to Templates</button>
      </Alert>
    </div>
  );

  return (
    <FormShell icon={DocumentDuplicateIcon} title="Edit Test Template" subtitle="Update template parameters" backTo="/templates">
      <form onSubmit={handleSubmit}>
        <FormSection title="Template Info">
          {error && <Alert type="error">{error}</Alert>}
          <FormGrid cols={3}>
            <FormField label="Template Name" required>
              <Input placeholder="e.g. Liver Function Test" value={formData.name}
                onChange={(e) => setField('name', e.target.value)} required />
            </FormField>
            <FormField label="Sample Type" required>
              <Select value={formData.sampleType} onChange={(e) => setField('sampleType', e.target.value)} required>
                <option value="">Select</option>
                {SAMPLE_TYPES.map(s => <option key={s} value={s.toLowerCase()}>{s}</option>)}
              </Select>
            </FormField>
            <FormField label="Category" required>
              <Select value={formData.category} onChange={(e) => setField('category', e.target.value)} required>
                <option value="">Select</option>
                {Object.entries(TEST_CATEGORIES).map(([k, v]) => (
                  <option key={v} value={v}>{k.charAt(0) + k.slice(1).toLowerCase().replace('_', ' ')}</option>
                ))}
              </Select>
            </FormField>
          </FormGrid>
          <FormField label="Description" hint="optional">
            <Textarea rows={2} placeholder="Brief description" value={formData.description}
              onChange={(e) => setField('description', e.target.value)} />
          </FormField>
        </FormSection>

        <FormSection title={`Test Parameters (${formData.fields.length})`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-2 px-3 font-medium text-slate-600 w-6">#</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-600">Parameter Name <span className="text-red-500">*</span></th>
                  <th className="text-left py-2 px-3 font-medium text-slate-600 w-28">Unit</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-600 w-40">Reference Range</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {formData.fields.map((field, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-1.5 px-3 text-slate-400 text-xs">{i + 1}</td>
                    <td className="py-1.5 px-2">
                      <Input placeholder="e.g. SGPT" value={field.parameter}
                        onChange={(e) => updateParam(i, 'parameter', e.target.value)} />
                    </td>
                    <td className="py-1.5 px-2">
                      <Input placeholder="e.g. U/L" value={field.unit}
                        onChange={(e) => updateParam(i, 'unit', e.target.value)} />
                    </td>
                    <td className="py-1.5 px-2">
                      <Input placeholder="e.g. 7-56" value={field.reference_range}
                        onChange={(e) => updateParam(i, 'reference_range', e.target.value)} />
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      <button type="button" onClick={() => removeParam(i)} disabled={formData.fields.length === 1}
                        className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 transition">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={addParam} className="mt-3 btn btn-secondary btn-sm">
            <PlusIcon className="h-4 w-4" /> Add Parameter
          </button>
        </FormSection>

        <FormActions onCancel={() => navigate(`/templates/${id}`)} submitLabel="Save Changes" loadingLabel="Saving…" loading={saving} />
      </form>
    </FormShell>
  );
}
