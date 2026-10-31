import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';
const SESSION_KEY = 'hs_session_id';
const VISITOR_KEY = 'hs_visitor_id';

export function getOrCreateVisitorId() {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = `visitor-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

export function getSessionId() {
  return localStorage.getItem(SESSION_KEY);
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

async function request(method, url, { data, params } = {}) {
  try {
    const res = await axios({
      method,
      url: API_BASE_URL + url,
      data,
      params,
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': getSessionId() || '',
      },
    });
    return res.data;
  } catch (err) {
    if (err.response && err.response.status === 404) {
      clearSession();
    }
    const message = err.response?.data?.message || err.message || 'Request failed';
    throw new Error(message);
  }
}

export const createSession = async (portalLogin) => {
  const res = await request('post', '/simulation/session', {
    data: { visitorId: getOrCreateVisitorId(), portalLogin },
  });
  localStorage.setItem(SESSION_KEY, res.sessionId);
  return res;
};

export function attachSession(sessionId) {
  localStorage.setItem(SESSION_KEY, sessionId);
};

export const getSessionInfo = () => request('get', '/simulation/session');
export const terminalCommand = (command) => request('post', '/simulation/terminal', { data: { command } });
export const listFiles = (path) => request('get', '/simulation/files', { params: { path } });
export const readFileContent = (path) => request('get', '/simulation/file-content', { params: { path } });
export const getDirectory = () => request('get', '/simulation/directory');
export const getAdminPanel = () => request('get', '/simulation/admin');
export const sendChat = (message) => request('post', '/simulation/chat', { data: { message } });
