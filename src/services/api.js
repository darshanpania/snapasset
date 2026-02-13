/**
 * API Client for Project Management
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  get(endpoint) {
    return this.request(endpoint);
  }

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

const apiClient = new ApiClient(API_BASE_URL);

// Project API
export const projectApi = {
  // Projects
  getProjects: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/projects${query ? `?${query}` : ''}`);
  },

  getProject: (id) => apiClient.get(`/projects/${id}`),

  createProject: (data) => apiClient.post('/projects', data),

  updateProject: (id, data) => apiClient.put(`/projects/${id}`, data),

  deleteProject: (id, permanent = false) => 
    apiClient.delete(`/projects/${id}${permanent ? '?permanent=true' : ''}`),

  // Project Stats
  getProjectStats: (id) => apiClient.get(`/projects/${id}/stats`),

  getDashboardStats: () => apiClient.get('/projects/stats/dashboard'),

  // Images
  getProjectImages: (id, params) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/projects/${id}/images${query ? `?${query}` : ''}`);
  },

  addImagesToProject: (id, imageIds) => 
    apiClient.post(`/projects/${id}/images`, { image_ids: imageIds }),

  removeImagesFromProject: (id, imageIds) => 
    apiClient.delete(`/projects/${id}/images`, { body: JSON.stringify({ image_ids: imageIds }) }),

  // Collaborators
  getCollaborators: (id) => apiClient.get(`/projects/${id}/collaborators`),

  addCollaborator: (id, data) => apiClient.post(`/projects/${id}/collaborators`, data),

  removeCollaborator: (id, userId) => 
    apiClient.delete(`/projects/${id}/collaborators/${userId}`),

  // Versions
  getVersionHistory: (id) => apiClient.get(`/projects/${id}/versions`),

  createVersion: (id, notes) => apiClient.post(`/projects/${id}/versions`, { notes }),

  restoreVersion: (id, versionId) => 
    apiClient.post(`/projects/${id}/versions/${versionId}/restore`),

  // Import/Export
  exportProject: (id, format = 'json') => 
    apiClient.get(`/projects/${id}/export?format=${format}`),

  importProject: (data) => apiClient.post('/projects/import', data),

  // Bulk Operations
  bulkOperation: (operation, projectIds, data = {}) => 
    apiClient.post('/projects/bulk', { operation, project_ids: projectIds, data }),

  // Analytics
  getAnalytics: (id, period = '30d') => 
    apiClient.get(`/projects/${id}/analytics?period=${period}`),

  // Templates
  getTemplates: () => apiClient.get('/projects/templates'),
};

export default apiClient;