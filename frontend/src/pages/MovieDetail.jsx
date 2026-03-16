import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiRoutes, TMDB_IMG } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import './Movies.css';

export default function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await apiRoutes.movies.get(id);
        setMovie(data);
      } catch (err) {
        setError(err.message || 'Movie not found');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleAddToWatchlist() {
    if (!user || !movie?.tmdbId) return;
    setAdding(true);
    try {
      await apiRoutes.watchlist.add({ tmdbId: movie.tmdbId, status: 'PLANNED' });
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  if (loading) return <div className="page-center">Loading…</div>;
  if (error && !movie) return <div className="page-center"><p className="movies-message">{error}</p><Link to="/">Home</Link></div>;

  const posterUrl = movie.posterPath ? `${TMDB_IMG}${movie.posterPath}` : 'https://via.placeholder.com/500x750?text=No+Poster';

  return (
    <div className="movie-detail">
      <div className="movie-detail-main">
        <img src={posterUrl} alt="" className="movie-detail-poster" />
        <div className="movie-detail-info">
          <h1>{movie.title}</h1>
          <p className="movie-year">{movie.year}</p>
          {movie.genre?.length > 0 && <p>Genres: {movie.genre.join(', ')}</p>}
          {movie.runTime && <p>Runtime: {movie.runTime} min</p>}
          {movie.Overview && <p className="movie-overview">{movie.Overview}</p>}
          {user && movie.tmdbId && (
            <button className="btn btn-primary" onClick={handleAddToWatchlist} disabled={adding}>
              {adding ? 'Adding…' : 'Add to watchlist'}
            </button>
          )}
          {error && <p className="movies-message">{error}</p>}
        </div>
      </div>
      <p><Link to="/watchlist">← Back to watchlist</Link></p>
    </div>
  );
}
