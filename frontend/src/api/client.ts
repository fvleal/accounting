import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

// Token getter set during Auth0 initialization
let getAccessToken: (() => Promise<string>) | null = null;

export function setTokenGetter(getter: () => Promise<string>) {
  getAccessToken = getter;
}

// Request interceptor: attach Bearer token
apiClient.interceptors.request.use(async (config) => {
  if (getAccessToken) {
    try {
      const token = await getAccessToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch {
      // Token fetch failed -- request proceeds without auth header
      // Auth0 SDK will trigger re-login if needed
    }
  }
  return config;
});

// Response interceptor: global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid -- trigger re-auth
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
