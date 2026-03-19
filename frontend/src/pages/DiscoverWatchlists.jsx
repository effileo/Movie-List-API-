import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiRoutes } from '../api/client.js';

import { useAuth } from '../context/AuthContext.jsx';
import TagCloud from '../components/discover/TagCloud.jsx';
import WatchlistCard from '../components/discover/WatchlistCard.jsx';
import PosterStrip from '../components/discover/PosterStrip.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { FilmIcon } from 'lucide-react';
import './DiscoverWatchlists.css';

function DiscoverEmptyState({ hasFilter, onClearFilter, suggestedUsers = [] }) {
  return (
    <motion.div
      className="discover-empty"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="discover-empty-illus">
        <FilmIcon size={64} strokeWidth={1.2} className="discover-empty-icon" />
      </div>
      <h2 className="discover-empty-title">
        {hasFilter ? 'No watchlists for this genre' : 'No watchlists yet'}
      </h2>
      <p className="discover-empty-desc">
        {hasFilter
          ? 'Try another genre or clear the filter to see all shared watchlists.'
          : 'Be the first to share your watchlist, or come back later when others have shared theirs.'}
      </p>
      {hasFilter && (
        <button type="button" onClick={onClearFilter} className="discover-empty-clear">
          Clear filter
        </button>
      )}
      {suggestedUsers.length > 0 && (
        <div className="discover-suggested">
          <p className="discover-suggested-label">Suggested users to follow</p>
          <div className="discover-suggested-strip">
            {suggestedUsers.map((u) => (
              <Link
                key={u.id}
                to={`/users/${u.id}`}
                className="discover-suggested-card"
              >
                <div className="discover-suggested-avatar">
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt={u.name} />
                  ) : (
                    <span>{u.name?.slice(0, 2)?.toUpperCase() || '?'}</span>
                  )}
                </div>
                <span className="discover-suggested-name">{u.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function DiscoverWatchlists() {
  const { user: currentUser } = useAuth();
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTag, setActiveTag] = useState(null);

  useEffect(() => {
    setLoading(true);
    apiRoutes.users
      .watchlistFeed(50)
      .then((res) => setFeed(res.data ?? []))
      .catch((err) => setError(err.message || 'Failed to load feed'))
      .finally(() => setLoading(false));
  }, []);

  // Filter feed based on activeTag and hide current user
  const filteredFeed = useMemo(() => {
    let result = feed;
    if (currentUser) {
      result = result.filter(u => u.id !== currentUser.id);
    }
    if (!activeTag) return result;
    return result.filter(u =>
      u.previewMovies?.some(m => m.genre === activeTag || (Array.isArray(m.genres) && m.genres?.includes(activeTag)))
    );
  }, [feed, activeTag, currentUser]);

  const [sortBy, setSortBy] = useState('recent');
  const sortedFeed = useMemo(() => {
    const list = [...filteredFeed];
    if (sortBy === 'trending') {
      list.sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
    } else if (sortBy === 'cloned') {
      list.sort((a, b) => (b.cloneCount ?? b.likeCount ?? 0) - (a.cloneCount ?? a.likeCount ?? 0));
    } else {
      list.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
    }
    return list;
  }, [filteredFeed, sortBy]);

  if (loading && feed.length === 0) {
    return (
      <div className="discover-page">
        <div className="discover-header">
          <h1>Discover Watchlists</h1>
          <p className="discover-intro">Explore curated collections from the community.</p>
        </div>
        <div className="discover-feed discover-feed-skeleton">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="discover-watchlist-card discover-card-skeleton">
              <div className="discover-card-header discover-skeleton-header" />
              <div className="discover-card-body discover-skeleton-body">
                <PosterStrip loading />
                <div className="discover-skeleton-caption" />
              </div>
              <div className="discover-card-engagement discover-skeleton-engagement" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="discover-page theme-cinematic">
      <header className="discover-header">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Discover Watchlists
        </motion.h1>
        <motion.p 
          className="discover-intro"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Explore curated collections from the community. Swipe, clone, and follow your favorite cinephiles.
        </motion.p>
      </header>

      <div className="discover-toolbar">
        <TagCloud activeTag={activeTag} onSelect={setActiveTag} />
        <div className="discover-sort-wrap">
          <label htmlFor="discover-sort" className="discover-sort-label">Sort by</label>
          <select
            id="discover-sort"
            className="discover-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="recent">Most Recent</option>
            <option value="trending">Trending</option>
            <option value="cloned">Most Cloned</option>
          </select>
        </div>
      </div>

      {error ? (
        <div className="discover-error">
          <p>{error}</p>
          <button type="button" onClick={() => window.location.reload()} className="discover-retry-btn">Retry</button>
        </div>
      ) : sortedFeed.length === 0 ? (
        <DiscoverEmptyState
          hasFilter={!!activeTag}
          onClearFilter={() => setActiveTag(null)}
          suggestedUsers={feed.filter(u => currentUser?.id !== u.id).slice(0, 6)}
        />
      ) : (
        <motion.div className="discover-feed" layout>
          <AnimatePresence mode="popLayout">
            {sortedFeed.map((watchlist) => (
              <WatchlistCard key={watchlist.id} watchlist={watchlist} loading={false} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
