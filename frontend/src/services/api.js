import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('honeyswarm_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const fetchSessions = () => api.get('/intelligence/sessions').then(res => res.data);
export const fetchSessionIntelligence = (sessionId) => api.get(`/intelligence/sessions/${sessionId}`).then(res => res.data);
export const fetchProviderStatus = () => api.get('/ai/status').then(res => res.data);

export default api;
