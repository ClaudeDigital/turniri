const API_BASE = '/ngucatinderondeshmoret/api';

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({ error: 'Gabim serveri' }));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const LOGO_URL = '/ngucatinderondeshmoret/logo.jpg';
