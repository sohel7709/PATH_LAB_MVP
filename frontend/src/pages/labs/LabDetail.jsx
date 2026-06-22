import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { superAdmin } from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import { DATE_FORMATS } from '../../utils/constants';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  ArrowLeftIcon,
  PencilSquareIcon,
  TrashIcon,
  UsersIcon,
  DocumentTextIcon,
  UserIcon,
  ExclamationCircleIcon,
  CalendarDaysIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

const LabDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lab, setLab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ totalUsers: 0, totalPatients: 0, totalReports: 0 });
  const [labUsers, setLabUsers] = useState([]);

  useEffect(() => {
    const fetchLabDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await superAdmin.getLab(id);

        if (response.success) {
          setLab(response.data);

          try {
            const statsResponse = await superAdmin.getLabStats(id);
            if (statsResponse.success) setStats(statsResponse.data);
          } catch (statsErr) {}

          try {
            const usersResponse = await superAdmin.getUsers({ lab: id });
            if (usersResponse.success) setLabUsers(usersResponse.data || []);
          } catch (usersErr) {}
        } else {
          setError(response.message || 'Failed to fetch lab details');
        }
      } catch (err) {
        setError(err.message || 'An error occurred while fetching lab details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchLabDetails();
    } else {
      setError('No lab ID provided');
      setLoading(false);
    }
  }, [id]);

  const handleDeleteLab = async () => {
    if (!window.confirm('Are you sure you want to delete this lab? This action cannot be undone.')) return;
    try {
      const response = await superAdmin.deleteLab(id);
      if (response.success) {
        navigate('/labs');
      } else {
        alert(response.message || 'Failed to delete lab');
      }
    } catch (err) {
      alert(err.message || 'An error occurred while deleting the lab');
    }
  };

  if (loading) {
    return (
      <div className="page-enter max-w-5xl mx-auto px-4 py-6 space-y-4">
        <div className="skeleton h-20 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="skeleton h-40 rounded-xl" />
          <div className="skeleton h-40 rounded-xl" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
        <div className="skeleton h-48 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-enter max-w-5xl mx-auto px-4 py-6">
        <div className="alert alert-error flex items-start gap-3">
          <ExclamationCircleIcon className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
        <Link to="/labs" className="btn btn-secondary mt-4 inline-flex items-center gap-2">
          <ArrowLeftIcon className="h-4 w-4" /> Back to Labs
        </Link>
      </div>
    );
  }

  if (!lab) {
    return (
      <div className="page-enter max-w-5xl mx-auto px-4 py-6">
        <div className="empty-state py-16">
          <BuildingOfficeIcon className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-medium" style={{ color: 'var(--text)' }}>Lab not found</p>
          <Link to="/labs" className="btn btn-primary mt-4">Back to Labs</Link>
        </div>
      </div>
    );
  }

  const subStatusColor = lab.subscription?.status === 'active'
    ? 'badge-green'
    : lab.subscription?.status === 'pending'
    ? 'badge-yellow'
    : 'badge-red';

  const addressStr = typeof lab.address === 'object'
    ? [lab.address.street, lab.address.city, lab.address.state, lab.address.zipCode, lab.address.country].filter(Boolean).join(', ')
    : lab.address || 'Not specified';

  return (
    <div className="page-enter max-w-5xl mx-auto px-4 py-6 space-y-5">
      {/* Lab header */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="h-14 w-14 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--primary-bg)' }}>
            <BuildingOfficeIcon className="h-7 w-7" style={{ color: 'var(--primary)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold truncate" style={{ color: 'var(--text)' }}>{lab.name}</h1>
              {lab.subscription?.status && (
                <span className={`badge ${subStatusColor} capitalize`}>{lab.subscription.status}</span>
              )}
            </div>
            <p className="text-sm mt-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              <CalendarDaysIcon className="h-3.5 w-3.5" />
              Created {formatDate(lab.createdAt, DATE_FORMATS.DD_MM_YYYY)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link to="/labs" className="btn btn-secondary btn-sm inline-flex items-center gap-1.5">
              <ArrowLeftIcon className="h-4 w-4" /> Back
            </Link>
            <Link to={`/labs/${id}/edit`} className="btn btn-secondary btn-sm inline-flex items-center gap-1.5">
              <PencilSquareIcon className="h-4 w-4" /> Edit
            </Link>
            <button onClick={handleDeleteLab} className="btn btn-danger btn-sm inline-flex items-center gap-1.5">
              <TrashIcon className="h-4 w-4" /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Contact</h2>
          <dl className="space-y-3">
            <div className="detail-row">
              <dt className="detail-label flex items-center gap-1"><EnvelopeIcon className="h-3.5 w-3.5" /> Email</dt>
              <dd className="detail-value">{lab.contact?.email || 'Not specified'}</dd>
            </div>
            <div className="detail-row">
              <dt className="detail-label flex items-center gap-1"><PhoneIcon className="h-3.5 w-3.5" /> Phone</dt>
              <dd className="detail-value">{lab.contact?.phone || 'Not specified'}</dd>
            </div>
            <div className="detail-row">
              <dt className="detail-label flex items-center gap-1"><MapPinIcon className="h-3.5 w-3.5" /> Address</dt>
              <dd className="detail-value">{addressStr}</dd>
            </div>
          </dl>
          {lab.description && (
            <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs uppercase tracking-wider mb-1 font-medium" style={{ color: 'var(--text-muted)' }}>Description</p>
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>{lab.description}</p>
            </div>
          )}
        </div>

        {/* Subscription */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Subscription</h2>
          <dl className="space-y-3">
            <div className="detail-row">
              <dt className="detail-label">Plan</dt>
              <dd className="detail-value font-medium capitalize">
                {lab.subscription?.plan
                  ? lab.subscription.plan.charAt(0).toUpperCase() + lab.subscription.plan.slice(1)
                  : 'No Plan'}
              </dd>
            </div>
            <div className="detail-row">
              <dt className="detail-label">Status</dt>
              <dd className="detail-value">
                <span className={`badge ${subStatusColor} capitalize`}>
                  {lab.subscription?.status
                    ? lab.subscription.status.charAt(0).toUpperCase() + lab.subscription.status.slice(1)
                    : 'Inactive'}
                </span>
              </dd>
            </div>
            <div className="detail-row">
              <dt className="detail-label">Renewal Date</dt>
              <dd className="detail-value">
                {lab.subscription?.renewalDate
                  ? formatDate(lab.subscription.renewalDate, DATE_FORMATS.DD_MM_YYYY)
                  : 'Not applicable'}
              </dd>
            </div>
            <div className="detail-row">
              <dt className="detail-label">Last Updated</dt>
              <dd className="detail-value">{formatDate(lab.updatedAt, DATE_FORMATS.DD_MM_YYYY)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-bg)' }}>
            <UsersIcon className="h-5 w-5" style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{stats.totalUsers || 0}</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Users</p>
            <Link to={`/users?lab=${id}`} className="text-xs font-medium mt-1 inline-block" style={{ color: 'var(--primary)' }}>
              View all →
            </Link>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>
            <UserGroupIcon className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{stats.totalPatients || 0}</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Patients</p>
            <Link to={`/patients?lab=${id}`} className="text-xs font-medium mt-1 inline-block text-emerald-500">
              View all →
            </Link>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.12)' }}>
            <DocumentTextIcon className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{stats.totalReports || 0}</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Reports</p>
            <Link to={`/reports?lab=${id}`} className="text-xs font-medium mt-1 inline-block text-violet-500">
              View all →
            </Link>
          </div>
        </div>
      </div>

      {/* Lab Users */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>Lab Users</h2>
          <Link
            to={`/users/create?lab=${id}`}
            className="btn btn-primary btn-sm inline-flex items-center gap-1.5"
          >
            <PlusIcon className="h-4 w-4" /> Add User
          </Link>
        </div>

        {labUsers.length === 0 ? (
          <div className="empty-state py-10">
            <UsersIcon className="h-10 w-10 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No users found for this lab.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {labUsers.map(user => (
                  <tr key={user._id || user.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ background: 'var(--primary)' }}>
                          {(user.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{user.name}</span>
                      </div>
                    </td>
                    <td className="text-sm" style={{ color: 'var(--text-2)' }}>{user.email}</td>
                    <td>
                      <span className={`badge ${user.role === 'admin' ? 'badge-blue' : 'badge-gray'} capitalize`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="text-sm" style={{ color: 'var(--text-2)' }}>
                      {formatDate(user.createdAt, DATE_FORMATS.DD_MM_YYYY)}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete user ${user.name}?`)) {
                            try {
                              superAdmin.deleteUser(user._id || user.id);
                              window.location.reload();
                            } catch (error) {
                              alert('Failed to delete user. Please try again.');
                            }
                          }
                        }}
                        className="btn-icon text-red-500 hover:text-red-600"
                        title="Delete user"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card p-5">
        <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text)' }}>Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to={`/users/create?lab=${id}`}
            className="btn btn-secondary inline-flex items-center gap-1.5"
          >
            <UserGroupIcon className="h-4 w-4" /> Add User
          </Link>
          <Link
            to={`/patients/add?lab=${id}`}
            className="btn btn-secondary inline-flex items-center gap-1.5"
          >
            <UserGroupIcon className="h-4 w-4" /> Add Patient
          </Link>
          <Link
            to={`/reports/create?lab=${id}`}
            className="btn btn-secondary inline-flex items-center gap-1.5"
          >
            <ClipboardDocumentCheckIcon className="h-4 w-4" /> Create Report
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LabDetail;
