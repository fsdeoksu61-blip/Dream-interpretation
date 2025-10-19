import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://dream-interpretation-production.up.railway.app';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 120초로 증가 (OpenAI API 응답 시간 고려, 네트워크 지연 대응)
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

    // Enhanced error handling for better user experience
    if (error.code === 'ECONNABORTED') {
      error.message = '서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.';
    } else if (error.code === 'ERR_NETWORK') {
      error.message = '네트워크 연결을 확인해주세요.';
    } else if (!error.response) {
      error.message = '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.';
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
  changePassword: (currentPassword, newPassword) => api.post('/api/auth/change-password', { currentPassword, newPassword }),
};

export const dreamAPI = {
  interpret: (dreamContent) => api.post('/api/dreams/interpret', { dreamContent }),
  getMyDreams: () => api.get('/api/dreams/my-dreams'),
  getDream: (id) => api.get(`/api/dreams/${id}`),
  shareDream: (id, title) => api.post(`/api/dreams/${id}/share`, { title }),
};

export const postAPI = {
  getSharedPosts: (params = '') => api.get(`/api/posts${params}`),
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

export const qnaAPI = {
  getQuestions: (params = '') => api.get(`/api/qna${params}`),
  getQuestion: (id) => api.get(`/api/qna/${id}`),
  createQuestion: (data) => api.post('/api/qna', data),
  answerQuestion: (id, answer, adminPassword) => api.post(`/api/qna/${id}/answer`, { answer, adminPassword }),
  deleteAnswer: (id, adminPassword) => api.delete(`/api/qna/${id}/answer`, { data: { adminPassword } }),
};

export default api;