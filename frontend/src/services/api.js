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
export const startScenario = () => api.post('/defender/scenario/start').then(res => res.data);
export const pauseScenario = () => api.post('/defender/scenario/pause').then(res => res.data);
export const resumeScenario = () => api.post('/defender/scenario/resume').then(res => res.data);
export const stopScenario = () => api.post('/defender/scenario/stop').then(res => res.data);
export const getScenarioStatus = () => api.get('/defender/scenario/status').then(res => res.data);

export const downloadFile = async (url, filename) => {
  const response = await api.get(url, { responseType: 'blob' });
  const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
};

// Management & Report APIs
export const resetSession = (sessionId) => api.post(`/defender/session/${sessionId}/reset`).then(res => res.data);
export const resetAllSessions = () => api.post('/defender/sessions/reset-all').then(res => res.data);
export const emergencyStop = () => api.post('/defender/emergency-stop').then(res => res.data);

export const downloadJSONReport = (sessionId) => downloadFile(`/defender/report/${sessionId}/json`, `report_${sessionId.slice(0, 8)}.json`);
export const downloadPDFReport = (sessionId) => downloadFile(`/defender/report/${sessionId}/pdf`, `report_${sessionId.slice(0, 8)}.pdf`);

export default api;
