import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRoutes, TMDB_IMG, posterUrl, POSTER_PLACEHOLDER } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import './Movies.css';

export default function Watchlist() {
  const { user: me } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const publicWatchlistUrl = me?.id ? `${window.location.origin}/users/${me.id}/watchlist` : null;
  function copyShareLink() {
    if (!publicWatchlistUrl) return;
    navigator.clipboard.writeText(publicWatchlistUrl).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }

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

      {/* Post / Share watchlist – others can like & comment */}
      {me && (
        <section className="watchlist-share-section">
          <h2>Share your watchlist</h2>
          <p className="watchlist-share-desc">
            Post your watchlist so others can view it, like it, and leave comments. When your watchlist is public, anyone with the link can interact with it.
          </p>
          <div className="watchlist-share-actions">
            <Link to={`/users/${me.id}/watchlist`} className="btn btn-secondary">
              View my public watchlist
            </Link>
            {publicWatchlistUrl && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={copyShareLink}>
                {linkCopied ? 'Copied!' : 'Copy link'}
              </button>
            )}
          </div>
          <p className="muted watchlist-share-hint">Turn "Watchlist public" on in your profile to allow others to see it.</p>
        </section>
      )}

      {items.length === 0 ? (
        <p className="movies-message">Your watchlist is empty. <Link to="/search">Search movies</Link> to add some.</p>
      ) : (
        <div className="movie-grid">
          {items.map((item) => (
            <div key={item.id} className="movie-card watchlist-card">
              <Link to={`/movies/${item.movie.id}`}>
                <img
                  src={posterUrl(item.movie.posterPath) || POSTER_PLACEHOLDER}
                  alt=""
                  className="movie-poster"
                  onError={(e) => { e.target.onerror = null; e.target.src = POSTER_PLACEHOLDER; }}
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
