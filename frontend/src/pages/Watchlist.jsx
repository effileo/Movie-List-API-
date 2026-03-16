import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRoutes, TMDB_IMG } from '../api/client.js';
import './Movies.css';

export default function Watchlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await apiRoutes.watchlist.list();
        setItems(data || []);
      } catch (err) {
        setError(err.message || 'Failed to load watchlist');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleRemove(id) {
    setUpdating(id);
    try {
      await apiRoutes.watchlist.remove(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(null);
    }
  }

  async function handleStatusChange(item, newStatus) {
    setUpdating(item.id);
    try {
      const { data } = await apiRoutes.watchlist.update(item.id, { status: newStatus });
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, ...data } : i)));
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(null);
    }
  }

  if (loading) return <div className="page-center">Loading watchlist…</div>;
  if (error) return <div className="page-center"><p className="movies-message">{error}</p></div>;

  return (
    <div className="movies-page">
      <h1>My watchlist</h1>
      {items.length === 0 ? (
        <p className="movies-message">Your watchlist is empty. <Link to="/search">Search movies</Link> to add some.</p>
      ) : (
        <div className="movie-grid">
          {items.map((item) => (
            <div key={item.id} className="movie-card watchlist-card">
              <Link to={`/movies/${item.movie.id}`}>
                <img
                  src={item.movie.posterPath ? `${TMDB_IMG}${item.movie.posterPath}` : 'https://via.placeholder.com/500x750?text=No+Poster'}
                  alt=""
                  className="movie-poster"
                />
              </Link>
              <div className="movie-info">
                <h3><Link to={`/movies/${item.movie.id}`}>{item.movie.title}</Link></h3>
                <p className="movie-year">{item.movie.year}</p>
                <p className="movie-status">Status: {item.status}</p>
                {item.rating != null && <p>Rating: {item.rating}/10</p>}
                <select
                  value={item.status}
                  onChange={(e) => handleStatusChange(item, e.target.value)}
                  disabled={updating === item.id}
                >
                  <option value="PLANNED">Planned</option>
                  <option value="WATCHING">Watching</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="DROPPED">Dropped</option>
                </select>
                <button
                  className="btn btn-small btn-danger"
                  onClick={() => handleRemove(item.id)}
                  disabled={updating === item.id}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
