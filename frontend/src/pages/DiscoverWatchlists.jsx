import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRoutes } from '../api/client.js';
import './DiscoverWatchlists.css';

export default function DiscoverWatchlists() {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRoutes.users
      .watchlistFeed(30)
      .then((res) => setFeed(res.data ?? []))
      .catch((err) => setError(err.message || 'Failed to load feed'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-center">Loading watchlists…</div>;
  if (error) return <div className="discover-page"><p className="movies-message">{error}</p></div>;

  return (
    <div className="discover-page">
      <h1>Discover watchlists</h1>
      <p className="discover-intro">
        Browse public watchlists from other users. Open any to view their movies and interact with likes and comments.
      </p>
      {feed.length === 0 ? (
        <p className="muted">No public watchlists yet. Be the first to share yours from your watchlist page.</p>
      ) : (
        <div className="discover-grid">
          {feed.map((user) => (
            <Link
              to={`/users/${user.id}/watchlist`}
              key={user.id}
              className="discover-card"
            >
              <div className="discover-card-avatar">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" />
                ) : (
                  <div className="discover-card-avatar-placeholder" />
                )}
              </div>
              <h2 className="discover-card-name">{user.name}</h2>
              <p className="discover-card-meta">
                {user.movieCount} {user.movieCount === 1 ? 'movie' : 'movies'}
                {' · '}
                ❤️ {user.likeCount} {user.likeCount === 1 ? 'like' : 'likes'}
                {' · '}
                💬 {user.commentCount} {user.commentCount === 1 ? 'comment' : 'comments'}
              </p>
              <span className="discover-card-cta">View watchlist & interact →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
