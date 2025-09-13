import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (passwordData) => api.post('/auth/change-password', passwordData),
  forgotPassword: (email) => api.post('/auth/forgot-password', email),
  resetPassword: (token, data) => api.post(`/auth/reset-password/${token}`, data),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
};

// Disease API
export const diseaseAPI = {
  predict: (formData) => api.post('/diseases/predict', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getAll: (params) => api.get('/diseases', { params }),
  getById: (id) => api.get(`/diseases/${id}`),
  create: (formData) => api.post('/diseases', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, formData) => api.put(`/diseases/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/diseases/${id}`),
  search: (params) => api.get('/diseases/search', { params }),
  getStatistics: () => api.get('/diseases/statistics'),
  getEnvironmentalRisk: (params) => api.get('/diseases/environmental-risk', { params }),
  getAdvice: (data) => api.post('/diseases/advice', data),
};

// Consultation API
// Updated consultationAPI in your api.js file
export const consultationAPI = {
  getAll: (params) => api.get('/consultations', { params }),
  getById: (id) => api.get(`/consultations/${id}`),
  
  // Fixed create method
  create: (data) => {
    // If data is FormData, send as is
    if (data instanceof FormData) {
      return api.post('/consultations', data, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        },
      });
    } 
    // If data is regular object, send as JSON
    else {
      return api.post('/consultations', data, {
        headers: { 
          'Content-Type': 'application/json'
        },
      });
    }
  },
  
  updateStatus: (id, status) => api.patch(`/consultations/${id}/status`, { status }),
  sendMessage: (id, formData) => api.post(`/consultations/${id}/messages`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  assignExpert: (id, expertId) => api.patch(`/consultations/${id}/assign`, { expertId }),
  rateConsultation: (id, data) => api.post(`/consultations/${id}/rate`, data),
  getOpenConsultations: (params) => api.get('/consultations/open', { params }),
  getStatistics: (params) => api.get('/consultations/statistics', { params }),
  delete: (id) => api.delete(`/consultations/${id}`),
};


// Weather API
export const weatherAPI = {
  getCurrent: (params) => api.get('/weather/current', { params }),
  getForecast: (params) => api.get('/weather/forecast', { params }),
  getAlerts: (params) => api.get('/weather/alerts', { params }),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserStatus: (id, data) => api.patch(`/admin/users/${id}/status`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getHealth: () => api.get('/admin/health'),
  exportUsers: (format) => api.get('/admin/export/users', {
    params: { format },
    responseType: format === 'csv' ? 'blob' : 'json',
  }),
};

// Reports API
export const reportsAPI = {
  getDiseasePrevalence: (params) => api.get('/reports/disease-prevalence', { params }),
  getRegionalAnalysis: (params) => api.get('/reports/regional-analysis', { params }),
  getExpertPerformance: (params) => api.get('/reports/expert-performance', { params }),
  getUserActivity: (params) => api.get('/reports/user-activity', { params }),
  getSystemUsage: () => api.get('/reports/system-usage'),
};

// Helper functions
export const uploadFile = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });
};

export const downloadFile = async (url, filename) => {
  try {
    const response = await api.get(url, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
};

export default api;