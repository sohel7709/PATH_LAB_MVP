import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DocumentDuplicateIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { testTemplates } from '../../utils/api';
import { TEST_CATEGORIES } from '../../utils/constants';
import {
  FormShell, FormSection, FormGrid, FormField,
  Input, Select, Textarea, Alert, FormActions,
} from '../../components/common/FormShell';

const SAMPLE_TYPES = ['Blood', 'Serum', 'Plasma', 'Urine', 'CSF', 'Stool', 'Sputum', 'Swab', 'Tissue', 'Other'];

const emptyParam = () => ({ parameter: '', unit: '', reference_range: '' });

export default function CreateTestTemplate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '', sampleType: '', category: '', description: '',
    fields: [emptyParam()],
  });

  const setField = (k, v) => setFormData(p => ({ ...p, [k]: v }));

  const updateParam = (i, k, v) =>
    setFormData(p => { const f = [...p.fields]; f[i] = { ...f[i], [k]: v }; return { ...p, fields: f }; });

  const addParam = () => setFormData(p => ({ ...p, fields: [...p.fields, emptyParam()] }));

  const removeParam = (i) => setFormData(p => ({ ...p, fields: p.fields.filter((_, idx) => idx !== i) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const valid = formData.fields.filter(f => f.parameter.trim());
    if (!valid.length) { setError('Add at least one test parameter.'); return; }
    setLoading(true); setError('');
    try {
      const res = await testTemplates.create({ ...formData, fields: valid });
      if (res.success) navigate('/templates');
      else setError(res.message || 'Failed to create template');
    } catch { setError('Failed to create template. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <FormShell icon={DocumentDuplicateIcon} title="Create Test Template" subtitle="Define a reusable test structure" backTo="/templates">
      <form onSubmit={handleSubmit}>
        <FormSection title="Template Info">
          {error && <Alert type="error">{error}</Alert>}
          <FormGrid cols={3}>
            <FormField label="Template Name" required>
              <Input placeholder="e.g. Liver Function Test" value={formData.name}
                onChange={(e) => setField('name', e.target.value)} required autoFocus />
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
            <Textarea rows={2} placeholder="Brief description of this test" value={formData.description}
              onChange={(e) => setField('description', e.target.value)} />
          </FormField>
        </FormSection>

        {/* Parameters table */}
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
                      <Input placeholder="e.g. SGPT (ALT)" value={field.parameter}
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
          <button type="button" onClick={addParam}
            className="mt-3 btn btn-secondary btn-sm">
            <PlusIcon className="h-4 w-4" /> Add Parameter
          </button>
        </FormSection>

        <FormActions onCancel={() => navigate('/templates')} submitLabel="Create Template" loadingLabel="Creating…" loading={loading} />
      </form>
    </FormShell>
  );
}
