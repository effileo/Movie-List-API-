import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiRoutes, TMDB_IMG } from '../api/client.js';
import './Movies.css';

export default function PublicWatchlist() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const [{ data: userData }, { data: watchlistData }] = await Promise.all([
          apiRoutes.users.get(id),
          apiRoutes.users.watchlist(id),
        ]);
        setUser(userData);
        setItems(watchlistData ?? []);
      } catch (err) {
        setError(err.message || 'Failed to load watchlist');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="page-center">Loading…</div>;
  if (error) return <div className="page-center"><p className="movies-message">{error}</p><Link to="/">Home</Link></div>;

  return (
    <div className="movies-page">
      <h1>{user?.name}'s watchlist</h1>
      <p><Link to={`/users/${id}`}>View profile</Link></p>
      {items.length === 0 ? (
        <p className="muted">No movies in this list.</p>
      ) : (
        <div className="movie-grid">
          {items.map((item) => (
            <div key={item.id} className="movie-card">
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
