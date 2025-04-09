import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { labReportSettings } from '../../utils/api';
import { 
  DocumentTextIcon, 
  ArrowUpTrayIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon 
} from '@heroicons/react/24/outline';

const ReportSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  
  // Form state
  const [settings, setSettings] = useState({
    header: {
      labName: '',
      doctorName: '',
      address: '',
      phone: '',
      email: '',
      logo: ''
    },
    footer: {
      verifiedBy: '',
      designation: 'Consultant Pathologist',
      signature: ''
    },
    styling: {
      primaryColor: '#3b82f6',
      secondaryColor: '#1e40af',
      fontFamily: 'Arial, sans-serif',
      fontSize: 12
    }
  });

  // Fetch lab report settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError('');
        
        if (!user || !user.lab) {
          setError('No lab associated with your account');
          setLoading(false);
          return;
        }
        
        const response = await labReportSettings.getSettings(user.lab);
        
        if (response.success) {
          setSettings(response.data);
        } else {
          setError('Failed to fetch report settings');
        }
      } catch (err) {
        console.error('Error fetching report settings:', err);
        setError('Failed to load report settings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  // Handle form input changes
  const handleChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // Handle color changes
  const handleColorChange = (colorField, value) => {
    setSettings(prev => ({
      ...prev,
      styling: {
        ...prev.styling,
        [colorField]: value
      }
    }));
  };

  // Handle file upload (logo or signature)
  const handleFileUpload = async (type) => {
    try {
      setError('');
      setSaving(true);
      
      // In a real implementation, this would upload the file
      // For now, we'll just simulate the upload
      const response = await labReportSettings.uploadImage(user.lab, null, type);
      
      if (response.success) {
        if (type === 'logo') {
          setSettings(prev => ({
            ...prev,
            header: {
              ...prev.header,
              logo: response.data.url
            }
          }));
        } else {
          setSettings(prev => ({
            ...prev,
            footer: {
              ...prev.footer,
              signature: response.data.url
            }
          }));
        }
        
        setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(`Failed to upload ${type}`);
      }
    } catch (err) {
      console.error(`Error uploading ${type}:`, err);
      setError(`Failed to upload ${type}. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  // Save settings
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setSuccess('');
      setSaving(true);
      
      const response = await labReportSettings.updateSettings(user.lab, settings);
      
      if (response.success) {
        setSuccess('Report settings saved successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to save report settings');
      }
    } catch (err) {
      console.error('Error saving report settings:', err);
      setError('Failed to save report settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Toggle preview mode
  const togglePreview = () => {
    setPreviewMode(!previewMode);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-blue-500 mr-2" />
            Report Settings
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Customize how your lab reports look when printed or exported as PDF
          </p>
        </div>
        <div className="mt-4 flex space-x-3 sm:mt-0">
          <button
            type="button"
            onClick={togglePreview}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {previewMode ? 'Edit Settings' : 'Preview Report'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">{success}</h3>
            </div>
          </div>
        </div>
      )}

      {previewMode ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Report Preview</h3>
            <div className="mt-5 border-2 border-gray-300 p-4">
              {/* Report Header */}
              <div className="border-b-2 pb-4 mb-4" style={{ borderColor: settings.styling.primaryColor }}>
                <div className="flex justify-between items-center">
                  <div>
                    {settings.header.logo ? (
                      <img 
                        src={settings.header.logo} 
                        alt="Lab Logo" 
                        className="h-16 w-auto object-contain mb-2" 
                      />
                    ) : (
                      <div className="h-16 w-32 bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                        Logo Placeholder
                      </div>
                    )}
                    <h2 className="text-xl font-bold" style={{ color: settings.styling.primaryColor }}>
                      {settings.header.labName || 'Lab Name'}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {settings.header.doctorName || 'Doctor Name'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {settings.header.address || 'Lab Address'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {settings.header.phone && `Phone: ${settings.header.phone}`}
                      {settings.header.email && settings.header.phone && ' | '}
                      {settings.header.email && `Email: ${settings.header.email}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-lg font-semibold" style={{ color: settings.styling.secondaryColor }}>
                      PATHOLOGY REPORT
                    </h3>
                    <p className="text-sm text-gray-600">Report ID: SAMPLE-12345</p>
                    <p className="text-xs text-gray-500">Date: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Patient Info */}
              <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><span className="font-semibold">Patient Name:</span> John Doe</p>
                  <p><span className="font-semibold">Age/Gender:</span> 45 Years / Male</p>
                  <p><span className="font-semibold">Patient ID:</span> P-98765</p>
                </div>
                <div>
                  <p><span className="font-semibold">Sample Collection:</span> {new Date().toLocaleDateString()}</p>
                  <p><span className="font-semibold">Sample Type:</span> Blood</p>
                  <p><span className="font-semibold">Referring Doctor:</span> Dr. Smith</p>
                </div>
              </div>

              {/* Test Results */}
              <div className="mb-6">
                <h4 className="text-md font-semibold mb-2 pb-1 border-b" style={{ color: settings.styling.secondaryColor }}>
                  HEMATOLOGY
                </h4>
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th scope="col" className="py-2 pl-4 pr-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Test
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Result
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reference Range
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="py-2 pl-4 pr-3 text-sm font-medium text-gray-900">
                        Hemoglobin
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-500">
                        14.5
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-500">
                        g/dL
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-500">
                        13.0 - 17.0
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 pl-4 pr-3 text-sm font-medium text-gray-900">
                        WBC Count
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-500">
                        7.5
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-500">
                        x10³/μL
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-500">
                        4.5 - 11.0
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-4 border-t-2" style={{ borderColor: settings.styling.primaryColor }}>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-gray-500">
                      This report is electronically verified. No signature is required.
                    </p>
                    <p className="text-xs text-gray-500">
                      Report generated on {new Date().toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    {settings.footer.signature ? (
                      <img 
                        src={settings.footer.signature} 
                        alt="Signature" 
                        className="h-12 w-auto object-contain mb-1 ml-auto" 
                      />
                    ) : (
                      <div className="h-12 w-32 bg-gray-200 flex items-center justify-center text-gray-500 text-sm ml-auto mb-1">
                        Signature
                      </div>
                    )}
                    <p className="font-semibold text-sm">
                      {settings.footer.verifiedBy || 'Verified By'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {settings.footer.designation}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header Settings */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Header Settings</h3>
              <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="labName" className="block text-sm font-medium text-gray-700">
                    Lab Name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="labName"
                      id="labName"
                      value={settings.header.labName}
                      onChange={(e) => handleChange('header', 'labName', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="doctorName" className="block text-sm font-medium text-gray-700">
                    Doctor Name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="doctorName"
                      id="doctorName"
                      value={settings.header.doctorName}
                      onChange={(e) => handleChange('header', 'doctorName', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="address"
                      id="address"
                      value={settings.header.address}
                      onChange={(e) => handleChange('header', 'address', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="phone"
                      id="phone"
                      value={settings.header.phone}
                      onChange={(e) => handleChange('header', 'phone', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="mt-1">
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={settings.header.email}
                      onChange={(e) => handleChange('header', 'email', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label className="block text-sm font-medium text-gray-700">
                    Logo
                  </label>
                  <div className="mt-1 flex items-center">
                    {settings.header.logo ? (
                      <div className="relative">
                        <img 
                          src={settings.header.logo} 
                          alt="Lab Logo" 
                          className="h-16 w-auto object-contain" 
                        />
                        <button
                          type="button"
                          onClick={() => handleChange('header', 'logo', '')}
                          className="absolute -top-2 -right-2 bg-red-100 rounded-full p-1 text-red-600 hover:bg-red-200"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="h-16 w-32 bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                        No Logo
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleFileUpload('logo')}
                      className="ml-5 rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <ArrowUpTrayIcon className="h-4 w-4 inline mr-1" />
                      Upload Logo
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Recommended size: 200x100 pixels, PNG or JPEG format
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Settings */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Footer Settings</h3>
              <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="verifiedBy" className="block text-sm font-medium text-gray-700">
                    Verified By
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="verifiedBy"
                      id="verifiedBy"
                      value={settings.footer.verifiedBy}
                      onChange={(e) => handleChange('footer', 'verifiedBy', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="designation" className="block text-sm font-medium text-gray-700">
                    Designation
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="designation"
                      id="designation"
                      value={settings.footer.designation}
                      onChange={(e) => handleChange('footer', 'designation', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label className="block text-sm font-medium text-gray-700">
                    Signature
                  </label>
                  <div className="mt-1 flex items-center">
                    {settings.footer.signature ? (
                      <div className="relative">
                        <img 
                          src={settings.footer.signature} 
                          alt="Signature" 
                          className="h-16 w-auto object-contain" 
                        />
                        <button
                          type="button"
                          onClick={() => handleChange('footer', 'signature', '')}
                          className="absolute -top-2 -right-2 bg-red-100 rounded-full p-1 text-red-600 hover:bg-red-200"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="h-16 w-32 bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                        No Signature
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleFileUpload('signature')}
                      className="ml-5 rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <ArrowUpTrayIcon className="h-4 w-4 inline mr-1" />
                      Upload Signature
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Recommended size: 200x100 pixels, PNG or JPEG format with transparent background
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Styling Settings */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Styling Settings</h3>
              <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700">
                    Primary Color
                  </label>
                  <div className="mt-1 flex items-center">
                    <input
                      type="color"
                      name="primaryColor"
                      id="primaryColor"
                      value={settings.styling.primaryColor}
                      onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                      className="h-8 w-8 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={settings.styling.primaryColor}
                      onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                      className="ml-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="secondaryColor" className="block text-sm font-medium text-gray-700">
                    Secondary Color
                  </label>
                  <div className="mt-1 flex items-center">
                    <input
                      type="color"
                      name="secondaryColor"
                      id="secondaryColor"
                      value={settings.styling.secondaryColor}
                      onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                      className="h-8 w-8 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={settings.styling.secondaryColor}
                      onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                      className="ml-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="fontFamily" className="block text-sm font-medium text-gray-700">
                    Font Family
                  </label>
                  <div className="mt-1">
                    <select
                      id="fontFamily"
                      name="fontFamily"
                      value={settings.styling.fontFamily}
                      onChange={(e) => handleColorChange('fontFamily', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="Arial, sans-serif">Arial</option>
                      <option value="'Times New Roman', serif">Times New Roman</option>
                      <option value="'Courier New', monospace">Courier New</option>
                      <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                      <option value="'Verdana', sans-serif">Verdana</option>
                    </select>
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="fontSize" className="block text-sm font-medium text-gray-700">
                    Base Font Size (px)
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name="fontSize"
                      id="fontSize"
                      min="8"
                      max="16"
                      value={settings.styling.fontSize}
                      onChange={(e) => handleColorChange('fontSize', parseInt(e.target.value))}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ReportSettings;
