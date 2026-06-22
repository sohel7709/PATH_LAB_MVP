import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { testTemplates } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  TrashIcon,
  BeakerIcon,
  DocumentDuplicateIcon,
  ExclamationCircleIcon,
  CalendarDaysIcon,
  BuildingOfficeIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

const ParametersTable = ({ fields }) => (
  <div className="table-wrapper">
    <table className="table">
      <thead>
        <tr>
          <th className="w-10">#</th>
          <th>Parameter Name</th>
          <th>Unit</th>
          <th>Reference Range</th>
        </tr>
      </thead>
      <tbody>
        {fields.map((field, index) => (
          <tr key={index}>
            <td className="text-sm" style={{ color: 'var(--text-muted)' }}>{index + 1}</td>
            <td className="text-sm font-medium" style={{ color: 'var(--text)' }}>{field.parameter}</td>
            <td className="text-sm" style={{ color: 'var(--text-2)' }}>{field.unit || '—'}</td>
            <td className="text-sm" style={{ color: 'var(--text-2)' }}>{field.reference_range || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const CollapsibleSection = ({ name, fields }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3 text-left transition-colors hover:opacity-80"
        style={{ background: 'var(--surface-2)' }}
      >
        <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{name}</span>
        {open
          ? <ChevronDownIcon className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
          : <ChevronRightIcon className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
        }
      </button>
      {open && <ParametersTable fields={fields} />}
    </div>
  );
};

const ViewTestTemplate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super-admin';

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await testTemplates.getById(id);
        setTemplate(data);
      } catch (err) {
        setError('Failed to load template details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchTemplate();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      try {
        setLoading(true);
        await testTemplates.delete(id);
        navigate('/templates');
      } catch (err) {
        setError('Failed to delete template. Please try again later.');
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="page-enter max-w-5xl mx-auto px-4 py-6 space-y-4">
        <div className="skeleton h-10 rounded-lg w-1/3" />
        <div className="card p-6 space-y-3">
          <div className="skeleton h-5 rounded w-1/4" />
          <div className="skeleton h-4 rounded w-3/4" />
          <div className="skeleton h-4 rounded w-1/2" />
        </div>
        <div className="card overflow-hidden">
          <div className="skeleton h-12 rounded-none" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 px-5 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className="skeleton h-4 rounded flex-1" />
              <div className="skeleton h-4 rounded w-20" />
              <div className="skeleton h-4 rounded w-28" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-enter max-w-5xl mx-auto px-4 py-6">
        <div className="alert alert-error flex items-start gap-3">
          <ExclamationCircleIcon className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">{error}</p>
            <button
              type="button"
              onClick={() => navigate('/templates')}
              className="btn btn-secondary btn-sm mt-3"
            >
              Back to Templates
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="page-enter max-w-5xl mx-auto px-4 py-6">
        <div className="empty-state py-16">
          <BeakerIcon className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-medium" style={{ color: 'var(--text)' }}>Template not found</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            The template you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <button
            type="button"
            onClick={() => navigate('/templates')}
            className="btn btn-primary btn-sm mt-4"
          >
            Back to Templates
          </button>
        </div>
      </div>
    );
  }

  const hasFields = template.fields && template.fields.length > 0;
  const hasSections = template.sections && Object.keys(template.sections).length > 0;

  return (
    <div className="page-enter max-w-5xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <BeakerIcon className="h-7 w-7 shrink-0" style={{ color: 'var(--primary)' }} />
            <h1 className="text-2xl font-bold truncate" style={{ color: 'var(--text)' }}>{template.name}</h1>
            {template.isDefault && <span className="badge badge-green">Default</span>}
          </div>
          <div className="flex flex-wrap gap-2 mt-2 ml-10">
            {template.category && (
              <span className="badge badge-blue capitalize">{template.category}</span>
            )}
            {template.sampleType && (
              <span className="badge badge-gray">{template.sampleType}</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/templates')}
            className="btn btn-secondary btn-sm inline-flex items-center gap-1.5"
          >
            <ArrowLeftIcon className="h-4 w-4" /> Back
          </button>
          <Link
            to={`/reports/create?templateId=${id}`}
            className="btn btn-primary btn-sm inline-flex items-center gap-1.5"
          >
            <PlusIcon className="h-4 w-4" /> Use Template
          </Link>
          {isSuperAdmin && (
            <>
              <Link
                to={`/templates/${id}/edit`}
                className="btn btn-secondary btn-sm inline-flex items-center gap-1.5"
              >
                <PencilSquareIcon className="h-4 w-4" /> Edit
              </Link>
              <button
                type="button"
                onClick={handleDelete}
                className="btn btn-danger btn-sm inline-flex items-center gap-1.5"
              >
                <TrashIcon className="h-4 w-4" /> Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Template details card */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
          Template Details
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="detail-row">
            <dt className="detail-label">Template Name</dt>
            <dd className="detail-value font-medium">{template.name}</dd>
          </div>
          <div className="detail-row">
            <dt className="detail-label">Category</dt>
            <dd className="detail-value capitalize">{template.category || 'N/A'}</dd>
          </div>
          <div className="detail-row">
            <dt className="detail-label">Sample Type</dt>
            <dd className="detail-value">{template.sampleType || 'N/A'}</dd>
          </div>
          <div className="detail-row">
            <dt className="detail-label">Created By</dt>
            <dd className="detail-value">{template.createdBy?.name || 'System'}</dd>
          </div>
          <div className="detail-row">
            <dt className="detail-label flex items-center gap-1">
              <CalendarDaysIcon className="h-3.5 w-3.5" /> Created
            </dt>
            <dd className="detail-value">{formatDate(template.createdAt)}</dd>
          </div>
          <div className="detail-row">
            <dt className="detail-label flex items-center gap-1">
              <CalendarDaysIcon className="h-3.5 w-3.5" /> Last Updated
            </dt>
            <dd className="detail-value">{formatDate(template.updatedAt)}</dd>
          </div>
          {isSuperAdmin && template.lab && (
            <div className="detail-row sm:col-span-2">
              <dt className="detail-label flex items-center gap-1">
                <BuildingOfficeIcon className="h-3.5 w-3.5" /> Associated Lab
              </dt>
              <dd className="detail-value">{template.lab.name || 'Unknown Lab'}</dd>
            </div>
          )}
          {template.description && (
            <div className="sm:col-span-2">
              <dt className="detail-label mb-1">Description</dt>
              <dd className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-2)' }}>{template.description}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Parameters section */}
      {hasFields && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>Test Parameters</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Standard parameters included in this template
            </p>
          </div>
          <ParametersTable fields={template.fields} />
        </div>
      )}

      {/* Sections */}
      {hasSections && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>Test Sections</h2>
          {Object.entries(template.sections).map(([sectionName, fields], sectionIndex) => (
            <CollapsibleSection key={sectionIndex} name={sectionName} fields={fields} />
          ))}
        </div>
      )}

      {/* No parameters */}
      {!hasFields && !hasSections && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>Test Parameters</h2>
          </div>
          <div className="empty-state py-12">
            <BeakerIcon className="h-10 w-10 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
            <p className="font-medium" style={{ color: 'var(--text)' }}>No Parameters Defined</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              This test template has no parameters or sections defined.
            </p>
            {isSuperAdmin && (
              <Link
                to={`/templates/${id}/edit`}
                className="btn btn-primary btn-sm mt-4 inline-flex items-center gap-1.5"
              >
                <PencilSquareIcon className="h-4 w-4" /> Edit Template to Add Parameters
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewTestTemplate;
