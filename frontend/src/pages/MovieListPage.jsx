import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiRoutes, TMDB_IMG } from '../api/client.js';
import './Movies.css';

const LIST_CONFIG = {
  trending: {
    title: 'Trending now',
    subtitle: 'The most talked about movies this week',
    api: (page) => apiRoutes.movies.trending('week', page),
  },
  popular: { title: 'Popular now', subtitle: 'Most viewed this week', api: (page) => apiRoutes.movies.popular(page) },
  'top-rated': { title: 'Top rated', subtitle: 'Highest rated of all time', api: (page) => apiRoutes.movies.topRated(page) },
};

export default function MovieListPage() {
  const { listType } = useParams();
  const config = LIST_CONFIG[listType];
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const cfg = LIST_CONFIG[listType];
    if (!cfg) {
      setError('Invalid list type');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    cfg
      .api(1)
      .then((d) => {
        setMovies(d.results ?? []);
        setHasMore((d.total_pages ?? 1) > 1);
        setPage(1);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [listType]);

  function loadMore() {
    if (!config || !hasMore || loading) return;
    const next = page + 1;
    setLoading(true);
    config
      .api(next)
      .then((d) => {
        setMovies((prev) => [...prev, ...(d.results ?? [])]);
        setHasMore(next < (d.total_pages ?? 1));
        setPage(next);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  if (!config) {
    return (
      <div className="movies-page">
        <p className="movies-message">Invalid list.</p>
        <Link to="/">Home</Link>
      </div>
    );
  }

  return (
    <div className="movies-page">
      <div className="movies-page-header">
        <h1>{config.title}</h1>
        <p className="movies-page-subtitle">{config.subtitle}</p>
        <Link to="/" className="btn btn-ghost btn-sm">← Back to home</Link>
      </div>
      {error && <p className="movies-message">{error}</p>}
      {loading && !movies.length ? (
        <div className="page-center">Loading…</div>
      ) : (
        <>
          <div className="movie-grid movie-grid-full">
            {movies.map((m) => {
              const posterUrl = m.poster_path ? `${TMDB_IMG}${m.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster';
              const rating = m.vote_average != null ? Number(m.vote_average).toFixed(1) : null;
              return (
                <Link to={`/movie/tmdb/${m.id}`} key={m.id} className="movie-card">
                  <img src={posterUrl} alt="" className="movie-poster" />
                  <div className="movie-info">
                    <h3>{m.title}</h3>
                    <p className="movie-year">{m.release_date?.slice(0, 4)}</p>
                    {rating != null && <span className="movie-rating">★ {rating}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
          {hasMore && (
            <div className="movies-load-more">
              <button type="button" className="btn btn-secondary" onClick={loadMore} disabled={loading}>
                {loading ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
