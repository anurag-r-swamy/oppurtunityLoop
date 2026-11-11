import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

function getCookie(name) {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

api.interceptors.request.use((config) => {
  const method = (config.method || 'get').toLowerCase();
  if (['post', 'patch', 'put', 'delete'].includes(method)) {
    const csrf = getCookie('ol_csrf');
    if (csrf) {
      config.headers['x-csrf-token'] = csrf;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 403 &&
      error.response?.data?.error?.code === 'CSRF_INVALID' &&
      !original._csrfRetried
    ) {
      original._csrfRetried = true;
      await api.get('/auth/csrf-token');
      const csrf = getCookie('ol_csrf');
      if (csrf) original.headers['x-csrf-token'] = csrf;
      return api(original);
    }
    return Promise.reject(error);
  }
);

export function getApiErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  return err?.response?.data?.error?.message || err?.message || fallback;
}

