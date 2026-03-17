import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRoutes, TMDB_IMG } from '../api/client.js';
import './Landing.css';

export default function Landing() {
  const { user, loading } = useAuth();
  const [popular, setPopular] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [loadingTopRated, setLoadingTopRated] = useState(true);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    Promise.all([
      apiRoutes.movies.popular(1).then((d) => setPopular(d.results?.slice(0, 12) ?? [])).catch(() => setPopular([])),
      apiRoutes.movies.topRated(1).then((d) => setTopRated(d.results?.slice(0, 12) ?? [])).catch(() => setTopRated([])),
      apiRoutes.movies.featured(6).then((res) => setFeatured(res.data ?? [])).catch(() => setFeatured([])),
    ])
      .finally(() => {
        setLoadingPopular(false);
        setLoadingTopRated(false);
        setLoadingFeatured(false);
      });
  }, []);

  if (loading) {
    return <div className="page-center">Loading…</div>;
  }

  function MovieRow({ title, subtitle, movies, loading: rowLoading, emptyMsg }) {
    if (rowLoading) {
      return (
        <section className="landing-row">
          <div className="landing-row-header">
            <h2>{title}</h2>
            {subtitle && <p className="landing-row-subtitle">{subtitle}</p>}
          </div>
          <div className="landing-row-loading">{emptyMsg || 'Loading…'}</div>
        </section>
      );
    }
    if (!movies?.length) return null;
    return (
      <section className="landing-row">
        <div className="landing-row-header">
          <h2>{title}</h2>
          {subtitle && <p className="landing-row-subtitle">{subtitle}</p>}
        </div>
        <div className="landing-movie-scroll">
          {movies.map((m) => {
            const posterUrl = m.poster_path
              ? `${TMDB_IMG}${m.poster_path}`
              : 'https://via.placeholder.com/500x750?text=No+Poster';
            const rating = m.vote_average != null ? Number(m.vote_average).toFixed(1) : null;
            const year = m.release_date?.slice(0, 4);
            const url = m.id != null ? `/movie/tmdb/${m.id}` : null;
            return (
              <Link to={url || '#'} key={m.id} className="landing-movie-card">
                <div className="landing-movie-poster">
                  <img src={posterUrl} alt={m.title} loading="lazy" />
                  {rating != null && <span className="landing-movie-rating">★ {rating}</span>}
                </div>
                <div className="landing-movie-info">
                  <h3>{m.title}</h3>
                  {year && <span>{year}</span>}
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <div className="landing">
      <section className="landing-hero">
        <div className="landing-hero-bg" aria-hidden="true" />
        <div className="landing-hero-inner">
          <div className="landing-hero-content">
            <h1>Your movie watchlist, reimagined</h1>
            <p className="landing-tagline">
              Search thousands of movies, save what you want to watch, rate and review them, and share your list with friends.
            </p>
            {user ? (
              <div className="landing-actions">
                <Link to="/search" className="btn btn-primary btn-lg">Search movies</Link>
                <Link to="/watchlist" className="btn btn-secondary btn-lg">My watchlist</Link>
                <Link to="/profile" className="btn btn-ghost btn-lg">My profile</Link>
              </div>
            ) : (
              <div className="landing-actions">
                <Link to="/register" className="btn btn-primary btn-lg">Get started free</Link>
                <Link to="/login" className="btn btn-secondary btn-lg">Log in</Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <MovieRow
        title="Popular now"
        subtitle="Most viewed this week"
        movies={popular}
        loading={loadingPopular}
        emptyMsg="Could not load popular movies."
      />
      <MovieRow
        title="Top rated"
        subtitle="Highest rated of all time"
        movies={topRated}
        loading={loadingTopRated}
        emptyMsg="Could not load top rated movies."
      />

      {(loadingFeatured || featured.length > 0) && (
        <section className="landing-row landing-reviews">
          <div className="landing-row-header">
            <h2>Community reviews</h2>
            <p className="landing-row-subtitle">What others are saying</p>
          </div>
          {loadingFeatured ? (
            <div className="landing-row-loading">Loading…</div>
          ) : featured.length === 0 ? (
            <div className="landing-row-loading">No reviews yet. Search a movie and add the first review!</div>
          ) : (
            <div className="recommendations-grid">
              {featured.map(({ movie, featuredReview, aggregate }) => {
                const posterUrl = movie.posterPath
                  ? `${TMDB_IMG}${movie.posterPath}`
                  : 'https://via.placeholder.com/500x750?text=No+Poster';
                return (
                  <Link to={`/movies/${movie.id}`} key={movie.id} className="recommendation-card">
                    <div className="recommendation-poster-wrap">
                      <img src={posterUrl} alt={movie.title} loading="lazy" />
                      {aggregate?.averageRating != null && (
                        <span className="recommendation-rating-badge">
                          ★ {Number(aggregate.averageRating).toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="recommendation-body">
                      <h3 className="recommendation-title">{movie.title}</h3>
                      {movie.year && <span className="recommendation-year">{movie.year}</span>}
                      {featuredReview && (
                        <div className="recommendation-review">
                          <span className="recommendation-review-meta">
                            {featuredReview.user?.name} · ★ {featuredReview.rating}
                          </span>
                          {featuredReview.text && (
                            <p className="recommendation-review-text">
                              {featuredReview.text.length > 120
                                ? `${featuredReview.text.slice(0, 120)}…`
                                : featuredReview.text}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}

      <section className="landing-features">
        <h2>Everything in one place</h2>
        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">🔍</span>
            <h3>Search & discover</h3>
            <p>Find any movie and add it to your list in one click.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">⭐</span>
            <h3>Rate & review</h3>
            <p>Give ratings and write reviews so others can see what you think.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">👥</span>
            <h3>Share your list</h3>
            <p>Make your watchlist public and let friends see what you're watching.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
