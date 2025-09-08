import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);

    const message = error.response?.data?.error || error.message || 'An error occurred';

    // Don't show toast for certain status codes that are handled by components
    if (![401, 404].includes(error.response?.status)) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

// Session API calls
export const createReceiveSession = async (expiryMinutes = 30) => {
  try {
    const response = await api.post('/session/create', { expiryMinutes });
    return response.data;
  } catch (error) {
    console.error('Create session error:', error);
    throw error;
  }
};

export const getSessionInfo = async (sessionId) => {
  try {
    const response = await api.get(`/session/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Get session info error:', error);
    throw error;
  }
};

export const uploadFilesToSession = async (sessionId, files, onProgress = null) => {
  try {
    const formData = new FormData();

    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await api.post(`/upload/${sessionId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });

    return response.data;
  } catch (error) {
    console.error('Upload files error:', error);
    throw error;
  }
};

export const completeSession = async (sessionId) => {
  try {
    const response = await api.post(`/upload/${sessionId}/complete`);
    return response.data;
  } catch (error) {
    console.error('Complete session error:', error);
    throw error;
  }
};

export const getDownloadInfo = async (sessionId) => {
  try {
    const response = await api.get(`/session/${sessionId}/download`);
    return response.data;
  } catch (error) {
    console.error('Get download info error:', error);
    throw error;
  }
};

export const downloadFile = async (sessionId, filename, originalName) => {
  try {
    const response = await api.get(`/session/${sessionId}/file/${filename}`, {
      responseType: 'blob',
    });

    // Create blob URL and trigger download
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = originalName || filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return response;
  } catch (error) {
    console.error('Download file error:', error);
    throw error;
  }
};

export default api;
