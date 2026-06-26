import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  PlusIcon, MagnifyingGlassIcon, PencilIcon,
  DocumentTextIcon, TrashIcon, ExclamationTriangleIcon,
  UserCircleIcon, UserGroupIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

const AVATAR_COLORS = ['bg-blue-500','bg-indigo-500','bg-violet-500','bg-pink-500','bg-rose-500','bg-orange-500','bg-teal-500','bg-cyan-500'];
const avatarColor = (name = '') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const GENDER_STYLES = {
  male:   'bg-blue-50 text-blue-700 border-blue-200',
  female: 'bg-pink-50 text-pink-700 border-pink-200',
  other:  'bg-gray-50 text-gray-600 border-gray-200',
};

export default function PatientList() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [deletePatient, setDeletePatient] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { fetchPatients(); }, []);

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      const { default: api } = await import('../../utils/api');
      const data = await api.patients.getAll(user?.lab);
      setPatients(Array.isArray(data) ? data : data?.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch patients');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletePatient) return;
    setIsDeleting(true);
    try {
      const { default: api } = await import('../../utils/api');
      await api.patients.delete(deletePatient._id);
      setPatients(prev => prev.filter(p => p._id !== deletePatient._id));
      setDeletePatient(null);
    } catch (err) {
      setError(err.message || 'Failed to delete patient');
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = patients.filter(p => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q ||
      p.patientId?.toLowerCase().includes(q) ||
      p.fullName?.toLowerCase().includes(q) ||
      p.phone?.includes(searchTerm) ||
      p.email?.toLowerCase().includes(q);
    const matchGender = genderFilter === 'all' || p.gender === genderFilter;
    return matchSearch && matchGender;
  });

  const ITEMS_PER_PAGE = 25;
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-5">
        <div className="h-36 rounded-2xl bg-gray-100 animate-pulse" />
        <div className="h-12 rounded-xl bg-gray-100 animate-pulse" />
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          {[...Array(6)].map((_, i) => (
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

  const male = patients.filter(p => p.gender === 'male').length;
  const female = patients.filter(p => p.gender === 'female').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">

      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <UserGroupIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Patients</h1>
              <p className="text-sm text-blue-100 mt-0.5">Manage all patients in your laboratory</p>
            </div>
          </div>
          <Link
            to="/patients/add"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-blue-700 text-sm font-semibold rounded-lg hover:bg-blue-50 transition-colors shadow-sm"
          >
            <PlusIcon className="h-4 w-4" /> Add Patient
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            { label: 'Total', value: patients.length, color: 'bg-white/20 text-white' },
            { label: 'Male', value: male, color: 'bg-blue-400/20 text-blue-100' },
            { label: 'Female', value: female, color: 'bg-pink-400/20 text-pink-100' },
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

      {/* Search + gender filter */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by ID, name, phone or email…"
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all placeholder-gray-400"
            />
          </div>
          <div className="flex items-center gap-2">
            {['all','male','female','other'].map(g => (
              <button
                key={g}
                onClick={() => setGenderFilter(g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize ${
                  genderFilter === g
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-white'
                }`}
              >
                {g === 'all' ? 'All' : g}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 px-1">
        Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of {patients.length} patients
      </p>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <UserGroupIcon className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-base font-semibold text-gray-700">No patients found</p>
          <p className="text-sm text-gray-400 mt-1 mb-5">
            {searchTerm || genderFilter !== 'all' ? 'Try adjusting your filters' : 'Add your first patient to get started'}
          </p>
          {!searchTerm && genderFilter === 'all' && (
            <Link to="/patients/add" className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
              <PlusIcon className="h-4 w-4" /> Add Patient
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Patient', 'ID', 'Age / Gender', 'Phone', 'Address', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map(patient => (
                  <tr key={patient._id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-full ${avatarColor(patient.fullName)} flex items-center justify-center flex-shrink-0`}>
                          <span className="text-sm font-bold text-white">{patient.fullName?.charAt(0)?.toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{patient.fullName}</p>
                          {patient.email && <p className="text-xs text-gray-400">{patient.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-mono font-semibold text-blue-600">{patient.patientId || 'N/A'}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">{patient.age}y</span>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${GENDER_STYLES[patient.gender] || GENDER_STYLES.other}`}>
                          {patient.gender}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{patient.phone || '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 max-w-[160px] truncate">
                      {patient.address ? patient.address.split(',')[0] : '—'}
                    </td>
                    <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <Link to={`/patients/${patient._id}/details`} className="h-8 w-8 rounded-lg flex items-center justify-center text-indigo-500 bg-indigo-50 hover:bg-indigo-100 transition-colors" title="Details">
                          <UserCircleIcon className="h-4 w-4" />
                        </Link>
                        <Link to={`/reports/create?patientId=${patient._id}`} className="h-8 w-8 rounded-lg flex items-center justify-center text-blue-500 bg-blue-50 hover:bg-blue-100 transition-colors" title="New Report">
                          <DocumentTextIcon className="h-4 w-4" />
                        </Link>
                        <Link to={`/patients/${patient._id}/edit`} className="h-8 w-8 rounded-lg flex items-center justify-center text-green-600 bg-green-50 hover:bg-green-100 transition-colors" title="Edit">
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                        {(user?.role === 'admin' || user?.role === 'super-admin') && (
                          <button onClick={() => setDeletePatient(patient)} className="h-8 w-8 rounded-lg flex items-center justify-center text-red-500 bg-red-50 hover:bg-red-100 transition-colors" title="Delete">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-500">
                Showing <span className="font-semibold text-gray-700">{(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}</span> of <span className="font-semibold text-gray-700">{filtered.length}</span>
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold">
                  ‹
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let page;
                  if (totalPages <= 7) page = i + 1;
                  else if (currentPage <= 4) page = i + 1;
                  else if (currentPage >= totalPages - 3) page = totalPages - 6 + i;
                  else page = currentPage - 3 + i;
                  return (
                    <button key={page} onClick={() => setCurrentPage(page)}
                      className={`h-8 w-8 rounded-lg text-xs font-semibold transition-colors ${currentPage === page ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}>
                      {page}
                    </button>
                  );
                })}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold">
                  ›
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete modal — portal to fix fixed positioning inside CSS transforms */}
      {deletePatient && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setDeletePatient(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="h-11 w-11 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <TrashIcon className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Delete Patient</h3>
                <p className="text-sm text-gray-500 mt-1">Remove <strong>{deletePatient.fullName}</strong>? This cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeletePatient(null)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={confirmDelete} disabled={isDeleting} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors">
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
