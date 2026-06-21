import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { users, superAdmin } from '../../utils/api.js';
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const roleBadge = (role) => {
  const map = {
    'super-admin': 'badge badge-purple',
    'admin': 'badge badge-blue',
    'technician': 'badge badge-gray',
  };
  return map[role] || 'badge badge-gray';
};

const UserList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [usersList, setUsersList] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError('');
        let data;
        if (user?.role === 'super-admin') {
          const response = await superAdmin.getUsers();
          data = response.data || [];
        } else {
          const response = await users.getAll();
          data = response.data || [];
        }
        setUsersList(data);
        setFilteredUsers(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [user?.role]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(usersList);
      return;
    }
    const term = searchTerm.toLowerCase().trim();
    setFilteredUsers(usersList.filter(u =>
      (u.name && u.name.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.role && u.role.toLowerCase().includes(term)) ||
      (u.lab?.name && u.lab.name.toLowerCase().includes(term))
    ));
  }, [searchTerm, usersList]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      if (user?.role === 'super-admin') await superAdmin.deleteUser(id);
      else await users.delete(id);
      try {
        setLoading(true);
        let data;
        if (user?.role === 'super-admin') {
          const r = await superAdmin.getUsers();
          data = r.data || [];
        } else {
          const r = await users.getAll();
          data = r.data || [];
        }
        setUsersList(data);
      } catch {} finally {
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    }
  };

  return (
    <div className="page-enter space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage all users in the system</p>
        </div>
        <Link to="/users/create" className="btn btn-primary">
          <PlusIcon className="h-4 w-4" />
          Add User
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search by name, email, role or lab..."
          className="input pl-9"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="card p-5 space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-12 skeleton" />)}
        </div>
      ) : (
        <div className="table-wrapper overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Lab</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? filteredUsers.map(userData => (
                <tr key={userData._id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                        {userData.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-900">{userData.name}</span>
                    </div>
                  </td>
                  <td className="text-slate-500">{userData.email}</td>
                  <td>
                    <span className={roleBadge(userData.role)}>
                      {userData.role.charAt(0).toUpperCase() + userData.role.slice(1).replace('-', ' ')}
                    </span>
                  </td>
                  <td className="text-slate-500">
                    {userData.lab?.name || (userData.role === 'super-admin' ? 'N/A' : 'No Lab Assigned')}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        onClick={() => navigate(`/users/${userData._id}`)}
                        className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
                        title="Edit User"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(userData._id)}
                        className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors"
                        title="Delete User"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <UserGroupIcon className="h-12 w-12 text-slate-300 mb-3" />
                      <p className="text-base font-medium text-slate-600">No users found</p>
                      <p className="text-sm text-slate-400 mt-1">
                        {searchTerm ? 'Try a different search term' : 'Add a new user to get started'}
                      </p>
                      {!searchTerm && (
                        <Link to="/users/create" className="btn btn-primary mt-4">
                          <PlusIcon className="h-4 w-4" />
                          Add User
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserList;
