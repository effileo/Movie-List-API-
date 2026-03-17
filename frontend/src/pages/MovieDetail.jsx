import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiRoutes, TMDB_IMG } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import './Movies.css';

export default function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [aggregate, setAggregate] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, text: '' });
  const [commentForm, setCommentForm] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const { user } = useAuth();

  function loadMovie() {
    return apiRoutes.movies.get(id).then((res) => setMovie(res.data));
  }
  function loadReviews() {
    return apiRoutes.movies.reviews(id).then((res) => {
      setReviews(res.data ?? []);
      setAggregate(res.aggregate ?? null);
    });
  }
  function loadComments() {
    return apiRoutes.movies.comments(id).then((res) => setComments(res.data ?? []));
  }

  useEffect(() => {
    (async () => {
      try {
        await loadMovie();
        await Promise.all([loadReviews(), loadComments()]);
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

  async function handleSubmitReview(e) {
    e.preventDefault();
    if (!user) return;
    setSubmittingReview(true);
    try {
      await apiRoutes.movies.addReview(id, { rating: reviewForm.rating, text: reviewForm.text || undefined });
      await loadReviews();
      setReviewForm({ rating: 5, text: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingReview(false);
    }
  }

  async function handleDeleteReview(reviewId) {
    try {
      await apiRoutes.reviews.delete(reviewId);
      await loadReviews();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSubmitComment(e) {
    e.preventDefault();
    if (!user || !commentForm.trim()) return;
    setSubmittingComment(true);
    try {
      await apiRoutes.movies.addComment(id, { text: commentForm.trim() });
      await loadComments();
      setCommentForm('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleDeleteComment(commentId) {
    try {
      await apiRoutes.comments.delete(commentId);
      await loadComments();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <div className="page-center">Loading…</div>;
  if (error && !movie) return <div className="page-center"><p className="movies-message">{error}</p><Link to="/">Home</Link></div>;

  const posterUrl = movie.posterPath ? `${TMDB_IMG}${movie.posterPath}` : 'https://via.placeholder.com/500x750?text=No+Poster';
  const myReview = reviews.find((r) => r.user?.id === user?.id);

  return (
    <div className="movie-detail">
      <div className="movie-detail-main">
        <img src={posterUrl} alt="" className="movie-detail-poster" />
        <div className="movie-detail-info">
          <h1>{movie.title}</h1>
          <p className="movie-year">{movie.year}</p>
          {movie.genre?.length > 0 && <p>Genres: {movie.genre.join(', ')}</p>}
          {movie.runTime && <p>Runtime: {movie.runTime} min</p>}
          {aggregate && (
            <p className="movie-rating-agg">
              ★ {aggregate.averageRating?.toFixed(1) ?? '—'} ({aggregate.count} review{aggregate.count !== 1 ? 's' : ''})
            </p>
          )}
          {movie.Overview && <p className="movie-overview">{movie.Overview}</p>}
          {user && movie.tmdbId && (
            <button className="btn btn-primary" onClick={handleAddToWatchlist} disabled={adding}>
              {adding ? 'Adding…' : 'Add to watchlist'}
            </button>
          )}
          {error && <p className="movies-message">{error}</p>}
        </div>
      </div>

      <section className="movie-reviews">
        <h2>Reviews</h2>
        {user && (
          <form onSubmit={handleSubmitReview} className="review-form">
            <label>
              Your rating (1–10):{' '}
              <input
                type="number"
                min={1}
                max={10}
                value={reviewForm.rating}
                onChange={(e) => setReviewForm((f) => ({ ...f, rating: Number(e.target.value) }))}
              />
            </label>
            <textarea
              placeholder="Your review (optional)"
              value={reviewForm.text}
              onChange={(e) => setReviewForm((f) => ({ ...f, text: e.target.value }))}
              rows={2}
            />
            <button type="submit" disabled={submittingReview}>{submittingReview ? 'Saving…' : myReview ? 'Update review' : 'Submit review'}</button>
          </form>
        )}
        <ul className="reviews-list">
          {reviews.map((r) => (
            <li key={r.id} className="review-item">
              <div className="review-header">
                <span className="review-user">{r.user?.name}</span>
                <span className="review-rating">★ {r.rating}</span>
                {user?.id === r.user?.id && (
                  <button type="button" className="btn-link danger" onClick={() => handleDeleteReview(r.id)}>Delete</button>
                )}
              </div>
              {r.text && <p className="review-text">{r.text}</p>}
            </li>
          ))}
        </ul>
        {reviews.length === 0 && !user && <p className="muted">No reviews yet.</p>}
      </section>

      <section className="movie-comments">
        <h2>Comments</h2>
        {user && (
          <form onSubmit={handleSubmitComment} className="comment-form">
            <textarea
              placeholder="Add a comment…"
              value={commentForm}
              onChange={(e) => setCommentForm(e.target.value)}
              rows={2}
              required
            />
            <button type="submit" disabled={submittingComment || !commentForm.trim()}>{submittingComment ? 'Sending…' : 'Post'}</button>
          </form>
        )}
        <ul className="comments-list">
          {comments.map((c) => (
            <li key={c.id} className="comment-item">
              <div className="comment-header">
                <span className="comment-user">{c.user?.name}</span>
                {user?.id === c.user?.id && (
                  <button type="button" className="btn-link danger" onClick={() => handleDeleteComment(c.id)}>Delete</button>
                )}
              </div>
              <p className="comment-text">{c.text}</p>
            </li>
          ))}
        </ul>
        {comments.length === 0 && !user && <p className="muted">No comments yet.</p>}
      </section>

      <p><Link to="/watchlist">← Back to watchlist</Link></p>
    </div>
  );
}
