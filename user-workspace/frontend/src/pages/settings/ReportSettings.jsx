import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { labReportSettings } from '../../utils/api';
import { 
  DocumentTextIcon, 
  ArrowUpTrayIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon 
} from '@heroicons/react/24/outline';
import ReportPreview from '../../components/reports/ReportPreview';

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
      logo: '',
      headerImage: '',
      headerImageType: ''
    },
    footer: {
      verifiedBy: '',
      designation: 'Consultant Pathologist',
      signature: '',
      signatureType: '',
      footerImage: '',
      footerImageType: ''
    },
    styling: {
      primaryColor: '#3b82f6',
      secondaryColor: '#1e40af',
      fontFamily: 'Arial, sans-serif',
      fontSize: 12
    }
  });
  
  // File input references
  const headerInputRef = React.useRef(null);
  const footerInputRef = React.useRef(null);
  const signatureInputRef = React.useRef(null);

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

  // Handle file upload (logo, header, footer, or signature)
  const handleFileUpload = async (type, file) => {
    try {
      if (!file) {
        return;
      }
      
      // Validate file type
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        setError(`Invalid file type. Please upload a PNG or JPG image.`);
        return;
      }
      
      setError('');
      setSaving(true);
      
      const response = await labReportSettings.uploadImage(user.lab, file, type);
      
      if (response.success) {
        if (type === 'header') {
          setSettings(prev => ({
            ...prev,
            header: {
              ...prev.header,
              headerImage: response.data.url,
              headerImageType: response.data.mimeType
            }
          }));
        } else if (type === 'footer') {
          setSettings(prev => ({
            ...prev,
            footer: {
              ...prev.footer,
              footerImage: response.data.url,
              footerImageType: response.data.mimeType
            }
          }));
        } else if (type === 'signature') {
          setSettings(prev => ({
            ...prev,
            footer: {
              ...prev.footer,
              signature: response.data.url,
              signatureType: response.data.mimeType
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
      
      // Create a simplified version of the settings object to avoid potential issues
      const settingsToSave = {
        header: {
          headerImage: settings.header.headerImage,
          headerImageType: settings.header.headerImageType
        },
        footer: {
          verifiedBy: settings.footer.verifiedBy,
          designation: settings.footer.designation,
          signature: settings.footer.signature,
          signatureType: settings.footer.signatureType,
          footerImage: settings.footer.footerImage,
          footerImageType: settings.footer.footerImageType
        },
        styling: {
          primaryColor: settings.styling.primaryColor,
          secondaryColor: settings.styling.secondaryColor,
          fontFamily: settings.styling.fontFamily,
          fontSize: settings.styling.fontSize
        }
      };
      
      const response = await labReportSettings.updateSettings(user.lab, settingsToSave);
      
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
        <ReportPreview settings={settings} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header Settings */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Header Settings</h3>
              <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-6">
                  <label className="block text-sm font-medium text-gray-700">
                    Header Image
                  </label>
                  <div className="mt-1 flex items-center">
                    {settings.header.headerImage ? (
                      <div className="relative">
                        <img 
                          src={settings.header.headerImage} 
                          alt="Header Image" 
                          className="h-16 w-auto object-contain" 
                        />
                        <button
                          type="button"
                          onClick={() => {
                            handleChange('header', 'headerImage', '');
                            handleChange('header', 'headerImageType', '');
                          }}
                          className="absolute -top-2 -right-2 bg-red-100 rounded-full p-1 text-red-600 hover:bg-red-200"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="h-16 w-32 bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                        No Header Image
                      </div>
                    )}
                    <input
                      type="file"
                      ref={headerInputRef}
                      className="hidden"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={(e) => handleFileUpload('header', e.target.files[0])}
                    />
                    <button
                      type="button"
                      onClick={() => headerInputRef.current.click()}
                      className="ml-5 rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <ArrowUpTrayIcon className="h-4 w-4 inline mr-1" />
                      Upload Header
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    <span className="font-semibold text-blue-600">Required size: 2480x480 pixels @ 300 DPI</span>, PNG or JPEG format. 
                    This image will be displayed at the top of the report. The header area is fixed and will be reserved even if no image is provided.
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
                    <input
                      type="file"
                      ref={signatureInputRef}
                      className="hidden"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={(e) => handleFileUpload('signature', e.target.files[0])}
                    />
                    <button
                      type="button"
                      onClick={() => signatureInputRef.current.click()}
                      className="ml-5 rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <ArrowUpTrayIcon className="h-4 w-4 inline mr-1" />
                      Upload Signature
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Recommended size: 200x100 pixels, PNG or JPEG format with transparent background.
                  </p>
                </div>

                <div className="sm:col-span-6">
                  <label className="block text-sm font-medium text-gray-700">
                    Footer Image
                  </label>
                  <div className="mt-1 flex items-center">
                    {settings.footer.footerImage ? (
                      <div className="relative">
                        <img 
                          src={settings.footer.footerImage} 
                          alt="Footer Image" 
                          className="h-16 w-auto object-contain" 
                        />
                        <button
                          type="button"
                          onClick={() => {
                            handleChange('footer', 'footerImage', '');
                            handleChange('footer', 'footerImageType', '');
                          }}
                          className="absolute -top-2 -right-2 bg-red-100 rounded-full p-1 text-red-600 hover:bg-red-200"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="h-16 w-32 bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                        No Footer Image
                      </div>
                    )}
                    <input
                      type="file"
                      ref={footerInputRef}
                      className="hidden"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={(e) => handleFileUpload('footer', e.target.files[0])}
                    />
                    <button
                      type="button"
                      onClick={() => footerInputRef.current.click()}
                      className="ml-5 rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <ArrowUpTrayIcon className="h-4 w-4 inline mr-1" />
                      Upload Footer
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    <span className="font-semibold text-blue-600">Required size: 2480x200 pixels @ 300 DPI</span>, PNG or JPEG format.
                    This image will be displayed at the bottom of the report. The footer area is fixed and will be reserved even if no image is provided.
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
                    <span className="ml-2 text-sm text-gray-500">{settings.styling.primaryColor}</span>
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
                    <span className="ml-2 text-sm text-gray-500">{settings.styling.secondaryColor}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
