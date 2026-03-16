import { useState } from 'react';
import { apiRoutes, TMDB_IMG } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import './Movies.css';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(null);
  const [message, setMessage] = useState('');
  const { user } = useAuth();

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setMessage('');
    try {
      const data = await apiRoutes.movies.search(query.trim());
      setResults(data.results || []);
      if (!data.results?.length) setMessage('No movies found.');
    } catch (err) {
      setMessage(err.message || 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToWatchlist(tmdbId) {
    if (!user) return;
    setAdding(tmdbId);
    setMessage('');
    try {
      await apiRoutes.watchlist.add({ tmdbId, status: 'PLANNED' });
      setMessage('Added to watchlist!');
    } catch (err) {
      setMessage(err.message || 'Failed to add');
    } finally {
      setAdding(null);
    }
  }

  return (
    <div className="movies-page">
      <h1>Search movies</h1>
      <form className="search-form" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search by title…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <button type="submit" disabled={loading}>{loading ? 'Searching…' : 'Search'}</button>
      </form>
      {message && <p className="movies-message">{message}</p>}
      <div className="movie-grid">
        {results.map((m) => (
          <div key={m.id} className="movie-card">
            <img
              src={m.poster_path ? `${TMDB_IMG}${m.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster'}
              alt=""
              className="movie-poster"
            />
            <div className="movie-info">
              <h3>{m.title}</h3>
              <p className="movie-year">{m.release_date?.slice(0, 4)}</p>
              {user && (
                <button
                  className="btn btn-small"
                  onClick={() => handleAddToWatchlist(m.id)}
                  disabled={adding === m.id}
                >
                  {adding === m.id ? 'Adding…' : 'Add to watchlist'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
