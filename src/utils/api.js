import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5009';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor to add session ID
api.interceptors.request.use(
  (config) => {
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      config.headers['X-Session-ID'] = sessionId;
    }
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle session ID from server
api.interceptors.response.use(
  (response) => {
    const sessionId = response.headers['x-session-id'];
    if (sessionId) {
      localStorage.setItem('sessionId', sessionId);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  register: (email, password, username) => api.post('/api/auth/register', { email, password, username }),
  verify: (token) => api.post('/api/auth/verify', { token }),
  getCurrentUser: () => api.get('/api/auth/me'),
  forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/api/auth/reset-password', { token, newPassword }),
};

export const dreamAPI = {
  interpret: (dreamContent) => api.post('/api/dreams/interpret', { dreamContent }),
  getMyDreams: () => api.get('/api/dreams/my-dreams'),
  getDream: (id) => api.get(`/api/dreams/${id}`),
  shareDream: (id, title) => api.post(`/api/dreams/${id}/share`, { title }),
};

export const postAPI = {
  getSharedPosts: () => api.get('/api/posts'),
  getPost: (id) => api.get(`/api/posts/${id}`),
  addComment: (postId, content, username = null) => api.post(`/api/posts/${postId}/comments`, { content, username }),
  toggleLike: (postId) => api.post(`/api/posts/${postId}/like`),
  getComments: (postId) => api.get(`/api/posts/${postId}/comments`),
};

export const communityAPI = {
  getPosts: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    const queryString = searchParams.toString();
    return api.get(`/api/community${queryString ? `?${queryString}` : ''}`);
  },
  getPost: (id) => api.get(`/api/community/${id}`),
  createPost: (data) => api.post('/api/community', data),
  updatePost: (id, data) => api.put(`/api/community/${id}`, data),
  deletePost: (id) => api.delete(`/api/community/${id}`),
  addComment: (postId, data) => api.post(`/api/community/${postId}/comments`, data),
  getComments: (postId) => api.get(`/api/community/${postId}/comments`),
  toggleLike: (postId) => api.post(`/api/community/${postId}/like`),
};

export const adminAPI = {
  getStats: () => api.get('/api/admin/stats'),
  getUsers: () => api.get('/api/admin/users'),
  getInterpretations: () => api.get('/api/admin/interpretations'),
  getActivity: () => api.get('/api/admin/activity'),
  deleteUser: (id) => api.delete(`/api/admin/users/${id}`),
  deleteInterpretation: (id) => api.delete(`/api/admin/interpretations/${id}`),
};

export default api;