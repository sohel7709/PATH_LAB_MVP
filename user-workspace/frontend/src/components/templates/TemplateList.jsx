import React, { useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import { toggleSystemTemplateStatus } from '../../utils/api'; // Specific API for toggle
import ViewTemplateModal from './ViewTemplateModal';

const TemplateList = ({ templates: initialTemplates, loading, onEdit, onDelete, onView, onRefresh }) => {
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedTemplateForView, setSelectedTemplateForView] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTemplates = useMemo(() => {
    if (!initialTemplates) return [];
    if (!searchTerm) {
      return initialTemplates;
    }
    return initialTemplates.filter(template =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [initialTemplates, searchTerm]);

  const handleViewLocal = (template) => {
    if (onView) {
      onView(template);
    } else {
      setSelectedTemplateForView(template);
      setViewModalOpen(true);
    }
  };

  const handleCloseViewModal = () => {
    setSelectedTemplateForView(null);
    setViewModalOpen(false);
  };

  const handleToggleSystemStatus = async (templateId, currentStatus) => {
    const confirmToggle = window.confirm(
      `Are you sure you want to change the system status of this template to ${!currentStatus}?`
    );
    if (!confirmToggle) return;

    try {
      const response = await toggleSystemTemplateStatus(templateId);
      if (response.success) {
        toast.success(response.message || 'System status toggled successfully!');
        if (onRefresh) onRefresh();
      } else {
        toast.error(response.message || 'Failed to toggle system status.');
      }
    } catch (err) {
      console.error('Error toggling system status:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to toggle system status.');
    }
  };

  const handleExport = (template) => {
    if (!template || !template.jsonSchema) {
      toast.error("Cannot export template: Invalid data.");
      return;
    }
    const jsonString = JSON.stringify(template.jsonSchema, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `${template.name.replace(/\s+/g, '_')}_template.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
    toast.success(`Template "${template.name}" exported.`);
  };

  if (loading) {
    return <div className="text-center p-10">Loading templates...</div>;
  }

  return (
    <>
      <div className="my-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <h2 className="text-2xl font-semibold text-gray-700">Existing Templates ({filteredTemplates?.length || 0})</h2>
          <div className="flex items-center gap-2">
             <input
              type="text"
              placeholder="Search by name..."
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {onRefresh && (
                <button
                    onClick={onRefresh}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    title="Refresh List"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m-15.357-2a8.001 8.001 0 0015.357 2M15 15h-4.581" />
                    </svg>
                </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">System Template</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTemplates && filteredTemplates.length > 0 ? (
                filteredTemplates.map(template => (
                  <tr key={template._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{template.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{template.createdBy?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                        checked={template.isSystemTemplate}
                        onChange={() => handleToggleSystemStatus(template._id, template.isSystemTemplate)}
                        title="Toggle System Template Status"
                      />
                       <span className="ml-2">{template.isSystemTemplate ? 'Yes' : 'No'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button onClick={() => handleViewLocal(template)} className="text-indigo-600 hover:text-indigo-900" title="View">View</button>
                      <button onClick={() => onEdit(template)} className="text-yellow-600 hover:text-yellow-900" title="Edit">Edit</button>
                      <button onClick={() => onDelete(template._id, template.isSystemTemplate)} className="text-red-600 hover:text-red-900" title="Delete">Delete</button>
                      <button onClick={() => handleExport(template)} className="text-green-600 hover:text-green-900" title="Export JSON">Export</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                    No templates found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewModalOpen && selectedTemplateForView && (
        <ViewTemplateModal
          template={selectedTemplateForView}
          onClose={handleCloseViewModal}
        />
      )}
    </>
  );
};

export default TemplateList;
