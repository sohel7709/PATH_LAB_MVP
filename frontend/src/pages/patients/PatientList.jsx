import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  DocumentTextIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserCircleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { useAuth } from '../../context/AuthContext';

export default function PatientList() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => { fetchPatients(); }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      const { default: api } = await import('../../utils/api');
      const data = await api.patients.getAll(user?.lab);
      setPatients(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch patients');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (patient) => {
    setPatientToDelete(patient);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!patientToDelete) return;
    try {
      setDeleteLoading(true);
      const { default: api } = await import('../../utils/api');
      await api.patients.delete(patientToDelete._id);
      setPatients(patients.filter(p => p._id !== patientToDelete._id));
      setSuccessMessage(`Patient ${patientToDelete.fullName} has been deleted successfully.`);
      setShowDeleteModal(false);
      setPatientToDelete(null);
      fetchPatients();
    } catch (err) {
      setError(err.message || 'Failed to delete patient');
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setPatientToDelete(null);
  };

  const filteredPatients = patients.filter(p => {
    const q = searchTerm.toLowerCase();
    return (
      (p.patientId && p.patientId.toLowerCase().includes(q)) ||
      (p.fullName && p.fullName.toLowerCase().includes(q)) ||
      (p.phone && p.phone.includes(searchTerm)) ||
      (p.email && p.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="page-enter space-y-5">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage all patients in your laboratory</p>
        </div>
        <Link to="/patients/add" className="btn btn-primary">
          <PlusIcon className="h-4 w-4" />
          Add Patient
        </Link>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
          <CheckCircleIcon className="h-5 w-5 text-green-500 shrink-0" />
          <p className="text-sm text-green-800 flex-1">{successMessage}</p>
          <button onClick={() => setSuccessMessage('')} className="text-green-500 hover:text-green-700">
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}
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
          placeholder="Search by ID, name, phone, or email..."
          className="input pl-9"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="card overflow-hidden">
          <div className="p-5 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 skeleton" />
            ))}
          </div>
        </div>
      ) : (
        <div className="table-wrapper overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Name</th>
                <th>Age / Gender</th>
                <th>Contact</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <UserGroupIcon className="h-12 w-12 text-slate-300 mb-3" />
                      <p className="text-base font-medium text-slate-600">No patients found</p>
                      <p className="text-sm text-slate-400 mt-1">Try a different search or add a new patient</p>
                      <Link to="/patients/add" className="btn btn-primary mt-4">
                        <PlusIcon className="h-4 w-4" />
                        Add Patient
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : filteredPatients.map(patient => (
                <tr key={patient._id}>
                  <td className="font-mono text-blue-600 text-xs">{patient.patientId || 'N/A'}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                        {patient.fullName?.charAt(0)?.toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-900">{patient.fullName}</span>
                    </div>
                  </td>
                  <td className="text-slate-500">
                    {patient.age} / {patient.gender?.charAt(0).toUpperCase() + patient.gender?.slice(1)}
                  </td>
                  <td>
                    <div className="text-slate-700 text-sm">{patient.phone ? patient.phone.replace(/[()]/g, '') : 'N/A'}</div>
                    {patient.email && <div className="text-xs text-slate-400">{patient.email}</div>}
                  </td>
                  <td className="text-slate-500 text-sm">{patient.address ? patient.address.split(',')[0] : 'N/A'}</td>
                  <td>
                    <div className="flex gap-1">
                      <Link to={`/patients/${patient._id}/details`} className="p-1.5 rounded hover:bg-indigo-50 text-indigo-600 transition-colors" title="View Details">
                        <UserCircleIcon className="h-4 w-4" />
                      </Link>
                      <Link to={`/reports/create?patientId=${patient._id}`} className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors" title="Create Report">
                        <DocumentTextIcon className="h-4 w-4" />
                      </Link>
                      <Link to={`/patients/${patient._id}/edit`} className="p-1.5 rounded hover:bg-green-50 text-green-600 transition-colors" title="Edit">
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      {user && (user.role === 'admin' || user.role === 'super-admin') && (
                        <button
                          onClick={() => handleDeleteClick(patient)}
                          className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors"
                          title="Delete"
                        >
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
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={cancelDelete} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Delete Patient</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Are you sure you want to delete <strong>{patientToDelete?.fullName}</strong>? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={cancelDelete} disabled={deleteLoading} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={confirmDelete} disabled={deleteLoading} className="btn btn-danger">
                {deleteLoading ? 'Deleting...' : 'Delete Patient'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
