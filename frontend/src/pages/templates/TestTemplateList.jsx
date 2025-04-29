import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { testTemplates } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline';
const TestTemplateList = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const { user } = useAuth();
  
  // Check if user is a super-admin
  const isSuperAdmin = user?.role === 'super-admin';
  
  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'hematology', label: 'Hematology' },
    { value: 'biochemistry', label: 'Biochemistry' },
    { value: 'microbiology', label: 'Microbiology' },
    { value: 'immunology', label: 'Immunology' },
    { value: 'pathology', label: 'Pathology' },
    { value: 'endocrinology', label: 'Endocrinology' },
    { value: 'serology', label: 'Serology' },
    { value: 'urinalysis', label: 'Urinalysis' },
    { value: 'cardiology', label: 'Cardiology' },
    { value: 'gastroenterology', label: 'Gastroenterology' },
  ];

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Log the user object from context to verify role
      console.log('Fetching templates for user:', user); 
      
      const filters = {};
      if (searchTerm) filters.name = searchTerm;
      if (selectedCategory) filters.category = selectedCategory;
      
      const response = await testTemplates.getAll(filters);
      
      if (response.success) {
        setTemplates(response.data);
      } else {
        setError('Failed to fetch test templates');
      }
    } catch (err) {
      console.error('Error fetching test templates:', err);
      setError('Failed to load test templates. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch templates on initial mount
  useEffect(() => {
    fetchTemplates();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Refetch templates when category changes
  useEffect(() => {
    fetchTemplates();
  }, [selectedCategory]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTemplates();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        const response = await testTemplates.delete(id);
        if (response.success) {
          // Remove the deleted template from the state
          setTemplates(templates.filter(template => template._id !== id));
        } else {
          setError('Failed to delete template');
        }
      } catch (err) {
        console.error('Error deleting template:', err);
        setError('Failed to delete template. Please try again later.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl mx-auto bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
        <div className="px-8 py-6 bg-gradient-to-r from-blue-700 to-blue-500">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold text-white">Test Templates</h1>
              <p className="text-base text-blue-100 mt-1">
                Manage test templates for your lab reports
              </p>
            </div>
            {isSuperAdmin && (
              <Link
                to="/templates/create"
                className="inline-flex items-center justify-center rounded-lg border border-transparent bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Create Template
              </Link>
            )}
          </div>
        </div>
        
        <div className="p-6 space-y-6">

          {/* Filters and Search */}
          <div className="bg-white shadow-md rounded-lg border border-blue-100">
            <div className="p-6 border-b border-blue-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="sm:w-1/3">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="block w-full rounded-lg border border-blue-300 bg-blue-50 h-10 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-medium text-blue-700 transition-colors"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:w-2/3">
              <form onSubmit={handleSearch}>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                  Search Templates
                </label>
                <div className="flex">
                  <div className="relative flex-grow">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </span>
                    <input
                      type="text"
                      name="search"
                      id="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full rounded-l-lg border border-blue-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10"
                      placeholder="Search by template name"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center rounded-r-lg border border-l-0 border-blue-300 bg-blue-50 px-4 h-10 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Search
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

            {/* Templates List */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center p-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : error ? (
                <div className="p-6 text-center text-red-500 bg-red-50 rounded-lg border-l-4 border-red-500">{error}</div>
              ) : templates.length === 0 ? (
                <div className="p-12 text-center">
                  <BeakerIcon className="mx-auto h-16 w-16 text-blue-200 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No test templates found</h3>
                  <p className="text-gray-500 mb-6">Create your first template to get started</p>
                  {isSuperAdmin && (
                    <Link
                      to="/templates/create"
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                    >
                      <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                      Create Template
                    </Link>
                  )}
                </div>
              ) : (
                <table className="min-w-full divide-y divide-blue-200">
                  <thead className="bg-blue-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                        Template Name
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                        Category
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                        Sample Type
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                        Parameters
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                        Created By
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
                  <tbody className="divide-y divide-blue-100 bg-white">
                {templates.map((template) => (
                  <tr key={template._id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <BeakerIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <Link to={`/templates/${template._id}`} className="hover:text-blue-600 font-medium">
                            {template.templateName}
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        {template.category.charAt(0).toUpperCase() + template.category.slice(1)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {/* sampleType removed in new structure */}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {/* Count total parameters across all sections */}
                      {Array.isArray(template.sections)
                        ? template.sections.reduce((acc, section) => acc + (section.parameters?.length || 0), 0)
                        : 0} parameters
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {template.createdBy?.name || 'System'}
                      {template.isDefault && (
                        <span className="ml-1 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          Default
                        </span>
                      )}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <Link
                          to={`/templates/${template._id}`}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50 transition-colors"
                          title="View Template"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        {!template.isDefault && isSuperAdmin && (
                          <>
                            <Link
                              to={`/templates/${template._id}/edit`}
                              className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-50 transition-colors"
                              title="Edit Template"
                            >
                              <PencilSquareIcon className="h-5 w-5" />
                            </Link>
                            <button
                              onClick={() => handleDelete(template._id)}
                              className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50 transition-colors"
                              title="Delete Template"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestTemplateList;
