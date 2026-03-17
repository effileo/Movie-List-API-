import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiRoutes, TMDB_IMG } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import './Movies.css';

export default function PublicWatchlist() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [comments, setComments] = useState([]);
  const [likeCount, setLikeCount] = useState(0);
  const [likedByMe, setLikedByMe] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [togglingLike, setTogglingLike] = useState(false);

  const isOwn = me && String(me.id) === id;

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
        setLoading(false);
        return;
      }
      try {
        const [commentsRes, likesRes] = await Promise.all([
          apiRoutes.users.watchlistComments(id),
          apiRoutes.users.watchlistLikes(id),
        ]);
        setComments(commentsRes.data ?? []);
        setLikeCount(likesRes.data?.likeCount ?? 0);
        setLikedByMe(likesRes.data?.likedByMe ?? false);
      } catch {
        setComments([]);
        setLikeCount(0);
        setLikedByMe(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleToggleLike() {
    if (isOwn || togglingLike) return;
    setTogglingLike(true);
    setError('');
    try {
      const { data } = await apiRoutes.users.toggleWatchlistLike(id);
      setLikeCount(data.likeCount ?? 0);
      setLikedByMe(data.liked ?? false);
    } catch (err) {
      setError(err.message);
    } finally {
      setTogglingLike(false);
    }
  }

  async function handleSubmitComment(e) {
    e.preventDefault();
    if (!commentText.trim() || !me || isOwn || submittingComment) return;
    setSubmittingComment(true);
    setError('');
    try {
      const { data } = await apiRoutes.users.addWatchlistComment(id, { text: commentText.trim() });
      setComments((prev) => [data, ...prev]);
      setCommentText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleDeleteComment(commentId) {
    try {
      await apiRoutes.users.deleteWatchlistComment(id, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <div className="page-center">Loading…</div>;
  if (error && !user) return <div className="page-center"><p className="movies-message">{error}</p><Link to="/">Home</Link></div>;

  return (
    <div className="movies-page">
      <h1>{user?.name}'s watchlist</h1>
      <p><Link to={`/users/${id}`}>View profile</Link></p>
      {error && <p className="movies-message">{error}</p>}

      {/* Like & Comments engagement */}
      <section className="watchlist-engagement">
        <div className="watchlist-likes">
          {isOwn ? (
            <span className="watchlist-like-count">❤️ {likeCount} {likeCount === 1 ? 'like' : 'likes'}</span>
          ) : (
            <button
              type="button"
              className={`btn watchlist-like-btn ${likedByMe ? 'liked' : ''}`}
              onClick={handleToggleLike}
              disabled={!me || togglingLike}
              title={me ? (likedByMe ? 'Unlike' : 'Like this watchlist') : 'Log in to like'}
            >
              {likedByMe ? '❤️' : '🤍'} {likeCount} {likeCount === 1 ? 'like' : 'likes'}
            </button>
          )}
        </div>

        <div className="watchlist-comments-section">
          <h2>Comments</h2>
          {!isOwn && me && (
            <form onSubmit={handleSubmitComment} className="comment-form watchlist-comment-form">
              <textarea
                placeholder="Add a comment…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={2}
                maxLength={2000}
                required
              />
              <button type="submit" disabled={submittingComment || !commentText.trim()}>
                {submittingComment ? 'Posting…' : 'Post comment'}
              </button>
            </form>
          )}
          {!isOwn && !me && <p className="muted">Log in to comment on this watchlist.</p>}
          <ul className="comments-list watchlist-comments-list">
            {comments.map((c) => (
              <li key={c.id} className="comment-item">
                <div className="comment-header">
                  <span className="comment-user">{c.user?.name}</span>
                  {me?.id === c.user?.id && (
                    <button
                      type="button"
                      className="btn-link danger"
                      onClick={() => handleDeleteComment(c.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="comment-text">{c.text}</p>
              </li>
            ))}
          </ul>
          {comments.length === 0 && <p className="muted">No comments yet.</p>}
        </div>
      </section>

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
