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
  if (response.status === 429) {
    throw new Error('Too many requests. Please try again later.');
  }
  try {
    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.message || 'An error occurred');
      error.response = { data };
      throw error;
    }
    return data;
  } catch (error) {
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

  resetPassword: async (token, password) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/reset-password/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
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
    const queryParams = new URLSearchParams();
    if (filters?.lab) queryParams.append('lab', filters.lab);
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.limit) queryParams.append('limit', filters.limit);
    if (filters?.page) queryParams.append('page', filters.page);
    const queryString = queryParams.toString();
    const url = queryString 
      ? `${import.meta.env.VITE_API_BASE_URL}/reports?${queryString}` 
      : `${import.meta.env.VITE_API_BASE_URL}/reports`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(response);
  },

  getByPatientId: async (patientId, filters = {}) => {
    const queryParams = new URLSearchParams();
    queryParams.append('patientId', patientId);
    if (filters?.limit) queryParams.append('limit', filters.limit);
    if (filters?.page) queryParams.append('page', filters.page);
    if (filters?.status) queryParams.append('status', filters.status);
    const queryString = queryParams.toString();
    const url = `${import.meta.env.VITE_API_BASE_URL}/reports?${queryString}`;
    const response = await fetch(url, { headers: getAuthHeaders() });
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
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/user-management`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  create: async (userData) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/user-management`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },
  update: async (id, userData) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/user-management/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },
  delete: async (id) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/user-management/${id}`, {
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
    const response = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(response);
  },
};

// Patients API calls
export const patients = {
  getAll: async (labId) => {
    const url = labId 
      ? `${import.meta.env.VITE_API_BASE_URL}/patients?lab=${labId}` 
      : `${import.meta.env.VITE_API_BASE_URL}/patients`;
    const response = await fetch(url, { headers: getAuthHeaders() });
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
  getUsers: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.lab) queryParams.append('lab', filters.lab);
    const queryString = queryParams.toString();
    const url = queryString 
      ? `${import.meta.env.VITE_API_BASE_URL}/user-management?${queryString}` 
      : `${import.meta.env.VITE_API_BASE_URL}/user-management`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    const result = await handleResponse(response);
        return result;
  },
  createUser: async (userData) => {
        if (userData.role !== 'super-admin' && !userData.labId) {
      throw new Error('Lab ID is required for admin and technician roles');
    }
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/user-management`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    const result = await handleResponse(response);
        return result;
  },
  getUser: async (id) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/user-management/${id}`, {
      headers: getAuthHeaders(),
    });
    const result = await handleResponse(response);
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
  getSystemStats: async () => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/dashboard/system-stats`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  exportData: async (type, format, filters = {}) => {
    const queryParams = new URLSearchParams({ format, ...filters }).toString();
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/export/${type}?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  }
};

// Test Templates API calls
export const testTemplates = {
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters?.category) queryParams.append('category', filters.category);
    if (filters?.name) queryParams.append('name', filters.name);
    const queryString = queryParams.toString();
    const token = localStorage.getItem('token');
    let role = 'admin';
    if (token) {
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          role = payload.role || 'admin';
        }
      } catch (error) {
              }
    }
    let baseEndpoint = '/admin/test-templates';
    if (role === 'super-admin') baseEndpoint = '/super-admin/test-templates';
    else if (role === 'technician') baseEndpoint = '/technician/test-templates/all';
    const url = queryString 
      ? `${import.meta.env.VITE_API_BASE_URL}${baseEndpoint}?${queryString}` 
      : `${import.meta.env.VITE_API_BASE_URL}${baseEndpoint}`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(response);
  },
  getById: async (id, role) => {
    if (!role) { const user = JSON.parse(localStorage.getItem('user') || '{}'); role = user.role || ''; }
    let baseEndpoint = '/admin/test-templates';
    if (role === 'super-admin') baseEndpoint = '/super-admin/test-templates';
    else if (role === 'technician') baseEndpoint = '/technician/test-templates';
    else if (role === 'admin') baseEndpoint = '/admin/test-templates';
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${baseEndpoint}/${id}`, { headers: getAuthHeaders() });
    return handleResponse(response);
  },
  technician: {
    getAll: async (filters = {}) => {
      const queryParams = new URLSearchParams();
      if (filters?.category) queryParams.append('category', filters.category);
      if (filters?.name) queryParams.append('name', filters.name);
      const queryString = queryParams.toString();
      const url = queryString 
        ? `${import.meta.env.VITE_API_BASE_URL}/technician/test-templates/all?${queryString}` 
        : `${import.meta.env.VITE_API_BASE_URL}/technician/test-templates/all`;
      const response = await fetch(url, { headers: getAuthHeaders() });
      return handleResponse(response);
    },
    getById: async (id) => {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/technician/test-templates/${id}`, { headers: getAuthHeaders() });
      return handleResponse(response);
    }
  },
  create: async (templateData) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = user.role || '';
    const baseEndpoint = role === 'super-admin' ? '/super-admin/test-templates' : '/admin/test-templates';
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${baseEndpoint}`, {
      method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(templateData),
    });
    return handleResponse(response);
  },
  update: async (id, templateData) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = user.role || '';
    const baseEndpoint = role === 'super-admin' ? '/super-admin/test-templates' : '/admin/test-templates';
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${baseEndpoint}/${id}`, {
      method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(templateData),
    });
    return handleResponse(response);
  },
  delete: async (id) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = user.role || '';
    const baseEndpoint = role === 'super-admin' ? '/super-admin/test-templates' : '/admin/test-templates';
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${baseEndpoint}/${id}`, {
      method: 'DELETE', headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// Lab Report Settings API calls
export const labReportSettings = {
  getSettings: async (labId) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/labs/${labId}/report-settings`, { headers: getAuthHeaders() });
    return handleResponse(response);
  },
  updateSettings: async (labId, settings) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/labs/${labId}/report-settings`, {
      method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(settings),
    });
    return handleResponse(response);
  },
  uploadImage: async (labId, file, type) => {
    const getBase64 = (file) => {
      return new Promise((resolve, reject) => {
        if (!file) { reject(new Error('No file provided')); return; }
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => { const base64String = reader.result.split(',')[1]; resolve({ imageData: base64String, mimeType: file.type }); };
        reader.onerror = (error) => reject(error);
      });
    };
    try {
      let imageData, mimeType;
      if (file) { const result = await getBase64(file); imageData = result.imageData; mimeType = result.mimeType; }
      else { imageData = 'mockBase64Data'; mimeType = type === 'logo' || type === 'header' ? 'image/png' : 'image/jpeg'; }
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/labs/${labId}/report-settings/upload?type=${type}`, {
        method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ imageData, mimeType })
      });
      return handleResponse(response);
    } catch (error) {  throw error; }
  },
  generatePdf: async (reportId) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/reports/${reportId}/generate-pdf`, {
      method: 'POST', headers: getAuthHeaders(),
    });
    return handleResponse(response);
  }
};

// Plans API calls
export const plans = {
  getAll: async () => { const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/plans`, { headers: getAuthHeaders() }); return handleResponse(response); },
  getById: async (id) => { const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/plans/${id}`, { headers: getAuthHeaders() }); return handleResponse(response); },
  create: async (planData) => { const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/plans`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(planData) }); return handleResponse(response); },
  update: async (id, planData) => { const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/plans/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(planData) }); return handleResponse(response); },
  delete: async (id) => { const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/plans/${id}`, { method: 'DELETE', headers: getAuthHeaders() }); return handleResponse(response); },
};

// Subscriptions API calls
export const subscriptions = {
  getActivePlans: async () => { const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/subscriptions/plans`, { headers: getAuthHeaders() }); return handleResponse(response); },
  requestSubscription: async (planId) => { const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/subscriptions/request`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ planId }) }); return handleResponse(response); },
  getCurrentSubscription: async () => { const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/subscriptions/current`, { headers: getAuthHeaders() }); return handleResponse(response); },
  checkStatus: async () => { const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/subscriptions/status`, { headers: getAuthHeaders() }); return handleResponse(response); },
  getAllLabSubscriptions: async () => { const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/subscriptions/admin/all`, { headers: getAuthHeaders() }); return handleResponse(response); },
  activateSubscription: async (labId, planId, duration) => { const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/subscriptions/admin/activate`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ labId, planId, duration }) }); return handleResponse(response); },
  cancelSubscription: async (labId, reason) => { const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/subscriptions/admin/cancel`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ labId, reason }) }); return handleResponse(response); },
  extendSubscription: async (labId, days, reason) => { const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/subscriptions/admin/extend`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ labId, days, reason }) }); return handleResponse(response); },
  changePlan: async (labId, planId, reason) => { const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/subscriptions/admin/change-plan`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ labId, planId, reason }) }); return handleResponse(response); },
  getHistory: async (labId) => { const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/subscriptions/admin/history/${labId}`, { headers: getAuthHeaders() }); return handleResponse(response); },
};

// WhatsApp Notification Settings API calls
export const whatsappSettings = {
  getSettings: async (labId) => { const url = labId ? `${import.meta.env.VITE_API_BASE_URL}/settings/whatsapp?lab=${labId}` : `${import.meta.env.VITE_API_BASE_URL}/settings/whatsapp`; const response = await fetch(url, { headers: getAuthHeaders() }); return handleResponse(response); },
  updateSettings: async (settings, labId) => { const body = labId ? { ...settings, labId } : settings; const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/settings/whatsapp`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(body) }); return handleResponse(response); }
};

// Revenue API calls
export const revenue = {
  getData: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.labId) queryParams.append('labId', params.labId);
    if (params.range) queryParams.append('range', params.range);
    if (params.from) queryParams.append('from', params.from);
    if (params.to) queryParams.append('to', params.to);
    const queryString = queryParams.toString();
    const url = queryString ? `${import.meta.env.VITE_API_BASE_URL}/revenue?${queryString}` : `${import.meta.env.VITE_API_BASE_URL}/revenue`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(response);
  },
  exportData: async (format, params = {}) => {
    const queryParams = new URLSearchParams({ format, ...params });
    const url = `${import.meta.env.VITE_API_BASE_URL}/export/revenue?${queryParams}`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(response);
  }
};

// Group Test Templates API calls
export const groupTestTemplates = {
  getAll: async () => { const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/group-test-templates`, { headers: getAuthHeaders() }); return handleResponse(response); },
  getById: async (id) => { const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/group-test-templates/${id}`, { headers: getAuthHeaders() }); const result = await handleResponse(response); return result; }
};

export default {
  auth, reports, lab, users, dashboard, patients, superAdmin, testTemplates,
  labReportSettings, doctors, plans, whatsappSettings, revenue, groupTestTemplates
};