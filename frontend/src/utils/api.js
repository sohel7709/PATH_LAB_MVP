// Doctors API calls
export const doctors = {
  getAll: async () => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/doctors`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/doctors/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  create: async (doctorData) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/doctors`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(doctorData),
    });
    return handleResponse(response);
  },

  update: async (id, doctorData) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/doctors/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(doctorData),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/doctors/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};


// Helper function to handle API responses
const handleResponse = async (response) => {
  // Handle rate limit errors specifically
  if (response.status === 429) {
    throw new Error('Too many requests. Please try again later.');
  }
  
  try {
    const data = await response.json();
    if (!response.ok) {
      // Create an error object with the response data
      const error = new Error(data.message || 'An error occurred');
      error.response = { data };
      throw error;
    }
    return data;
  } catch (error) {
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse response: ${response.status} ${response.statusText}`);
    }
    throw error;
  }
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// Auth API calls
export const auth = {
  login: async (credentials) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return handleResponse(response);
  },

  register: async (userData) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  forgotPassword: async (email) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  verifyToken: async () => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/verify`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  
  getProfile: async () => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  
  updateProfile: async (userData) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/updatedetails`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },
  
  changePassword: async (passwordData) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/updatepassword`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(passwordData),
    });
    return handleResponse(response);
  },
};

// Reports API calls
export const reports = {
  getAll: async (filters = {}) => {
    // Build query string from filters
    const queryParams = new URLSearchParams();
    if (filters?.lab) queryParams.append('lab', filters.lab);
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.limit) queryParams.append('limit', filters.limit); // Add limit parameter
    if (filters?.page) queryParams.append('page', filters.page);   // Add page parameter

    const queryString = queryParams.toString();
    const url = queryString 
      ? `${import.meta.env.VITE_API_BASE_URL}/reports?${queryString}` 
      : `${import.meta.env.VITE_API_BASE_URL}/reports`;
    
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getByPatientId: async (patientId, filters = {}) => { // Added function
    const queryParams = new URLSearchParams();
    queryParams.append('patientId', patientId);
    if (filters?.limit) queryParams.append('limit', filters.limit);
    if (filters?.page) queryParams.append('page', filters.page);
    if (filters?.status) queryParams.append('status', filters.status);
    // Add other relevant filters if needed

    const queryString = queryParams.toString();
    const url = `${import.meta.env.VITE_API_BASE_URL}/reports?${queryString}`;
    
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/reports/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  create: async (reportData) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/reports`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(reportData),
    });
    return handleResponse(response);
  },

  update: async (id, reportData) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/reports/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(reportData),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/reports/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// Lab Settings API calls
export const lab = {
  getSettings: async () => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/lab/settings`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  updateSettings: async (settings) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/lab/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings),
    });
    return handleResponse(response);
  },
};

// User Management API calls
export const users = {
  getAll: async () => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  create: async (userData) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  update: async (id, userData) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// Dashboard API calls
export const dashboard = {
  getStats: async (labId) => {
    const url = labId 
      ? `${import.meta.env.VITE_API_BASE_URL}/dashboard/stats?lab=${labId}` 
      : `${import.meta.env.VITE_API_BASE_URL}/dashboard/stats`;
    
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// Patients API calls
export const patients = {
  getAll: async (labId) => {
    const url = labId 
      ? `${import.meta.env.VITE_API_BASE_URL}/patients?lab=${labId}` 
      : `${import.meta.env.VITE_API_BASE_URL}/patients`;
    
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/patients/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  create: async (patientData) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/patients`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(patientData),
    });
    return handleResponse(response);
  },

  update: async (id, patientData) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/patients/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(patientData),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/patients/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// Super Admin API calls
export const superAdmin = {
  // Lab Management
  getLabs: async () => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/lab-management`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  createLab: async (labData) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/lab-management`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(labData),
    });
    return handleResponse(response);
  },

  getLab: async (id) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/lab-management/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  updateLab: async (id, labData) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/lab-management/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(labData),
    });
    return handleResponse(response);
  },

  deleteLab: async (id) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/lab-management/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getLabStats: async (id) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/lab-management/${id}/stats`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  updateLabSubscription: async (id, subscriptionData) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/lab-management/${id}/subscription`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(subscriptionData),
    });
    return handleResponse(response);
  },

  // User Management
  getUsers: async (filters = {}) => {
    // Build query string from filters
    const queryParams = new URLSearchParams();
    if (filters.lab) queryParams.append('lab', filters.lab);
    
    const queryString = queryParams.toString();
    const url = queryString 
      ? `${import.meta.env.VITE_API_BASE_URL}/user-management?${queryString}` 
      : `${import.meta.env.VITE_API_BASE_URL}/user-management`;
    
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    
    const result = await handleResponse(response);
    
    // Log the response for debugging
    console.log('User management API response:', result);
    
    return result;
  },

  createUser: async (userData) => {
    console.log('Creating user with data in API:', userData);
    
    // Ensure labId is properly set for non-super-admin users
    if (userData.role !== 'super-admin' && !userData.labId) {
      throw new Error('Lab ID is required for admin and technician roles');
    }
    
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/user-management`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    
    const result = await handleResponse(response);
    console.log('User creation API response:', result);
    return result;
  },

  getUser: async (id) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/user-management/${id}`, {
      headers: getAuthHeaders(),
    });
    
    const result = await handleResponse(response);
    
    // Log the response for debugging
    console.log('User details API response:', result);
    
    return result;
  },

  updateUser: async (id, userData) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/user-management/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  deleteUser: async (id) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/user-management/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // System-wide Analytics
  getSystemStats: async () => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/dashboard/system-stats`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Export Data
  exportData: async (type, format, filters = {}) => {
    const queryParams = new URLSearchParams({
      format,
      ...filters
    }).toString();
    
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/export/${type}?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  }
};

// Test Templates API calls
export const testTemplates = {
  getAll: async (filters = {}) => {
    // Build query string from filters
    const queryParams = new URLSearchParams();
    if (filters?.category) queryParams.append('category', filters.category);
    if (filters?.name) queryParams.append('name', filters.name);
    
    const queryString = queryParams.toString();
    
    // Get token from localStorage to include in headers
    const token = localStorage.getItem('token');
    
    // Try to decode the token to get the user role
    let role = 'admin'; // Default to admin
    if (token) {
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          role = payload.role || 'admin';
        }
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
    
    // Use different endpoints based on user role
    let baseEndpoint = '/admin/test-templates';
    if (role === 'super-admin') {
      baseEndpoint = '/super-admin/test-templates';
    } else if (role === 'technician') {
      baseEndpoint = '/technician/test-templates/all';
    }
    
    const url = queryString 
      ? `${import.meta.env.VITE_API_BASE_URL}${baseEndpoint}?${queryString}` 
      : `${import.meta.env.VITE_API_BASE_URL}${baseEndpoint}`;
    
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getById: async (id, role) => {
    // Get user role from localStorage if not provided
    if (!role) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      role = user.role || '';
    }
    
    console.log('Getting template details with role:', role);
    
    // Use different endpoints based on user role
    let baseEndpoint = '/admin/test-templates';
    if (role === 'super-admin') {
      // For superadmin, use the dedicated super-admin endpoint
      baseEndpoint = '/super-admin/test-templates';
    } else if (role === 'technician') {
      // For technicians, use the technician-specific endpoint
      baseEndpoint = '/technician/test-templates';
    } else if (role === 'admin') {
      // For admin, use the admin endpoint
      baseEndpoint = '/admin/test-templates';
    }
    
    console.log('Using endpoint:', `${import.meta.env.VITE_API_BASE_URL}${baseEndpoint}/${id}`);
    
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${baseEndpoint}/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Specific methods for technicians
  technician: {
    getAll: async (filters = {}) => {
      // Build query string from filters
      const queryParams = new URLSearchParams();
      if (filters?.category) queryParams.append('category', filters.category);
      if (filters?.name) queryParams.append('name', filters.name);
      
      const queryString = queryParams.toString();
      
      const url = queryString 
        ? `${import.meta.env.VITE_API_BASE_URL}/technician/test-templates/all?${queryString}` 
        : `${import.meta.env.VITE_API_BASE_URL}/technician/test-templates/all`;
      
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    },
    
    getById: async (id) => {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/technician/test-templates/${id}`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    }
  },

  create: async (templateData) => {
    // Both admin and super-admin can create templates
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = user.role || '';
    const baseEndpoint = role === 'super-admin' ? '/super-admin/test-templates' : '/admin/test-templates';
    
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${baseEndpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(templateData),
    });
    return handleResponse(response);
  },

  update: async (id, templateData) => {
    // Both admin and super-admin can update templates
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = user.role || '';
    const baseEndpoint = role === 'super-admin' ? '/super-admin/test-templates' : '/admin/test-templates';
    
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${baseEndpoint}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(templateData),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    // Both admin and super-admin can delete templates
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = user.role || '';
    const baseEndpoint = role === 'super-admin' ? '/super-admin/test-templates' : '/admin/test-templates';
    
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${baseEndpoint}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Technician-specific methods removed as technicians no longer have access to test templates
};

// Lab Report Settings API calls
export const labReportSettings = {
  getSettings: async (labId) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/labs/${labId}/report-settings`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  updateSettings: async (labId, settings) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/labs/${labId}/report-settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings),
    });
    return handleResponse(response);
  },

  uploadImage: async (labId, file, type) => {
    // Convert file to base64 and get MIME type
    const getBase64 = (file) => {
      return new Promise((resolve, reject) => {
        if (!file) {
          reject(new Error('No file provided'));
          return;
        }
        
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          // Extract the base64 data from the data URL
          const base64String = reader.result.split(',')[1];
          resolve({
            imageData: base64String,
            mimeType: file.type
          });
        };
        reader.onerror = (error) => reject(error);
      });
    };

    try {
      // If we have a file, convert it to base64
      let imageData, mimeType;
      
      if (file) {
        const result = await getBase64(file);
        imageData = result.imageData;
        mimeType = result.mimeType;
      } else {
        // For testing/demo purposes only - in production, always require a file
        imageData = 'mockBase64Data';
        mimeType = type === 'logo' || type === 'header' ? 'image/png' : 'image/jpeg';
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/labs/${labId}/report-settings/upload?type=${type}`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageData, mimeType })
      });
      
      return handleResponse(response);
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  generatePdf: async (reportId) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/reports/${reportId}/generate-pdf`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  }
};

// Plans API calls
export const plans = {
  getAll: async () => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/plans`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/plans/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  create: async (planData) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/plans`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(planData),
    });
    return handleResponse(response);
  },

  update: async (id, planData) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/plans/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(planData),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/plans/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// WhatsApp Notification Settings API calls
export const whatsappSettings = {
  getSettings: async () => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/settings/whatsapp`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  updateSettings: async (settings) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/settings/whatsapp`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings),
    });
    return handleResponse(response);
  }
};

// Revenue API calls
export const revenue = {
  getData: async (params = {}) => {
    // Build query string from params
    const queryParams = new URLSearchParams();
    if (params.labId) queryParams.append('labId', params.labId);
    if (params.range) queryParams.append('range', params.range);
    if (params.from) queryParams.append('from', params.from);
    if (params.to) queryParams.append('to', params.to);
    
    const queryString = queryParams.toString();
    const url = queryString 
      ? `${import.meta.env.VITE_API_BASE_URL}/revenue?${queryString}` 
      : `${import.meta.env.VITE_API_BASE_URL}/revenue`;
    
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  
  exportData: async (format, params = {}) => {
    // Build query string from params
    const queryParams = new URLSearchParams({
      format,
      ...params
    });
    
    const url = `${import.meta.env.VITE_API_BASE_URL}/export/revenue?${queryParams}`;
    
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  }
};

// Group Test Templates API calls
export const groupTestTemplates = {
  getAll: async () => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/group-test-templates`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getById: async (id) => {
    console.log(`Fetching group test template with ID: ${id}`);
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/group-test-templates/${id}`, {
      headers: getAuthHeaders(),
    });
    const result = await handleResponse(response);
    console.log(`Group test template response:`, result);
    return result;
  }
};

export default {
  auth,
  reports,
  lab,
  users,
  dashboard,
  patients,
  superAdmin,
  testTemplates,
  labReportSettings,
  doctors,
  plans,
  whatsappSettings,
  revenue,
  groupTestTemplates
};
