import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { testTemplates } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowLeftIcon, 
  PencilSquareIcon, 
  TrashIcon, 
  BeakerIcon,
  DocumentDuplicateIcon,
  ExclamationCircleIcon,
  CalendarDaysIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

// Helper function to format dates (consider moving to a utils file later)
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return 'Invalid Date';
  }
};

const ViewTestTemplate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  
  // Check if user is a super-admin
  const isSuperAdmin = user?.role === 'super-admin';

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // The API returns the data directly, not wrapped in a success property
        const data = await testTemplates.getById(id);
        
        // If we get here, the request was successful
        setTemplate(data);
      } catch (err) {
        console.error('Error fetching template details:', err);
        setError('Failed to load template details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      try {
        setLoading(true);
        
        // The delete method returns the response directly
        await testTemplates.delete(id);
        
        // If we get here, the delete was successful
        navigate('/templates');
      } catch (err) {
        console.error('Error deleting template:', err);
        setError('Failed to delete template. Please try again later.');
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{error}</h3>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => navigate('/templates')}
                className="inline-flex items-center rounded-md border border-transparent bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Back to Templates
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Template not found</h3>
        <p className="mt-2 text-sm text-gray-500">
          The template you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <div className="mt-6">
          <button
            type="button"
            onClick={() => navigate('/templates')}
            className="inline-flex items-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Back to Templates
          </button>
        </div>
      </div>
    );
  }

  // Main content structure
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Header */}
        <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between mb-6">
          <div className="flex items-center">
             <BeakerIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold leading-6 text-gray-900">{template.name}</h1>
              <p className="mt-1 text-sm text-gray-500">
                Viewing details for test template ID: {template._id}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-3 sm:mt-0">
            <button
              type="button"
              onClick={() => navigate('/templates')}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5 text-gray-400" aria-hidden="true" />
              Back to List
            </button>
            {/* Actions for Super Admin */}
            {isSuperAdmin && (
              <>
                <Link
                  to={`/templates/${id}/edit`}
                  className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <PencilSquareIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  <TrashIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        {/* Main Details Card */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Template Details</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              General information about this test template.
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              {/* Template Name */}
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Template Name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{template.name}</dd>
              </div>
              {/* Category */}
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Category</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                    {template.category ? template.category.charAt(0).toUpperCase() + template.category.slice(1) : 'N/A'}
                  </span>
                </dd>
              </div>
              {/* Sample Type */}
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Sample Type</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{template.sampleType || 'N/A'}</dd>
              </div>
              {/* Associated Lab (if exists and user is super admin) */}
              {isSuperAdmin && template.lab && (
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <BuildingOfficeIcon className="h-4 w-4 mr-1 text-gray-400" /> Associated Lab
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{template.lab.name || 'Unknown Lab'}</dd>
                </div>
              )}
              {/* Created By */}
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Created By</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {template.createdBy?.name || 'System'}
                  {template.isDefault && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      Default Template
                    </span>
                  )}
                </dd>
              </div>
              {/* Created At */}
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                 <dt className="text-sm font-medium text-gray-500 flex items-center">
                   <CalendarDaysIcon className="h-4 w-4 mr-1 text-gray-400" /> Created At
                 </dt>
                 <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(template.createdAt)}</dd>
              </div>
              {/* Last Updated */}
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                 <dt className="text-sm font-medium text-gray-500 flex items-center">
                   <CalendarDaysIcon className="h-4 w-4 mr-1 text-gray-400" /> Last Updated
                 </dt>
                 <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(template.updatedAt)}</dd>
              </div>
              {/* Description */}
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap">
                  {template.description || <span className="text-gray-400 italic">No description provided</span>}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Parameters Card (Regular Fields) */}
        {template.fields && template.fields.length > 0 && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Test Parameters</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Standard parameters included in this test template.
              </p>
            </div>
            <div className="border-t border-gray-200 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Parameter
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference Range
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {template.fields.map((field, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {field.parameter}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {field.unit || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {field.reference_range || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

        {/* Parameters Card (Sections) */}
        {template.sections && Object.keys(template.sections).length > 0 && (
          <div className="space-y-6">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Test Sections</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  This template is organized into the following sections.
                </p>
              </div>
            </div>

            {Object.entries(template.sections).map(([sectionName, fields], sectionIndex) => (
              <div key={sectionIndex} className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-md font-medium text-gray-900">{sectionName}</h3>
                </div>
                <div className="border-t border-gray-200 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Parameter
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reference Range
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {fields.map((field, fieldIndex) => (
                      <tr key={fieldIndex}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {field.parameter}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {field.unit || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {field.reference_range || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Show message if no parameters or sections */}
      {(!template.fields || template.fields.length === 0) && 
         (!template.sections || Object.keys(template.sections).length === 0) && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Test Parameters</h3>
            </div>
            <div className="border-t border-gray-200 p-6 text-center">
              <BeakerIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No Parameters Defined</h3>
              <p className="mt-1 text-sm text-gray-500">
                This test template currently has no parameters or sections defined.
              </p>
              {isSuperAdmin && (
                 <div className="mt-6">
                   <Link
                     to={`/templates/${id}/edit`}
                     className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                   >
                     <PencilSquareIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                     Edit Template to Add Parameters
                   </Link>
                 </div>
              )}
            </div>
          </div>
        )}
      </div> {/* Closing tag for max-w-7xl container */}
    </div> // Closing tag for py-6 container
  );
};

export default ViewTestTemplate;
