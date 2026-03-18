import { useState, useEffect, useMemo } from 'react';
import { apiRoutes } from '../api/client.js';

import { useAuth } from '../context/AuthContext.jsx';
import TagCloud from '../components/discover/TagCloud.jsx';
import WatchlistCard from '../components/discover/WatchlistCard.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import './DiscoverWatchlists.css';

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
      u.previewMovies?.some(m => m.genres?.includes(activeTag))
    );
  }, [feed, activeTag, currentUser]);

  if (loading && feed.length === 0) {
    return (
      <div className="discover-page">
        <div className="discover-header">
          <h1>Discover Watchlists</h1>
          <div className="shimmer h-4 w-64 mx-auto bg-white/5 rounded mt-4" />
        </div>
        <div className="discover-feed">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="watchlist-card shimmer" style={{ height: '300px' }} />
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

      <TagCloud activeTag={activeTag} onSelect={setActiveTag} />

      {error ? (
        <div className="error-container">
          <p className="movies-message">{error}</p>
          <button onClick={() => window.location.reload()} className="retry-btn">Retry</button>
        </div>
      ) : filteredFeed.length === 0 ? (
        <div className="empty-state">
          <p className="muted">No public watchlists found for this category.</p>
          <button onClick={() => setActiveTag(null)} className="clear-filter-btn">Clear Filter</button>
        </div>
      ) : (
        <motion.div 
          className="discover-feed"
          layout
        >
          <AnimatePresence mode="popLayout">
            {filteredFeed.map((watchlist) => (
              <WatchlistCard 
                key={watchlist.id} 
                watchlist={watchlist} 
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
