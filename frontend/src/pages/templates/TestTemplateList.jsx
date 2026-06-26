import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { testTemplates } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  PlusIcon, PencilSquareIcon, TrashIcon,
  MagnifyingGlassIcon, BeakerIcon, ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const TYPE_STYLES = {
  default: 'bg-blue-100 text-blue-700 border-blue-200',
  global:  'bg-green-100 text-green-700 border-green-200',
  local:   'bg-yellow-100 text-yellow-700 border-yellow-200',
};

const CAT_COLORS = {
  hematology:     'bg-red-50 text-red-700',
  biochemistry:   'bg-orange-50 text-orange-700',
  microbiology:   'bg-green-50 text-green-700',
  immunology:     'bg-purple-50 text-purple-700',
  pathology:      'bg-pink-50 text-pink-700',
  endocrinology:  'bg-yellow-50 text-yellow-700',
  serology:       'bg-teal-50 text-teal-700',
  urinalysis:     'bg-cyan-50 text-cyan-700',
  cardiology:     'bg-rose-50 text-rose-700',
  gastroenterology:'bg-lime-50 text-lime-700',
};

const CATEGORIES = [
  'hematology','biochemistry','microbiology','immunology',
  'pathology','endocrinology','serology','urinalysis','cardiology','gastroenterology',
];

export default function TestTemplateList() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters = {};
      if (searchTerm) filters.name = searchTerm;
      if (selectedCategory) filters.category = selectedCategory;
      const res = await testTemplates.getAll(filters);
      if (res.success) setTemplates(res.data);
      else setError('Failed to fetch test templates');
    } catch {
      setError('Failed to load test templates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, [selectedCategory]);

  const handleSearch = (e) => { e.preventDefault(); fetchTemplates(); };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await testTemplates.delete(deleteId);
      if (res.success) setTemplates(templates.filter(t => t._id !== deleteId));
      else setError('Failed to delete template');
    } catch {
      setError('Failed to delete template.');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const canEditDelete = (t) => {
    if (user?.role === 'super-admin') return true;
    if (t.templateType === 'default' || t.templateType === 'global' || t.isDefault) return false;
    return t.templateType === 'local' && t.lab === user?.lab;
  };

  const paramCount = (t) =>
    Array.isArray(t.sections) ? t.sections.reduce((a, s) => a + (s.parameters?.length || 0), 0) : 0;

  const getType = (t) => t.isDefault || t.templateType === 'default' ? 'default' : t.templateType || 'local';

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-5">
        <div className="h-32 rounded-2xl bg-gray-100 animate-pulse" />
        <div className="h-12 rounded-xl bg-gray-100 animate-pulse" />
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          {[...Array(6)].map((_, i) => <div key={i} className="h-14 border-b border-gray-50 animate-pulse bg-gray-50/50" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">

      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <BeakerIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Test Templates</h1>
              <p className="text-sm text-purple-100 mt-0.5">Manage test templates for lab reports</p>
            </div>
          </div>
          {(user?.role === 'super-admin' || user?.role === 'admin') && (
            <Link
              to="/templates/create"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-purple-700 text-sm font-semibold rounded-lg hover:bg-purple-50 transition-colors shadow-sm"
            >
              <PlusIcon className="h-4 w-4" /> Create Template
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            { label: 'Total', value: templates.length },
            { label: 'Default', value: templates.filter(t => t.isDefault || t.templateType === 'default').length },
            { label: 'Custom', value: templates.filter(t => t.templateType === 'local').length },
          ].map(s => (
            <div key={s.label} className="bg-white/15 rounded-xl px-3 py-2.5 text-center">
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-xs font-medium text-purple-100 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Search + category filter */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 space-y-3">
        <form onSubmit={handleSearch} className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by template name…"
            className="w-full pl-9 pr-24 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 focus:bg-white transition-all placeholder-gray-400"
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-purple-600 text-white text-xs font-semibold rounded-md hover:bg-purple-700 transition-colors">
            Search
          </button>
        </form>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${selectedCategory === '' ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-white'}`}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize ${selectedCategory === cat ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-white'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400 px-1">
        Showing <span className="font-semibold text-gray-600">{templates.length}</span> templates
        {selectedCategory && ` · ${selectedCategory}`}
      </p>

      {/* Table */}
      {templates.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <BeakerIcon className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-base font-semibold text-gray-700">No templates found</p>
          <p className="text-sm text-gray-400 mt-1 mb-5">
            {searchTerm || selectedCategory ? 'Try different filters' : 'Create your first test template'}
          </p>
          {!searchTerm && !selectedCategory && (user?.role === 'super-admin' || user?.role === 'admin') && (
            <Link to="/templates/create" className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition-colors">
              <PlusIcon className="h-4 w-4" /> Create Template
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Template', 'Category', 'Type', 'Params', 'Created By', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {templates.map(template => {
                  const type = getType(template);
                  return (
                    <tr key={template._id} className="hover:bg-purple-50/30 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <BeakerIcon className="h-4.5 w-4.5 text-purple-600" />
                          </div>
                          <Link to={`/templates/${template._id}`} className="text-sm font-semibold text-gray-900 hover:text-purple-600 transition-colors">
                            {template.templateName || template.name}
                          </Link>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold capitalize ${CAT_COLORS[template.category] || 'bg-gray-50 text-gray-600'}`}>
                          {template.category || 'General'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${TYPE_STYLES[type] || TYPE_STYLES.local}`}>
                          {type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-semibold text-gray-700">{paramCount(template)}</span>
                        <span className="text-xs text-gray-400 ml-1">params</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-500">{template.createdBy?.name || 'System'}</td>
                      <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            to={`/templates/${template._id}`}
                            className="h-7 w-7 rounded-lg flex items-center justify-center text-blue-500 hover:bg-blue-100 transition-colors"
                            title="View"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Link>
                          {canEditDelete(template) && (
                            <>
                              <Link to={`/templates/${template._id}/edit`} className="h-7 w-7 rounded-lg flex items-center justify-center text-green-600 hover:bg-green-100 transition-colors" title="Edit">
                                <PencilSquareIcon className="h-3.5 w-3.5" />
                              </Link>
                              <button onClick={() => setDeleteId(template._id)} className="h-7 w-7 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors" title="Delete">
                                <TrashIcon className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="h-11 w-11 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <TrashIcon className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Delete Template</h3>
                <p className="text-sm text-gray-500 mt-1">This action is permanent and cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={confirmDelete} disabled={isDeleting} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors">
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
