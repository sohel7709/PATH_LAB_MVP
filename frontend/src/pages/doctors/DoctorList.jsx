import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PencilIcon, TrashIcon, UserPlusIcon,
  ExclamationTriangleIcon, MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { doctors } from '../../utils/api';

const AVATAR_COLORS = ['bg-teal-500','bg-emerald-500','bg-cyan-500','bg-blue-500','bg-indigo-500','bg-violet-500'];
const avatarColor = (name = '') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const SPECIALTY_COLORS = {
  Cardiology: 'bg-red-50 text-red-700 border-red-200',
  Pathology: 'bg-purple-50 text-purple-700 border-purple-200',
  Hematology: 'bg-rose-50 text-rose-700 border-rose-200',
  Neurology: 'bg-blue-50 text-blue-700 border-blue-200',
  Radiology: 'bg-orange-50 text-orange-700 border-orange-200',
};
const specialtyStyle = (s) => SPECIALTY_COLORS[s] || 'bg-gray-50 text-gray-600 border-gray-200';

export default function DoctorList() {
  const [doctorList, setDoctorList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDoc, setDeleteDoc] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => { fetchDoctors(); }, []);

  const fetchDoctors = async () => {
    try {
      setIsLoading(true);
      const res = await doctors.getAll();
      setDoctorList(res?.data || []);
      setError('');
    } catch {
      setError('Failed to load doctors. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteDoc) return;
    setIsDeleting(true);
    try {
      await doctors.delete(deleteDoc._id);
      setDoctorList(prev => prev.filter(d => d._id !== deleteDoc._id));
      setDeleteDoc(null);
    } catch {
      setError('Failed to delete doctor. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = doctorList.filter(d => {
    const q = searchTerm.toLowerCase();
    return !q || d.name?.toLowerCase().includes(q) || d.specialty?.toLowerCase().includes(q) || d.email?.toLowerCase().includes(q) || d.phone?.includes(searchTerm);
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-5">
        <div className="h-32 rounded-2xl bg-gray-100 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-32 rounded-xl bg-gray-100 animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">

      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Reference Doctors</h1>
              <p className="text-sm text-teal-100 mt-0.5">Manage referring doctors for your lab</p>
            </div>
          </div>
          <Link
            to="/doctors/add"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-teal-700 text-sm font-semibold rounded-lg hover:bg-teal-50 transition-colors shadow-sm"
          >
            <UserPlusIcon className="h-4 w-4" />
            Add Doctor
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            { label: 'Total', value: doctorList.length },
            { label: 'Specialties', value: [...new Set(doctorList.map(d => d.specialty).filter(Boolean))].length },
            { label: 'With Phone', value: doctorList.filter(d => d.phone).length },
          ].map(s => (
            <div key={s.label} className="bg-white/15 rounded-xl px-3 py-2.5 text-center">
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-xs font-medium text-teal-100 mt-0.5">{s.label}</p>
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

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by name, specialty, phone or email…"
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:bg-white transition-all placeholder-gray-400"
          />
        </div>
      </div>

      <p className="text-xs text-gray-400 px-1">
        Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of {doctorList.length} doctors
      </p>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-base font-semibold text-gray-700">No doctors found</p>
          <p className="text-sm text-gray-400 mt-1 mb-5">
            {searchTerm ? 'Try a different search term' : 'Add your first reference doctor'}
          </p>
          {!searchTerm && (
            <Link to="/doctors/add" className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors">
              <UserPlusIcon className="h-4 w-4" /> Add Doctor
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Doctor', 'Specialty', 'Phone', 'Email', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(doctor => (
                  <tr key={doctor._id} className="hover:bg-teal-50/30 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-full ${avatarColor(doctor.name)} flex items-center justify-center flex-shrink-0`}>
                          <span className="text-sm font-bold text-white">{doctor.name?.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{doctor.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {doctor.specialty ? (
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${specialtyStyle(doctor.specialty)}`}>
                          {doctor.specialty}
                        </span>
                      ) : <span className="text-gray-400 text-sm">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{doctor.phone || '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{doctor.email || '—'}</td>
                    <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          to={`/doctors/edit/${doctor._id}`}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-teal-600 hover:bg-teal-100 transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => setDeleteDoc(doctor)}
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
      {deleteDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeleteDoc(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="h-11 w-11 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <TrashIcon className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Delete Doctor</h3>
                <p className="text-sm text-gray-500 mt-1">Remove <strong>{deleteDoc.name}</strong>? This cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteDoc(null)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
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
