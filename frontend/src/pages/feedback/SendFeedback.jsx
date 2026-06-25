import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { feedback } from '../../utils/api';

const TYPES = [
  {
    value: 'Bug Report',
    label: 'Bug Report',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'border-red-300 bg-red-50 text-red-700',
    activeColor: 'border-red-500 bg-red-100 text-red-800 ring-2 ring-red-300',
  },
  {
    value: 'Feature Request',
    label: 'Feature Request',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" />
      </svg>
    ),
    color: 'border-blue-300 bg-blue-50 text-blue-700',
    activeColor: 'border-blue-500 bg-blue-100 text-blue-800 ring-2 ring-blue-300',
  },
  {
    value: 'Improvement Suggestion',
    label: 'Improvement',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    color: 'border-yellow-300 bg-yellow-50 text-yellow-700',
    activeColor: 'border-yellow-500 bg-yellow-100 text-yellow-800 ring-2 ring-yellow-300',
  },
  {
    value: 'UI/UX Issue',
    label: 'UI / UX',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    color: 'border-purple-300 bg-purple-50 text-purple-700',
    activeColor: 'border-purple-500 bg-purple-100 text-purple-800 ring-2 ring-purple-300',
  },
  {
    value: 'Performance Issue',
    label: 'Performance',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    color: 'border-orange-300 bg-orange-50 text-orange-700',
    activeColor: 'border-orange-500 bg-orange-100 text-orange-800 ring-2 ring-orange-300',
  },
  {
    value: 'Other',
    label: 'Other',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'border-gray-300 bg-gray-50 text-gray-600',
    activeColor: 'border-gray-500 bg-gray-100 text-gray-800 ring-2 ring-gray-400',
  },
];

const PRIORITIES = [
  { value: 'Low', label: 'Low', bg: 'bg-gray-100 text-gray-600 border-gray-200', active: 'bg-gray-700 text-white border-gray-700' },
  { value: 'Medium', label: 'Medium', bg: 'bg-blue-50 text-blue-600 border-blue-200', active: 'bg-blue-600 text-white border-blue-600' },
  { value: 'High', label: 'High', bg: 'bg-orange-50 text-orange-600 border-orange-200', active: 'bg-orange-500 text-white border-orange-500' },
  { value: 'Critical', label: 'Critical', bg: 'bg-red-50 text-red-600 border-red-200', active: 'bg-red-600 text-white border-red-600' },
];

export default function SendFeedback() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    subject: '',
    type: '',
    description: '',
    priority: 'Medium',
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const processFiles = (files) => {
    const validTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];
    const validFiles = Array.from(files).filter((f) => validTypes.includes(f.type));

    if (validFiles.length + images.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }
    if (validFiles.length !== files.length) {
      setError('Some files skipped — only PNG, JPG, JPEG, WEBP allowed.');
    } else {
      setError('');
    }

    const newPreviews = validFiles.map((f) => URL.createObjectURL(f));
    setImages((prev) => [...prev, ...validFiles]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleImageChange = (e) => processFiles(e.target.files);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processFiles(e.dataTransfer.files);
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.subject || !formData.type || !formData.description || !formData.priority) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append('subject', formData.subject);
      fd.append('type', formData.type);
      fd.append('description', formData.description);
      fd.append('priority', formData.priority);
      images.forEach((img) => fd.append('images', img));

      const result = await feedback.submit(fd);
      setSuccess(result.data);
      setFormData({ subject: '', type: '', description: '', priority: 'Medium' });
      setImages([]);
      setImagePreviews([]);
    } catch (err) {
      setError(err.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-5">
            <svg className="h-10 w-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Submitted!</h2>
          <p className="text-gray-500 text-sm mb-6">Your feedback has been received and is under review.</p>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5 mb-6">
            <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Feedback ID</p>
            <p className="text-3xl font-mono font-bold text-blue-600">{success.feedbackId}</p>
            <p className="text-xs text-gray-400 mt-1">Save this ID to track your request</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/feedback')}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors"
            >
              View All
            </button>
            <button
              onClick={() => setSuccess(null)}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              New Feedback
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 mb-6 shadow-sm">
        <button
          onClick={() => navigate('/feedback')}
          className="inline-flex items-center text-xs font-medium text-blue-200 hover:text-white mb-3 transition-colors"
        >
          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Feedback
        </button>
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Send Feedback</h1>
            <p className="text-sm text-blue-100 mt-0.5">Report bugs, request features, or share suggestions</p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type selector */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <label className="block text-sm font-semibold text-gray-800 mb-3">
            Feedback Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setFormData({ ...formData, type: t.value })}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all
                  ${formData.type === t.value ? t.activeColor : `${t.color} hover:opacity-80`}`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Subject + Priority */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          {/* Subject */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Brief summary of your feedback"
              maxLength={200}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{formData.subject.length}/200</p>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Priority <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: p.value })}
                  className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-all
                    ${formData.priority === p.value ? p.active : `${p.bg} hover:opacity-80`}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={5}
            placeholder="Describe your issue or suggestion in detail. Include steps to reproduce if reporting a bug..."
            maxLength={5000}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-y"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{formData.description.length}/5000</p>
        </div>

        {/* Screenshots */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <label className="block text-sm font-semibold text-gray-800 mb-3">
            Screenshots
            <span className="ml-2 text-xs font-normal text-gray-400">optional · up to 5 images</span>
          </label>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center gap-2 px-6 py-8 rounded-xl border-2 border-dashed cursor-pointer transition-all
              ${dragOver
                ? 'border-blue-400 bg-blue-50'
                : images.length >= 5
                  ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                  : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/50'
              }`}
          >
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${dragOver ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <svg className={`w-5 h-5 ${dragOver ? 'text-blue-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                {dragOver ? 'Drop to upload' : 'Drag & drop or click to upload'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, JPEG, WEBP</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png,image/jpg,image/jpeg,image/webp"
              onChange={handleImageChange}
              className="sr-only"
              disabled={images.length >= 5}
            />
          </div>

          {/* Previews */}
          {imagePreviews.length > 0 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group aspect-square">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="h-full w-full object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:border-blue-300 hover:text-blue-400 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pb-2">
          <button
            type="button"
            onClick={() => navigate('/feedback')}
            className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Submitting…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Submit Feedback
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
