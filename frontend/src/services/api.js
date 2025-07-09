import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error('Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// PROJECT API
export const projectApi = {
  // Get all projects
  getProjects: async () => {
    try {
      const response = await apiClient.get('/projects');
      return response.data;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  },

  // Get single project
  getProject: async (projectId) => {
    try {
      const response = await apiClient.get(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching project:', error);
      throw error;
    }
  },

  // Create project
  createProject: async (projectData) => {
    try {
      const response = await apiClient.post('/projects', projectData);
      return response.data;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  // Update project
  updateProject: async (projectId, projectData) => {
    try {
      const response = await apiClient.put(`/projects/${projectId}`, projectData);
      return response.data;
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },

  // Delete project
  deleteProject: async (projectId) => {
    try {
      const response = await apiClient.delete(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }
};

// ANNOTATION API
export const annotationApi = {
  // Get annotations for a project
  getAnnotations: async (projectId) => {
    try {
      const response = await apiClient.get(`/annotations/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching annotations:', error);
      throw error;
    }
  },

  // Create annotation
  createAnnotation: async (annotationData) => {
    try {
      const response = await apiClient.post('/annotations', annotationData);
      return response.data;
    } catch (error) {
      console.error('Error creating annotation:', error);
      throw error;
    }
  },

  // Update annotation
  updateAnnotation: async (annotationId, annotationData) => {
    try {
      const response = await apiClient.put(`/annotations/${annotationId}`, annotationData);
      return response.data;
    } catch (error) {
      console.error('Error updating annotation:', error);
      throw error;
    }
  },

  // Delete annotation
  deleteAnnotation: async (annotationId) => {
    try {
      const response = await apiClient.delete(`/annotations/${annotationId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting annotation:', error);
      throw error;
    }
  },

  // Delete all annotations for a project
  deleteAllAnnotations: async (projectId) => {
    try {
      const response = await apiClient.delete(`/annotations/project/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting all annotations:', error);
      throw error;
    }
  },

  // Save annotations batch
  saveAnnotationsBatch: async (projectId, annotationsData) => {
    try {
      const response = await apiClient.post(`/annotations/batch/${projectId}`, annotationsData);
      return response.data;
    } catch (error) {
      console.error('Error saving annotations batch:', error);
      throw error;
    }
  }
};

// FILE API
export const fileApi = {
  // Upload file
  uploadFile: async (fileData) => {
    try {
      const response = await apiClient.post('/upload', fileData);
      return response.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }
};

// Utility function to convert file to base64
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

export default apiClient;