import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { testTemplates } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  BeakerIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const typeBadge = (template) => {
  if (template.isDefault || template.templateType === 'default') return <span className="badge badge-blue">Default</span>;
  if (template.templateType === 'global') return <span className="badge badge-green">Global</span>;
  if (template.templateType === 'local') return <span className="badge badge-yellow">Local</span>;
  return null;
};

const TestTemplateList = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const { user } = useAuth();

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'hematology', label: 'Hematology' },
    { value: 'biochemistry', label: 'Biochemistry' },
    { value: 'microbiology', label: 'Microbiology' },
    { value: 'immunology', label: 'Immunology' },
    { value: 'pathology', label: 'Pathology' },
    { value: 'endocrinology', label: 'Endocrinology' },
    { value: 'serology', label: 'Serology' },
    { value: 'urinalysis', label: 'Urinalysis' },
    { value: 'cardiology', label: 'Cardiology' },
    { value: 'gastroenterology', label: 'Gastroenterology' },
  ];

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters = {};
      if (searchTerm) filters.name = searchTerm;
      if (selectedCategory) filters.category = selectedCategory;
      const response = await testTemplates.getAll(filters);
      if (response.success) {
        setTemplates(response.data);
      } else {
        setError('Failed to fetch test templates');
      }
    } catch {
      setError('Failed to load test templates. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);
  useEffect(() => { fetchTemplates(); }, [selectedCategory]);

  const handleSearch = (e) => { e.preventDefault(); fetchTemplates(); };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      const response = await testTemplates.delete(id);
      if (response.success) setTemplates(templates.filter(t => t._id !== id));
      else setError('Failed to delete template');
    } catch {
      setError('Failed to delete template. Please try again later.');
    }
  };

  const canEditDelete = (template) => {
    if (user?.role === 'super-admin') return true;
    if (template.templateType === 'default' || template.templateType === 'global' || template.isDefault) return false;
    if (template.templateType === 'local' && template.lab === user?.lab) return true;
    return false;
  };

  return (
    <div className="page-enter space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Test Templates</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage test templates for your lab reports</p>
        </div>
        {(user?.role === 'super-admin' || user?.role === 'admin') && (
          <Link to="/templates/create" className="btn btn-primary">
            <PlusIcon className="h-4 w-4" />
            Create Template
          </Link>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="sm:w-52">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="input select"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by template name..."
              className="input pl-9"
            />
          </div>
          <button type="submit" className="btn btn-secondary">Search</button>
        </form>
      </div>

      {/* Table */}
      {loading ? (
        <div className="card p-5 space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-12 skeleton" />)}
        </div>
      ) : templates.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <BeakerIcon className="h-12 w-12 text-slate-300 mb-3" />
            <p className="text-base font-medium text-slate-600">No test templates found</p>
            <p className="text-sm text-slate-400 mt-1">
              {searchTerm || selectedCategory ? 'Try different filters' : 'Create your first template to get started'}
            </p>
            {!searchTerm && !selectedCategory && (user?.role === 'super-admin' || user?.role === 'admin') && (
              <Link to="/templates/create" className="btn btn-primary mt-4">
                <PlusIcon className="h-4 w-4" />
                Create Template
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="table-wrapper overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Template Name</th>
                <th>Category</th>
                <th>Type</th>
                <th>Parameters</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map(template => (
                <tr key={template._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                        <BeakerIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <Link to={`/templates/${template._id}`} className="font-medium text-slate-900 hover:text-blue-600 transition-colors">
                        {template.templateName || template.name}
                      </Link>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-blue">
                      {template.category ? (template.category.charAt(0).toUpperCase() + template.category.slice(1)) : 'General'}
                    </span>
                  </td>
                  <td>{typeBadge(template)}</td>
                  <td className="text-slate-500 text-sm">
                    {Array.isArray(template.sections)
                      ? template.sections.reduce((acc, s) => acc + (s.parameters?.length || 0), 0)
                      : 0} params
                  </td>
                  <td className="text-slate-500 text-sm">{template.createdBy?.name || 'System'}</td>
                  <td>
                    <div className="flex gap-1">
                      <Link to={`/templates/${template._id}`} className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors" title="View">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>
                      {canEditDelete(template) && (
                        <>
                          <Link to={`/templates/${template._id}/edit`} className="p-1.5 rounded hover:bg-green-50 text-green-600 transition-colors" title="Edit">
                            <PencilSquareIcon className="h-4 w-4" />
                          </Link>
                          <button onClick={() => handleDelete(template._id)} className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors" title="Delete">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TestTemplateList;
