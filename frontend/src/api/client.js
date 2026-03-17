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
    updateProfile: (body) => api('/auth/me', { method: 'PATCH', body: JSON.stringify(body) }),
  },
  users: {
    get: (id) => api(`/users/${id}`),
    watchlist: (id) => api(`/users/${id}/watchlist`),
  },
  movies: {
    list: (params) => api(`/movies?${new URLSearchParams(params)}`),
    featured: (limit = 6) => api(`/movies/featured?limit=${limit}`),
    popular: (page = 1) => api(`/movies/popular?page=${page}`),
    topRated: (page = 1) => api(`/movies/top-rated?page=${page}`),
    get: (id) => api(`/movies/${id}`),
    search: (q, page = 1) => api(`/movies/search?q=${encodeURIComponent(q)}&page=${page}`),
    tmdb: (id) => api(`/movies/tmdb/${id}`),
    fromTmdb: (tmdbId) => api('/movies/from-tmdb', { method: 'POST', body: JSON.stringify({ tmdbId }) }),
    reviews: (movieId) => api(`/movies/${movieId}/reviews`),
    addReview: (movieId, body) => api(`/movies/${movieId}/reviews`, { method: 'POST', body: JSON.stringify(body) }),
    comments: (movieId) => api(`/movies/${movieId}/comments`),
    addComment: (movieId, body) => api(`/movies/${movieId}/comments`, { method: 'POST', body: JSON.stringify(body) }),
  },
  watchlist: {
    list: () => api('/watchlist'),
    add: (body) => api('/watchlist', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => api(`/watchlist/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    remove: (id) => api(`/watchlist/${id}`, { method: 'DELETE' }),
  },
  reviews: {
    delete: (id) => api(`/reviews/${id}`, { method: 'DELETE' }),
  },
  comments: {
    delete: (id) => api(`/comments/${id}`, { method: 'DELETE' }),
  },
};

export const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';
