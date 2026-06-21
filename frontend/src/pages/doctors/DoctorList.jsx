import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  UserIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { doctors } from '../../utils/api';

const DoctorList = () => {
  const [doctorList, setDoctorList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState(null);

  useEffect(() => { fetchDoctors(); }, []);

  const fetchDoctors = async () => {
    try {
      setIsLoading(true);
      const response = await doctors.getAll();
      setDoctorList(response?.data || []);
      setError('');
    } catch {
      setError('Failed to load doctors. Please try again.');
      setDoctorList([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (doctor) => {
    setDoctorToDelete(doctor);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!doctorToDelete) return;
    try {
      await doctors.delete(doctorToDelete._id);
      setDoctorList(prev => prev.filter(d => d._id !== doctorToDelete._id));
      setShowDeleteConfirm(false);
      setDoctorToDelete(null);
    } catch {
      setError('Failed to delete doctor. Please try again.');
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDoctorToDelete(null);
  };

  const filtered = doctorList.filter(d => {
    const q = searchTerm.toLowerCase();
    return !q || d.name?.toLowerCase().includes(q) || d.specialty?.toLowerCase().includes(q) || d.email?.toLowerCase().includes(q);
  });

  return (
    <div className="page-enter space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reference Doctors</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage reference doctors for your lab</p>
        </div>
        <Link to="/doctors/add" className="btn btn-primary">
          <UserPlusIcon className="h-4 w-4" />
          Add Doctor
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
          placeholder="Search by name, specialty, or email..."
          className="input pl-9"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="card p-5 space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <UserIcon className="h-12 w-12 text-slate-300 mb-3" />
            <p className="text-base font-medium text-slate-600">No doctors found</p>
            <p className="text-sm text-slate-400 mt-1">
              {searchTerm ? 'Try a different search term' : 'Get started by adding a reference doctor'}
            </p>
            {!searchTerm && (
              <Link to="/doctors/add" className="btn btn-primary mt-4">
                <UserPlusIcon className="h-4 w-4" />
                Add Doctor
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="table-wrapper overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Specialty</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(doctor => (
                <tr key={doctor._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <UserIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <span className="font-medium text-slate-900">{doctor.name}</span>
                    </div>
                  </td>
                  <td className="text-slate-500">{doctor.specialty || '—'}</td>
                  <td className="text-slate-500">{doctor.email || '—'}</td>
                  <td>
                    <div className="flex gap-1">
                      <Link to={`/doctors/edit/${doctor._id}`} className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors" title="Edit">
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      <button onClick={() => handleDeleteClick(doctor)} className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors" title="Delete">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={cancelDelete} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Delete Doctor</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Are you sure you want to delete <strong>{doctorToDelete?.name}</strong>? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={cancelDelete} className="btn btn-secondary">Cancel</button>
              <button onClick={confirmDelete} className="btn btn-danger">Delete Doctor</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorList;
