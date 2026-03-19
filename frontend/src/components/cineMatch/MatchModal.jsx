import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { posterUrl } from '../../api/client';
import { PlayIcon } from 'lucide-react';

/**
 * Full-screen "It's a Match!" modal with both avatars, movie poster, and vibrant glow.
 * Glow uses a subtle accent (or movie-themed) so it fits Premium Noir.
 */
export default function MatchModal({ open, onClose, movie, friend }) {
  if (!open) return null;

  const poster = posterUrl(movie?.poster_path);
  const title = movie?.title ?? 'Movie';

  return (
    <AnimatePresence>
      <motion.div
        className="cine-match-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="cine-match-modal"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glow behind content - vibrant but noir-friendly */}
          <div
            className="cine-match-modal-glow"
            style={{
              background: poster
                ? `radial-gradient(ellipse 80% 60% at 50% 40%, rgba(225, 29, 72, 0.25), transparent 60%)`
                : 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(225, 29, 72, 0.2), transparent 60%)',
            }}
          />

          <h2 className="cine-match-modal-title">It&apos;s a Match!</h2>
          <p className="cine-match-modal-subtitle">You both want to watch</p>

          <div className="cine-match-modal-avatars">
            <div className="cine-match-modal-avatar">
              {friend?.avatarUrl ? (
                <img src={friend.avatarUrl} alt={friend.name} />
              ) : (
                <span>{friend?.name?.slice(0, 2)?.toUpperCase() ?? '?'}</span>
              )}
            </div>
            <span className="cine-match-modal-and">&</span>
            <div className="cine-match-modal-avatar you">
              <span>You</span>
            </div>
          </div>

          <div className="cine-match-modal-poster-wrap">
            {poster ? (
              <img src={poster} alt={title} className="cine-match-modal-poster" />
            ) : (
              <div className="cine-match-modal-poster-placeholder">{title}</div>
            )}
            <p className="cine-match-modal-movie-title">{title}</p>
          </div>

          <div className="cine-match-modal-actions">
            <Link
              to={movie?.id ? `/movie/tmdb/${movie.id}` : '#'}
              className="cine-match-modal-start-btn"
              onClick={onClose}
            >
              <PlayIcon size={20} />
              Start Watching
            </Link>
            <button type="button" className="cine-match-modal-close" onClick={onClose}>
              Keep Swiping
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
