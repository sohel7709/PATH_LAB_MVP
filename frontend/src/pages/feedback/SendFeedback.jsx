import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { feedback } from '../../utils/api';

export default function SendFeedback() {
  const navigate = useNavigate();
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const validTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];
    const validFiles = files.filter((f) => validTypes.includes(f.type));

    if (validFiles.length + images.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    if (validFiles.length !== files.length) {
      setError('Some files were skipped. Only PNG, JPG, JPEG, and WEBP are allowed.');
    }

    const newPreviews = validFiles.map((f) => URL.createObjectURL(f));
    setImages([...images, ...validFiles]);
    setImagePreviews([...imagePreviews, ...newPreviews]);
    setError('');
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    URL.revokeObjectURL(imagePreviews[index]);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(null);

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Feedback Submitted!</h2>
          <p className="text-gray-500 mb-4">Your feedback has been submitted successfully.</p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-xs text-gray-500 mb-1">Feedback ID</p>
            <p className="text-2xl font-mono font-bold text-blue-600">{success.feedbackId}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/feedback')}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              View All Feedback
            </button>
            <button
              onClick={() => setSuccess(null)}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/feedback')}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Feedback
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Send New Feedback</h1>
        <p className="text-sm text-gray-500 mt-1">Report a bug, request a feature, or share your suggestions</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-5">
        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="Brief summary of your feedback"
            maxLength={200}
            className="w-full rounded-lg border-gray-300 shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Feedback Type <span className="text-red-500">*</span>
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full rounded-lg border-gray-300 shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select Type</option>
            <option value="Bug Report">Bug Report</option>
            <option value="Feature Request">Feature Request</option>
            <option value="Improvement Suggestion">Improvement Suggestion</option>
            <option value="UI/UX Issue">UI/UX Issue</option>
            <option value="Performance Issue">Performance Issue</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Priority <span className="text-red-500">*</span>
          </label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full rounded-lg border-gray-300 shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={5}
            placeholder="Describe your issue or suggestion in detail..."
            maxLength={5000}
            className="w-full rounded-lg border-gray-300 shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500 resize-y"
          />
          <p className="text-xs text-gray-400 mt-1">{formData.description.length}/5000 characters</p>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Screenshots (optional)
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors">
            <div className="space-y-1 text-center">
              <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                  <span>Upload images</span>
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpg,image/jpeg,image/webp"
                    onChange={handleImageChange}
                    className="sr-only"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, JPEG, WEBP up to 5 images</p>
            </div>
          </div>

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-3">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="h-24 w-full object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate('/feedback')}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              'Submit Feedback'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}