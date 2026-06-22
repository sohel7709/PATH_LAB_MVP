import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, UsersIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/20/solid';
import { users } from '../../utils/api';
import { USER_ROLES } from '../../utils/constants';

const ROLE_BADGE = {
  admin: 'badge badge-blue',
  technician: 'badge badge-green',
  'super-admin': 'badge',
};

const ROLE_STYLE = {
  'super-admin': { background: '#ede9fe', color: '#7c3aed' },
};

export default function UserManagement() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [usersList, setUsersList] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: Object.keys(USER_ROLES)[0],
    password: '',
  });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await users.getAll();
      setUsersList(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', role: Object.keys(USER_ROLES)[0], password: '' });
    setSelectedUser(null);
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setFormData({ name: user.name, email: user.email, role: user.role, password: '' });
      setSelectedUser(user);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (selectedUser) {
        await users.update(selectedUser.id, formData);
        setSuccess('User updated successfully');
      } else {
        await users.create(formData);
        setSuccess('User created successfully');
      }
      fetchUsers();
      handleCloseModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (userId) => {
    try {
      await users.delete(userId);
      setSuccess('User deleted successfully');
      setDeleteConfirmId(null);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const filtered = usersList.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    USER_ROLES[u.role]?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="page-enter max-w-5xl mx-auto p-4 space-y-4">
        <div className="skeleton h-10 rounded-lg w-48" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-14 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="page-enter max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="stat-icon" style={{ background: 'var(--primary-bg)' }}>
            <UsersIcon className="h-5 w-5" style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text)' }}>
              User Management
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {usersList.length} user{usersList.length !== 1 ? 's' : ''} in the system
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => handleOpenModal()}
          className="btn btn-primary inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <PlusIcon className="h-4 w-4" />
          Add User
        </button>
      </div>

      {error && (
        <div className="alert alert-error flex items-center gap-2">
          <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="alert alert-success flex items-center gap-2">
          <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
          style={{ color: 'var(--text-muted)' }}
        />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, or role..."
          className="input w-full pl-9"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="empty-state py-12">
                      <UsersIcon className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--text-faint)' }} />
                      <p style={{ color: 'var(--text-muted)' }}>
                        {search ? 'No users match your search.' : 'No users found. Add one to get started.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
                          style={{ background: 'var(--primary-bg)', color: 'var(--primary)' }}
                        >
                          {user.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="font-medium" style={{ color: 'var(--text)' }}>{user.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-2)' }}>{user.email}</td>
                    <td>
                      <span
                        className={ROLE_BADGE[user.role] || 'badge badge-gray'}
                        style={ROLE_STYLE[user.role] || {}}
                      >
                        {USER_ROLES[user.role] || user.role}
                      </span>
                    </td>
                    <td>
                      {deleteConfirmId === user.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Delete?</span>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="btn btn-danger btn-sm"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="btn btn-secondary btn-sm"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenModal(user)}
                            className="btn btn-secondary btn-sm inline-flex items-center gap-1"
                          >
                            <PencilIcon className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(user.id)}
                            className="btn btn-danger btn-sm inline-flex items-center gap-1"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseModal}
          />
          <div
            className="relative w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-5"
            style={{ background: 'var(--surface)' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                {selectedUser ? 'Edit User' : 'Add New User'}
              </h3>
              <button onClick={handleCloseModal} className="btn btn-secondary btn-sm p-1.5">
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>
                  Name <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="input w-full"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>
                  Email <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input w-full"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>
                  Role <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <select
                  name="role"
                  required
                  value={formData.role}
                  onChange={handleChange}
                  className="select w-full"
                >
                  {Object.entries(USER_ROLES).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>
                  {selectedUser ? 'New Password (leave blank to keep current)' : 'Password'}{!selectedUser && <span style={{ color: 'var(--danger)' }}> *</span>}
                </label>
                <input
                  type="password"
                  name="password"
                  required={!selectedUser}
                  value={formData.password}
                  onChange={handleChange}
                  className="input w-full"
                  placeholder={selectedUser ? 'Leave blank to keep current' : 'Set a password'}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={handleCloseModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {selectedUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
