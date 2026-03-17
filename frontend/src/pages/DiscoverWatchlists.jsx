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
        <div className="discover-feed">
          {feed.map((user) => (
            <Link
              to={`/users/${user.id}/watchlist`}
              key={user.id}
              className="discover-post"
            >
              <header className="discover-post-header">
                <div className="discover-post-avatar">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" />
                  ) : (
                    <div className="discover-post-avatar-placeholder" />
                  )}
                </div>
                <div className="discover-post-user">
                  <span className="discover-post-name">{user.name}</span>
                  <span className="discover-post-label">shared their watchlist</span>
                </div>
              </header>
              <div className="discover-post-body">
                <p className="discover-post-stats">
                  <span>{user.movieCount} {user.movieCount === 1 ? 'movie' : 'movies'}</span>
                  <span className="discover-post-engagement">
                    <span>❤️ {user.likeCount}</span>
                    <span>💬 {user.commentCount}</span>
                  </span>
                </p>
                <span className="discover-post-cta">View watchlist · like & comment</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
