import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { users, superAdmin } from '../../utils/api.js';
import {
  PencilIcon, TrashIcon, PlusIcon,
  MagnifyingGlassIcon, UserGroupIcon, ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const ROLE_STYLES = {
  'super-admin': 'bg-purple-100 text-purple-700 border-purple-200',
  'admin':       'bg-blue-100 text-blue-700 border-blue-200',
  'technician':  'bg-gray-100 text-gray-600 border-gray-200',
};

const AVATAR_COLORS = ['bg-indigo-500','bg-purple-500','bg-blue-500','bg-teal-500','bg-orange-500','bg-rose-500'];
const avatarColor = (name = '') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

export default function UserList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [usersList, setUsersList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteUser, setDeleteUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = user?.role === 'super-admin'
        ? await superAdmin.getUsers()
        : await users.getAll();
      setUsersList(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [user?.role]);

  const confirmDelete = async () => {
    if (!deleteUser) return;
    setIsDeleting(true);
    try {
      if (user?.role === 'super-admin') await superAdmin.deleteUser(deleteUser._id);
      else await users.delete(deleteUser._id);
      setUsersList(prev => prev.filter(u => u._id !== deleteUser._id));
      setDeleteUser(null);
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = usersList.filter(u => {
    const q = searchTerm.toLowerCase().trim();
    const matchSearch = !q ||
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.lab?.name?.toLowerCase().includes(q);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const admins = usersList.filter(u => u.role === 'admin').length;
  const techs = usersList.filter(u => u.role === 'technician').length;

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-5">
        <div className="h-36 rounded-2xl bg-gray-100 animate-pulse" />
        <div className="h-12 rounded-xl bg-gray-100 animate-pulse" />
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50">
              <div className="h-9 w-9 rounded-full bg-gray-100 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-gray-100 rounded w-1/4 animate-pulse" />
                <div className="h-3 bg-gray-100 rounded w-1/3 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">

      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-700 to-indigo-700 px-6 py-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <UserGroupIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Team Members</h1>
              <p className="text-sm text-slate-300 mt-0.5">Manage admins and technicians</p>
            </div>
          </div>
          <Link
            to="/users/create"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <PlusIcon className="h-4 w-4" /> Add User
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            { label: 'Total', value: usersList.length, color: 'bg-white/20 text-white' },
            { label: 'Admins', value: admins, color: 'bg-blue-400/20 text-blue-100' },
            { label: 'Technicians', value: techs, color: 'bg-slate-400/20 text-slate-200' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-xl px-3 py-2.5 text-center`}>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs font-medium mt-0.5 opacity-80">{s.label}</p>
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

      {/* Search + role filter */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by name, email or lab…"
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all placeholder-gray-400"
            />
          </div>
          <div className="flex items-center gap-2">
            {['all','admin','technician'].map(r => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize ${
                  roleFilter === r
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-white'
                }`}
              >
                {r === 'all' ? 'All' : r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 px-1">
        Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of {usersList.length} users
      </p>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <UserGroupIcon className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-base font-semibold text-gray-700">No users found</p>
          <p className="text-sm text-gray-400 mt-1 mb-5">
            {searchTerm || roleFilter !== 'all' ? 'Try a different search or filter' : 'Add your first team member'}
          </p>
          {!searchTerm && roleFilter === 'all' && (
            <Link to="/users/create" className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
              <PlusIcon className="h-4 w-4" /> Add User
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['User', 'Email', 'Role', 'Lab', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(u => (
                  <tr key={u._id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-full ${avatarColor(u.name)} flex items-center justify-center flex-shrink-0`}>
                          <span className="text-sm font-bold text-white">{u.name?.charAt(0)?.toUpperCase()}</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{u.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${ROLE_STYLES[u.role] || ROLE_STYLES.technician}`}>
                        {u.role?.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">
                      {u.lab?.name || (u.role === 'super-admin' ? '—' : 'No lab assigned')}
                    </td>
                    <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/users/${u._id}`)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-indigo-500 hover:bg-indigo-100 transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteUser(u)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeleteUser(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="h-11 w-11 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <TrashIcon className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Remove User</h3>
                <p className="text-sm text-gray-500 mt-1">Remove <strong>{deleteUser.name}</strong> from the system? This cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteUser(null)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={confirmDelete} disabled={isDeleting} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors">
                {isDeleting ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
