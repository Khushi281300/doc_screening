import axios from 'axios';

const TOKEN_KEY = 'CHRONICLE_AUTH_TOKEN';
const OFFICER_KEY = 'CHRONICLE_OFFICER';
const URL_KEY = 'CHRONICLE_BACKEND_URL';

export const getBackendUrl = () => {
  const custom = localStorage.getItem(URL_KEY);
  if (custom && custom.trim()) {
    const trimmed = custom.trim().replace(/\/+$/, '');
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      if (trimmed.includes('localhost') || trimmed.includes('127.0.0.1')) {
        localStorage.removeItem(URL_KEY);
        return import.meta.env.VITE_API_URL || 'https://doc-screening-49yy.onrender.com/api/v1';
      }
    }
    return trimmed;
  }
  return import.meta.env.VITE_API_URL || 'https://doc-screening-49yy.onrender.com/api/v1';
};

export const setBackendUrl = (url) => {
  if (url && url.trim()) localStorage.setItem(URL_KEY, url.trim().replace(/\/+$/, ''));
  else localStorage.removeItem(URL_KEY);
};

export const storage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getOfficer: () => { try { return JSON.parse(localStorage.getItem(OFFICER_KEY)); } catch { return null; } },
  set: (token, officer) => { localStorage.setItem(TOKEN_KEY, token); localStorage.setItem(OFFICER_KEY, JSON.stringify(officer)); },
  clear: () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(OFFICER_KEY); },
};

const api = axios.create({ baseURL: getBackendUrl(), timeout: 60000 });

api.interceptors.request.use((config) => {
  config.baseURL = getBackendUrl();
  const token = storage.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      storage.clear();
      window.dispatchEvent(new CustomEvent('chronicle-auth-expired', {
        detail: { message: error.response.data?.detail || 'Session expired. Please sign in again.' },
      }));
    }
    return Promise.reject(error);
  },
);

/** Human-readable error from an axios failure. */
export const errMsg = (err) => {
  const d = err?.response?.data?.detail;
  if (Array.isArray(d)) return d.map((x) => x.msg).join('; ');
  if (d) return d;
  if (err?.message?.includes('Network Error')) {
    return `Cannot reach the backend at ${getBackendUrl()}. Please verify the server is running and accessible.`;
  }
  return err?.message || 'Request failed';
};

// ---- auth -------------------------------------------------------------
export const loginOfficer = (badge_id, password) => api.post('/auth/login', { badge_id, password }).then((r) => r.data);
export const getOfficerProfile = () => api.get('/auth/me').then((r) => r.data);
export const checkHealth = () => api.get('/health').then((r) => r.data);

// ---- cases ------------------------------------------------------------
export const getMeta = () => api.get('/cases/meta').then((r) => r.data);
export const getStats = () => api.get('/cases/stats').then((r) => r.data);
export const searchAll = (q) => api.get('/cases/search', { params: { q } }).then((r) => r.data);
export const getCases = (params = {}) => api.get('/cases', { params }).then((r) => r.data);
export const createCase = (payload) => api.post('/cases', payload).then((r) => r.data);
export const getCaseDossier = (caseId) => api.get(`/cases/${caseId}`).then((r) => r.data);
export const verifyCase = (caseId) => api.get(`/cases/${caseId}/verify`).then((r) => r.data);
export const transferCase = (caseId, target_role, note) => api.post(`/cases/${caseId}/transfer`, { target_role, note }).then((r) => r.data);
export const setCaseStatus = (caseId, case_status, note) => api.post(`/cases/${caseId}/status`, { case_status, note }).then((r) => r.data);
export const toggleCaseLock = (caseId) => api.post(`/cases/${caseId}/lock`).then((r) => r.data);

// ---- documents --------------------------------------------------------
export const uploadDocument = (caseId, { file, doc_type, title, description }) => {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('doc_type', doc_type);
  fd.append('title', title);
  if (description) fd.append('description', description);
  return api.post(`/cases/${caseId}/documents`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
};
export const uploadNewVersion = (caseId, documentId, { file, description }) => {
  const fd = new FormData();
  fd.append('file', file);
  if (description) fd.append('description', description);
  return api.post(`/cases/${caseId}/documents/${documentId}/versions`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
};
export const getDocument = (caseId, documentId) => api.get(`/cases/${caseId}/documents/${documentId}`).then((r) => r.data);
export const redactDocument = (caseId, documentId, payload) => api.post(`/cases/${caseId}/documents/${documentId}/redact`, payload).then((r) => r.data);
export const issueCertificate = (caseId, documentId) => api.post(`/cases/${caseId}/documents/${documentId}/certificate`).then((r) => r.data);
export const verifyCertificate = (caseId, certId) => api.get(`/cases/${caseId}/certificates/${certId}/verify`).then((r) => r.data);

export const downloadDocument = async (caseId, documentId, redacted = false) => {
  const r = await api.get(`/cases/${caseId}/documents/${documentId}/download`, { params: { redacted }, responseType: 'blob' });
  const cd = r.headers['content-disposition'] || '';
  const m = cd.match(/filename="?([^"]+)"?/);
  const name = m ? m[1] : `${documentId}${redacted ? '_REDACTED.txt' : ''}`;
  const url = URL.createObjectURL(r.data);
  const a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return { filename: name, sha256: r.headers['x-document-sha256'] };
};

// ---- audit ------------------------------------------------------------
export const getAudit = (params = {}) => api.get('/audit', { params }).then((r) => r.data);
export const getAuditSummary = () => api.get('/audit/summary').then((r) => r.data);

export default api;
