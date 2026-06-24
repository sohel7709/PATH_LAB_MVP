import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { feedback } from '../../utils/api';

const STATUS_COLORS = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Read: 'bg-blue-100 text-blue-800',
  'Working On It': 'bg-purple-100 text-purple-800',
  Completed: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
  'Need More Information': 'bg-orange-100 text-orange-800',
  'Duplicate Request': 'bg-gray-100 text-gray-800',
  'Planned For Future Release': 'bg-indigo-100 text-indigo-800',
};

const PRIORITY_COLORS = {
  Low: 'bg-gray-100 text-gray-700',
  Medium: 'bg-blue-100 text-blue-700',
  High: 'bg-orange-100 text-orange-700',
  Critical: 'bg-red-100 text-red-700',
};

export default function FeedbackDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [fb, setFb] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    loadDetail();
  }, [id]);

  const loadDetail = async () => {
    try {
      setLoading(true);
      const data = await feedback.getById(id);
      setFb(data.data);
      setError('');
    } catch (err) {
      setError('Failed to load feedback detail');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      </div>
    );
  }

  if (!fb) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="text-center py-16 text-gray-500">Feedback not found</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/feedback')}
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Feedback
      </button>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Feedback ID</p>
              <p className="text-xl font-mono font-bold text-blue-600">{fb.feedbackId}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${STATUS_COLORS[fb.status] || 'bg-gray-100 text-gray-800'}`}>
                {fb.status}
              </span>
              <span className={`inline-flex px-2.5 py-1 text-sm font-medium rounded-full ${PRIORITY_COLORS[fb.priority] || 'bg-gray-100 text-gray-700'}`}>
                {fb.priority}
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Subject */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{fb.subject}</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm text-gray-500">{fb.type}</span>
              <span className="text-gray-300">•</span>
              <span className="text-sm text-gray-500">Created: {formatDate(fb.createdAt)}</span>
              <span className="text-gray-300">•</span>
              <span className="text-sm text-gray-500">Updated: {formatDate(fb.updatedAt)}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{fb.description}</p>
            </div>
          </div>

          {/* Images */}
          {fb.images && fb.images.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Attachments ({fb.images.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {fb.images.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`Attachment ${index + 1}`}
                    className="h-32 w-full object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setSelectedImage(img)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Status History */}
          {fb.statusHistory && fb.statusHistory.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Status History</h3>
              <div className="space-y-2">
                {fb.statusHistory.map((entry, index) => (
                  <div key={index} className="flex items-start gap-3 text-sm">
                    <div className="mt-1 w-2 h-2 rounded-full bg-blue-400 flex-shrink-0"></div>
                    <div>
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[entry.status] || 'bg-gray-100 text-gray-800'}`}>
                        {entry.status}
                      </span>
                      {entry.note && <p className="text-gray-500 mt-1">{entry.note}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(entry.changedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={selectedImage}
              alt="Enlarged attachment"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-3 -right-3 bg-white text-gray-700 rounded-full p-1.5 shadow-lg hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}