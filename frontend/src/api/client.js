import axios from 'axios';

export const getBackendUrl = () => {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('AEGIS_BACKEND_URL');
    if (custom && custom.trim()) return custom.trim().replace(/\/+$/, '');
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
};

export const setBackendUrl = (url) => {
  if (typeof window !== 'undefined') {
    if (url && url.trim()) {
      localStorage.setItem('AEGIS_BACKEND_URL', url.trim().replace(/\/+$/, ''));
    } else {
      localStorage.removeItem('AEGIS_BACKEND_URL');
    }
  }
};

const apiClient = axios.create({
  baseURL: getBackendUrl(),
  timeout: 90000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach dynamic backend URL and offline Bearer JWT token
apiClient.interceptors.request.use((config) => {
  config.baseURL = getBackendUrl();
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('AEGIS_AUTH_TOKEN');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor: handle 401 unauthorized / expired tokens gracefully
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('AEGIS_AUTH_TOKEN');
        localStorage.removeItem('AEGIS_OFFICER');
        window.dispatchEvent(new CustomEvent('aegis-auth-expired', {
          detail: { message: error.response.data?.detail || 'Session expired. Please log in again.' }
        }));
      }
    }
    return Promise.reject(error);
  }
);

// Offline Officer Authentication Endpoints
export const loginOfficer = async (credentials) => {
  const response = await apiClient.post('/auth/login', credentials);
  return response.data;
};

export const getOfficerProfile = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

export const logoutOfficer = async () => {
  try {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  } catch (e) {
    // Offline / stateless JWT: safe fallback
    return { status: 'SUCCESS', message: 'Logged out' };
  }
};

export const checkHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

export const runFullInspection = async (payload) => {
  const response = await apiClient.post('/scan/inspect-full', payload);
  return response.data;
};

export const preprocessImage = async (payload) => {
  const response = await apiClient.post('/preprocess/quality-and-rectify', payload);
  return response.data;
};

export const runForensics = async (payload) => {
  const response = await apiClient.post('/forensics/analyze-all', payload);
  return response.data;
};

export const verifyMRZ = async (payload) => {
  const response = await apiClient.post('/mrz/verify-mrz', payload);
  return response.data;
};

export const compareFaces = async (payload) => {
  const response = await apiClient.post('/biometrics/compare-faces', payload);
  return response.data;
};

export const checkPassiveLiveness = async (payload) => {
  const response = await apiClient.post('/biometrics/liveness/passive', payload);
  return response.data;
};

export const verifyActiveChallenge = async (payload) => {
  const response = await apiClient.post('/biometrics/liveness/active-challenge', payload);
  return response.data;
};

export const getWatchlist = async () => {
  const response = await apiClient.get('/blacklist/watchlist');
  return response.data;
};

export const addToWatchlist = async (payload) => {
  const response = await apiClient.post('/blacklist/watchlist/add', payload);
  return response.data;
};

export const removeFromWatchlist = async (documentNumber) => {
  const response = await apiClient.delete(`/blacklist/watchlist/${documentNumber}`);
  return response.data;
};

export const getCheckpointAnalytics = async () => {
  const response = await apiClient.get('/analytics/checkpoint/metrics');
  return response.data;
};

export const getBlockchainLedger = async () => {
  const response = await apiClient.get('/blockchain/ledger/blocks');
  return response.data;
};

export const generateCertificate = async (payload) => {
  const response = await apiClient.post('/blockchain/certificate/generate', payload);
  return response.data;
};

export const askCopilot = async (payload) => {
  const response = await apiClient.post('/scan/copilot-chat', payload);
  return response.data;
};

export const getLlmStatus = async () => {
  const response = await apiClient.get('/scan/llm-status');
  return response.data;
};

export const submitHITLOverride = async (payload) => {
  const response = await apiClient.post('/scan/hitl-override', payload);
  return response.data;
};

export const getReviewQueue = async () => {
  const response = await apiClient.get('/scan/review-queue');
  return response.data;
};

export default apiClient;

