const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to handle API responses
const handleResponse = async (response) => {
  // Handle rate limit errors specifically
  if (response.status === 429) {
    throw new Error('Too many requests. Please try again later.');
  }
  
  try {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'An error occurred');
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

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// Auth API calls
export const auth = {
  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return handleResponse(response);
  },

  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  forgotPassword: async (email) => {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  verifyToken: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// Reports API calls
export const reports = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/reports`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/reports/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  create: async (reportData) => {
    const response = await fetch(`${API_BASE_URL}/reports`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(reportData),
    });
    return handleResponse(response);
  },

  update: async (id, reportData) => {
    const response = await fetch(`${API_BASE_URL}/reports/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(reportData),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/reports/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// Lab Settings API calls
export const lab = {
  getSettings: async () => {
    const response = await fetch(`${API_BASE_URL}/lab/settings`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  updateSettings: async (settings) => {
    const response = await fetch(`${API_BASE_URL}/lab/settings`, {
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
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  create: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  update: async (id, userData) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// Dashboard API calls
export const dashboard = {
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// Patients API calls
export const patients = {
  getAll: async (labId) => {
    const url = labId 
      ? `${API_BASE_URL}/patients?lab=${labId}` 
      : `${API_BASE_URL}/patients`;
    
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  create: async (patientData) => {
    const response = await fetch(`${API_BASE_URL}/patients`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(patientData),
    });
    return handleResponse(response);
  },

  update: async (id, patientData) => {
    const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(patientData),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
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
    const response = await fetch(`${API_BASE_URL}/lab-management`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  createLab: async (labData) => {
    const response = await fetch(`${API_BASE_URL}/lab-management`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(labData),
    });
    return handleResponse(response);
  },

  getLab: async (id) => {
    const response = await fetch(`${API_BASE_URL}/lab-management/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  updateLab: async (id, labData) => {
    const response = await fetch(`${API_BASE_URL}/lab-management/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(labData),
    });
    return handleResponse(response);
  },

  deleteLab: async (id) => {
    const response = await fetch(`${API_BASE_URL}/lab-management/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getLabStats: async (id) => {
    const response = await fetch(`${API_BASE_URL}/lab-management/${id}/stats`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  updateLabSubscription: async (id, subscriptionData) => {
    const response = await fetch(`${API_BASE_URL}/lab-management/${id}/subscription`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(subscriptionData),
    });
    return handleResponse(response);
  },

  // User Management
  getUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/user-management`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  createUser: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/user-management`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  getUser: async (id) => {
    const response = await fetch(`${API_BASE_URL}/user-management/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  updateUser: async (id, userData) => {
    const response = await fetch(`${API_BASE_URL}/user-management/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  deleteUser: async (id) => {
    const response = await fetch(`${API_BASE_URL}/user-management/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // System-wide Analytics
  getSystemStats: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/system-stats`, {
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
    
    const response = await fetch(`${API_BASE_URL}/export/${type}?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    
    return handleResponse(response);
  }
};

export default {
  auth,
  reports,
  lab,
  users,
  dashboard,
  patients,
  superAdmin
};
