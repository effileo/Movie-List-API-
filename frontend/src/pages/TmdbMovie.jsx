import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiRoutes, TMDB_IMG } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import './Movies.css';

export default function TmdbMovie() {
  const { tmdbId } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!tmdbId) return;
    setLoading(true);
    setError('');
    apiRoutes.movies
      .tmdb(tmdbId)
      .then(setMovie)
      .catch((err) => setError(err.message || 'Movie not found'))
      .finally(() => setLoading(false));
  }, [tmdbId]);

  async function handleAddToWatchlist() {
    if (!user || !movie?.id) return;
    setAdding(true);
    setError('');
    try {
      await apiRoutes.watchlist.add({ tmdbId: movie.id, status: 'PLANNED' });
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  if (loading) return <div className="page-center">Loading…</div>;
  if (error && !movie) return <div className="page-center"><p className="movies-message">{error}</p><Link to="/">Home</Link></div>;

  const posterUrl = movie.poster_path ? `${TMDB_IMG}${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster';
  const year = movie.release_date?.slice(0, 4);

  return (
    <div className="movie-detail">
      <div className="movie-detail-main">
        <img src={posterUrl} alt="" className="movie-detail-poster" />
        <div className="movie-detail-info">
          <h1>{movie.title}</h1>
          {year && <p className="movie-year">{year}</p>}
          {movie.vote_average != null && (
            <p className="movie-rating-agg">★ {Number(movie.vote_average).toFixed(1)} (TMDB)</p>
          )}
          {movie.overview && <p className="movie-overview">{movie.overview}</p>}
          {user && (
            <button className="btn btn-primary" onClick={handleAddToWatchlist} disabled={adding}>
              {adding ? 'Adding…' : 'Add to watchlist'}
            </button>
          )}
          {!user && <p className="muted">Log in to add this movie to your watchlist.</p>}
          {error && <p className="movies-message">{error}</p>}
        </div>
      </div>
      <p><Link to="/">← Back to home</Link></p>
    </div>
  );
}
