import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRoutes, TMDB_IMG, posterUrl, POSTER_PLACEHOLDER } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { BookmarkPlusIcon, TrashIcon, SendIcon } from 'lucide-react';
import StarSlider from '../components/StarSlider.jsx';
import CommunityVibe from '../components/CommunityVibe.jsx';
import UserPreview from '../components/UserPreview.jsx';

export default function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [aggregate, setAggregate] = useState(null);
  const [distribution, setDistribution] = useState([]);
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
      setDistribution(res.distribution ?? []);
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
    
    // Optimistic UI: add/update the review immediately
    const optimisticReview = {
      id: 'optimistic-' + Date.now(),
      rating: reviewForm.rating,
      text: reviewForm.text || null,
      user: { id: user.id, name: user.name, avatarUrl: user.avatarUrl },
      createdAt: new Date().toISOString(),
    };
    setReviews((prev) => {
      const filtered = prev.filter((r) => r.user?.id !== user.id);
      return [optimisticReview, ...filtered];
    });

    try {
      await apiRoutes.movies.addReview(id, { rating: reviewForm.rating, text: reviewForm.text || undefined });
      await loadReviews();
      setReviewForm({ rating: 5, text: '' });
    } catch (err) {
      setError(err.message);
      await loadReviews(); // revert
    } finally {
      setSubmittingReview(false);
    }
  }

  async function handleDeleteReview(reviewId) {
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    try {
      await apiRoutes.reviews.delete(reviewId);
      await loadReviews();
    } catch (err) {
      setError(err.message);
      await loadReviews();
    }
  }

  async function handleSubmitComment(e) {
    e.preventDefault();
    if (!user || !commentForm.trim()) return;
    setSubmittingComment(true);

    // Optimistic UI
    const optimisticComment = {
      id: 'optimistic-' + Date.now(),
      text: commentForm.trim(),
      user: { id: user.id, name: user.name },
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => [optimisticComment, ...prev]);

    try {
      await apiRoutes.movies.addComment(id, { text: commentForm.trim() });
      await loadComments();
      setCommentForm('');
    } catch (err) {
      setError(err.message);
      await loadComments();
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleDeleteComment(commentId) {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    try {
      await apiRoutes.comments.delete(commentId);
      await loadComments();
    } catch (err) {
      setError(err.message);
      await loadComments();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-4 border-cinematic-accent border-t-transparent animate-spin"></div>
      </div>
    );
  }
  if (error && !movie) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-red-400">{error}</p>
        <Link to="/" className="text-cinematic-accent hover:underline">Home</Link>
      </div>
    );
  }

  const posterSrc = posterUrl(movie.posterPath) || POSTER_PLACEHOLDER;
  const myReview = reviews.find((r) => r.user?.id === user?.id);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-10">
      {/* Header: Poster + Info */}
      <div className="flex flex-col md:flex-row gap-8">
        <img
          src={posterSrc}
          alt={movie.title}
          className="w-60 h-auto rounded-2xl shadow-2xl border border-white/5 object-cover shrink-0"
          onError={(e) => { e.target.onerror = null; e.target.src = POSTER_PLACEHOLDER; }}
        />
        <div className="flex flex-col gap-4 flex-1">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">{movie.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-cinematic-muted">
            {movie.year && <span className="px-3 py-1 rounded-full border border-white/5 bg-white/5">{movie.year}</span>}
            {movie.runTime && <span>{movie.runTime} min</span>}
            {movie.genre?.length > 0 && movie.genre.map((g) => (
              <span key={g} className="px-3 py-1 rounded-full border border-white/5 bg-white/5">{g}</span>
            ))}
          </div>
          {aggregate && (
            <div className="flex items-center gap-2 text-lg">
              <span className="text-cinematic-accent font-bold">★ {aggregate.averageRating?.toFixed(1) ?? '—'}</span>
              <span className="text-cinematic-muted text-sm">({aggregate.count} review{aggregate.count !== 1 ? 's' : ''})</span>
            </div>
          )}
          {movie.Overview && <p className="text-white/70 leading-relaxed max-w-2xl">{movie.Overview}</p>}
          {user && movie.tmdbId && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="self-start flex items-center gap-2 px-5 py-2.5 rounded-full bg-cinematic-accent text-white font-semibold shadow-[0_0_40px_-15px_rgba(0,0,0,0.5)] hover:opacity-90 transition-colors disabled:opacity-50"
              onClick={handleAddToWatchlist}
              disabled={adding}
            >
              <BookmarkPlusIcon className="w-4 h-4" />
              {adding ? 'Adding…' : 'Add to Watchlist'}
            </motion.button>
          )}
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
      </div>

      {/* Community Vibe + Review Form Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Community Vibe */}
        <CommunityVibe distribution={distribution} aggregate={aggregate} />

        {/* Review Form */}
        {user && (
          <div className="p-6 rounded-2xl border border-white/5 bg-[#16161a]">
            <h3 className="text-lg font-bold mb-4 text-white">Your Review</h3>
            <form onSubmit={handleSubmitReview} className="flex flex-col gap-4">
              <StarSlider value={reviewForm.rating} onChange={(val) => setReviewForm((f) => ({ ...f, rating: val }))} />
              <textarea
                placeholder="Share your thoughts (optional)..."
                value={reviewForm.text}
                onChange={(e) => setReviewForm((f) => ({ ...f, text: e.target.value }))}
                rows={3}
                className="w-full bg-transparent border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder:text-cinematic-muted/50 focus:outline-none focus:border-white/20 transition-colors resize-none"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={submittingReview}
                className="self-start px-5 py-2.5 rounded-full bg-cinematic-accent text-white font-semibold hover:opacity-90 transition-colors disabled:opacity-50"
              >
                {submittingReview ? 'Saving…' : myReview ? 'Update Review' : 'Submit Review'}
              </motion.button>
            </form>
          </div>
        )}
      </div>

      {/* Reviews List */}
      <section id="reviews">
        <h2 className="text-xl font-bold text-white mb-4">Reviews</h2>
        <div className="flex flex-col gap-3">
          <AnimatePresence>
            {reviews.map((r) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 rounded-xl border border-white/5 bg-[#16161a] flex gap-3"
              >
                <UserPreview userId={r.user?.id}>
                  <div className="w-8 h-8 rounded-full bg-cinematic-accent flex items-center justify-center text-xs font-bold text-white shrink-0 cursor-pointer">
                    {r.user?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                </UserPreview>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white text-sm">{r.user?.name}</span>
                    <span className="text-cinematic-accent text-sm font-bold">★ {r.rating}</span>
                    {user?.id === r.user?.id && (
                      <button type="button" onClick={() => handleDeleteReview(r.id)} className="ml-auto text-slate-400 hover:text-cinematic-accent transition-colors">
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {r.text && <p className="text-sm text-white/70">{r.text}</p>}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {reviews.length === 0 && <p className="text-cinematic-muted text-sm">No reviews yet.</p>}
        </div>
      </section>

      {/* Comments */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4">Comments</h2>
        {user && (
          <form onSubmit={handleSubmitComment} className="flex gap-3 mb-4">
            <input
              type="text"
              placeholder="Add a comment…"
              value={commentForm}
              onChange={(e) => setCommentForm(e.target.value)}
              className="flex-1 bg-transparent border border-white/10 rounded-full px-5 py-2.5 text-sm text-white placeholder:text-cinematic-muted/50 focus:outline-none focus:border-white/20 transition-colors"
              required
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={submittingComment || !commentForm.trim()}
              className="p-2.5 rounded-full bg-cinematic-accent text-white hover:opacity-90 transition-colors disabled:opacity-50"
            >
              <SendIcon className="w-4 h-4" />
            </motion.button>
          </form>
        )}
        <div className="flex flex-col gap-2">
          <AnimatePresence>
            {comments.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 rounded-xl border border-white/5 bg-white/5 flex gap-3"
              >
                <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                  {c.user?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-xs">{c.user?.name}</span>
                    {user?.id === c.user?.id && (
                      <button type="button" onClick={() => handleDeleteComment(c.id)} className="ml-auto text-cinematic-muted hover:text-red-400 transition-colors">
                        <TrashIcon className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-white/70 mt-0.5">{c.text}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {comments.length === 0 && !user && <p className="text-cinematic-muted text-sm">No comments yet.</p>}
        </div>
      </section>

      <Link to="/" className="text-cinematic-accent hover:underline text-sm">← Back to home</Link>
    </div>
  );
}

