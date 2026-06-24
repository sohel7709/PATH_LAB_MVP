import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { feedback as feedbackApi } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const STATUSES = [
  'Pending',
  'Read',
  'Working On It',
  'Completed',
  'Rejected',
  'Need More Information',
  'Duplicate Request',
  'Planned For Future Release',
];

const STATUS_COLORS = {
  'Pending': 'bg-yellow-100 text-yellow-800',
  'Read': 'bg-blue-100 text-blue-800',
  'Working On It': 'bg-indigo-100 text-indigo-800',
  'Completed': 'bg-green-100 text-green-800',
  'Rejected': 'bg-red-100 text-red-800',
  'Need More Information': 'bg-orange-100 text-orange-800',
  'Duplicate Request': 'bg-gray-100 text-gray-600',
  'Planned For Future Release': 'bg-purple-100 text-purple-800',
};

const PRIORITY_COLORS = {
  'Low': 'bg-gray-100 text-gray-600',
  'Medium': 'bg-blue-100 text-blue-700',
  'High': 'bg-orange-100 text-orange-700',
  'Critical': 'bg-red-100 text-red-700',
};

export default function FeedbackDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super-admin';

  const [feedbackData, setFeedbackData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [expandedImage, setExpandedImage] = useState(null);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const res = await feedbackApi.getById(id);
      setFeedbackData(res.data);
      setSelectedStatus(res.data.status);
      setInternalNotes(res.data.internalNotes || '');
    } catch (err) {
      setError(err.message || 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [id]);

  const handleStatusUpdate = async () => {
    if (selectedStatus === feedbackData.status) return;
    setUpdating(true);
    try {
      const res = await feedbackApi.update(id, { status: selectedStatus });
      setFeedbackData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to update status');
      setSelectedStatus(feedbackData.status);
    } finally {
      setUpdating(false);
    }
  };

  const handleNotesUpdate = async () => {
    setUpdating(true);
    try {
      const res = await feedbackApi.update(id, { internalNotes });
      setFeedbackData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to update notes');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;
    try {
      await feedbackApi.delete(id);
      navigate('/feedback');
    } catch (err) {
      setError(err.message || 'Failed to delete feedback');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !feedbackData) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">{error}</div>
        <Link to="/feedback" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
          Back to Feedback
        </Link>
      </div>
    );
  }

  if (!feedbackData) return null;

  const fb = feedbackData;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/feedback" className="text-sm text-blue-600 hover:text-blue-700 mb-1 inline-block">
            ← Back to Feedback
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">Feedback Details</h1>
        </div>
        {isSuperAdmin && (
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      <div className="space-y-5">
        {/* Feedback ID & Status Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-lg font-mono font-bold text-blue-700">{fb.feedbackId}</span>
              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[fb.status] || 'bg-gray-100 text-gray-600'}`}>
                {fb.status}
              </span>
              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${PRIORITY_COLORS[fb.priority] || 'bg-gray-100 text-gray-600'}`}>
                {fb.priority}
              </span>
            </div>
            <span className="text-xs text-slate-400">{formatDate(fb.createdAt)}</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mt-3">{fb.subject}</h2>
          <span className="inline-block mt-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{fb.type}</span>
        </div>

        {/* Sender Info (Super Admin) */}
        {isSuperAdmin && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">Sender Information</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-500">Admin Name:</span>
                <p className="font-medium text-slate-800">{fb.admin?.name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-500">Email:</span>
                <p className="font-medium text-slate-800">{fb.admin?.email || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-500">Phone:</span>
                <p className="font-medium text-slate-800">{fb.admin?.phone || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-500">Lab Name:</span>
                <p className="font-medium text-slate-800">{fb.lab?.name || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">Description</h3>
          <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{fb.description}</div>
        </div>

        {/* Attachments */}
        {fb.images && fb.images.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
              Attachments ({fb.images.length})
            </h3>
            <div className="flex flex-wrap gap-3">
              {fb.images.map((img, index) => (
                <div key={index}>
                  <img
                    src={img}
                    alt={`Attachment ${index + 1}`}
                    className="w-32 h-32 object-cover rounded-lg border border-slate-200 cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
                    onClick={() => setExpandedImage(img)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Update (Super Admin Only) */}
        {isSuperAdmin && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">Update Status</h3>
            <div className="flex items-center gap-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button
                onClick={handleStatusUpdate}
                disabled={updating || selectedStatus === fb.status}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {updating ? 'Updating...' : 'Update Status'}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Last updated: {formatDate(fb.updatedAt)}
            </p>
          </div>
        )}

        {/* Internal Notes (Super Admin Only) */}
        {isSuperAdmin && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
              Internal Notes
              <span className="text-xs text-slate-400 font-normal ml-2">(Visible only to Super Admin)</span>
            </h3>
            <textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              rows={3}
              placeholder="Add internal notes (e.g., debugging notes, assignment info)..."
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
            />
            <button
              onClick={handleNotesUpdate}
              disabled={updating}
              className="mt-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {updating ? 'Saving...' : 'Save Notes'}
            </button>
          </div>
        )}

        {/* Timeline / Meta Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">Timeline</h3>
          <div className="space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="text-slate-500 w-24">Created:</span>
              <span className="text-slate-700">{formatDate(fb.createdAt)}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-slate-500 w-24">Updated:</span>
              <span className="text-slate-700">{formatDate(fb.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-slate-100 text-slate-600"
            >
              ✕
            </button>
            <img
              src={expandedImage}
              alt="Expanded view"
              className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}