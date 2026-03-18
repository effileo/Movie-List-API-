import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HeartIcon, MessageCircleIcon, CopyIcon, ExternalLinkIcon } from 'lucide-react';
import FanStack from './FanStack';
import UserCardHeader from './UserCardHeader';
import { apiRoutes } from '../../api/client';

export default function WatchlistCard({ watchlist }) {
  const [isHovered, setIsHovered] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(watchlist.likeCount || 0);
  const [cloning, setCloning] = useState(false);
  const [cloned, setCloned] = useState(false);

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await apiRoutes.users.toggleWatchlistLike(watchlist.id);
      setLiked(!liked);
      setLikeCount(prev => liked ? prev - 1 : prev + 1);
    } catch (err) {
      console.error('Like failed', err);
    }
  };

  const handleClone = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (cloning || cloned) return;
    setCloning(true);
    try {
      await apiRoutes.watchlist.clone(watchlist.id);
      setCloned(true);
    } catch (err) {
      console.error('Clone failed', err);
    } finally {
      setCloning(false);
    }
  };

  return (
    <motion.div 
      className="watchlist-card"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -5 }}
      layout
    >
      <UserCardHeader user={watchlist} />
      
      <Link to={`/users/${watchlist.id}/watchlist`} className="card-content-link">
        <div className="card-body">
          <FanStack movies={watchlist.previewMovies} />
          
          <div className="card-stats-overlay">
            <div className="movie-count">
              {watchlist.movieCount} {watchlist.movieCount === 1 ? 'Movie' : 'Movies'}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isHovered && (
            <motion.div 
              className="card-hover-reveal"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="hover-titles">
                {watchlist.previewMovies?.map((m, i) => (
                  <span key={i} className="hover-title-chip">{m.title}</span>
                ))}
              </div>
              <button className="view-collection-btn">
                View Full Collection <ExternalLinkIcon size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </Link>

      <div className="card-actions glass-morphism">
        <div className="left-actions">
          <button 
            className={`action-btn like-btn ${liked ? 'active' : ''}`} 
            onClick={handleLike}
          >
            <HeartIcon size={18} fill={liked ? 'currentColor' : 'none'} />
            <span>{likeCount}</span>
          </button>
          <div className="action-btn comment-btn">
            <MessageCircleIcon size={18} />
            <span>{watchlist.commentCount}</span>
          </div>
        </div>
        
        <button 
          className={`action-btn clone-btn ${cloned ? 'success' : ''}`} 
          onClick={handleClone}
          disabled={cloning || cloned}
          title="Quick Clone to your watchlist"
        >
          {cloned ? 'Saved!' : <CopyIcon size={18} />}
          {cloning ? 'Saving...' : ''}
        </button>
      </div>
    </motion.div>
  );
}
