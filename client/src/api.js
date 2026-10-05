import axios from 'axios';
import { useEffect, useState, useCallback } from 'react';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use((r) => r, (err) => {
  const isAuthCall = err.config?.url?.startsWith('/auth/login');
  if (err.response?.status === 401 && !isAuthCall) {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
  return Promise.reject(err);
});

export const errorInfo = (err) => ({
  message: err.response?.data?.message || 'Something went wrong. Please try again.',
  fields: err.response?.data?.errors || {},
});

/** Fetches `path` with params, refetching (debounced) when params change. */
export function useFetch(path, params = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const key = JSON.stringify(params);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      api.get(path, { params: JSON.parse(key) })
        .then((r) => { setData(r.data); setError(''); })
        .catch((e) => setError(errorInfo(e).message))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [path, key, tick]);

  const reload = useCallback(() => setTick((n) => n + 1), []);

  // Refetch when the user comes back to this browser tab, so stores added elsewhere show up
  useEffect(() => {
    const onFocus = () => setTick((n) => n + 1);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);
  return { data, loading, error, reload };
}

export default api;
