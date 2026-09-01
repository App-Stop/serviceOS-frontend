import axios from 'axios';

export const API_BASE_URL =
  import.meta.env?.VITE_API_BASE_URL ?? 'http://localhost:6007';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach token from localStorage if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Every endpoint answers with the `{ success, message, data?, pagination? }`
 * envelope, so callers only ever want the `data` half.
 */
export const unwrap = (response) => response?.data?.data ?? null;

export const unwrapList = (response) => {
  const data = unwrap(response);
  return Array.isArray(data) ? data : [];
};

/**
 * Turns an axios failure into a single human-readable line. A 422 carries the
 * per-field Zod issues under `error` as `{ path, message }[]` — the first one
 * is far more useful than the generic "Unprocessable Entity" message.
 */
export const getErrorMessage = (error, fallback = 'Something went wrong.') => {
  const body = error?.response?.data;
  const issues = body?.error;

  if (Array.isArray(issues) && issues.length) {
    return issues[0]?.message || body?.message || fallback;
  }

  return body?.message || error?.message || fallback;
};

export default api;
