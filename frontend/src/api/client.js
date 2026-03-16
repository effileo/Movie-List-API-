const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

function getToken() {
  return localStorage.getItem('token');
}

export async function api(path, options = {}) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || res.statusText);
  return data;
}

export const apiRoutes = {
  auth: {
    register: (body) => api('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body) => api('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    logout: () => api('/auth/logout', { method: 'POST' }),
    me: () => api('/auth/me'),
  },
  movies: {
    list: (params) => api(`/movies?${new URLSearchParams(params)}`),
    get: (id) => api(`/movies/${id}`),
    search: (q, page = 1) => api(`/movies/search?q=${encodeURIComponent(q)}&page=${page}`),
    tmdb: (id) => api(`/movies/tmdb/${id}`),
    fromTmdb: (tmdbId) => api('/movies/from-tmdb', { method: 'POST', body: JSON.stringify({ tmdbId }) }),
  },
  watchlist: {
    list: () => api('/watchlist'),
    add: (body) => api('/watchlist', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => api(`/watchlist/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    remove: (id) => api(`/watchlist/${id}`, { method: 'DELETE' }),
  },
};

export const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';
