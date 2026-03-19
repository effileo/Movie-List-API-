import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HeartIcon, MessageCircleIcon, CopyIcon, ExternalLinkIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import PosterStrip from './PosterStrip';
import UserCardHeader from './UserCardHeader';
import { apiRoutes } from '../../api/client';
import { useToast } from '../ui/ToastProvider';

const CARD_MIN_HEIGHT = 320;

export default function WatchlistCard({ watchlist, loading = false, currentUserId = null }) {
  const { showToast } = useToast();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(watchlist?.likeCount ?? 0);
  const [cloning, setCloning] = useState(false);
  const [cloned, setCloned] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);

  const caption = watchlist?.description?.trim() || `Shared a watchlist · ${watchlist?.movieCount ?? 0} ${watchlist?.movieCount === 1 ? 'movie' : 'movies'}`;
  const captionLong = caption.length > 80;
  const showReadMore = captionLong && !captionExpanded;

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!watchlist?.id) return;
    try {
      await apiRoutes.users.toggleWatchlistLike(watchlist.id);
      setLiked(!liked);
      setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
    } catch (err) {
      console.error('Like failed', err);
    }
  };

  const targetUserId = watchlist?.id != null ? Number(watchlist.id) : NaN;
  const isOwnWatchlist =
    currentUserId != null && !Number.isNaN(targetUserId) && targetUserId === Number(currentUserId);

  const handleClone = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (cloning || cloned || Number.isNaN(targetUserId)) return;
    if (isOwnWatchlist) {
      showToast('You already have your own watchlist — open Watchlist to edit it.', 'error');
      return;
    }
    setCloning(true);
    try {
      const res = await apiRoutes.watchlist.clone(targetUserId);
      const count = res?.clonedCount ?? 0;
      if (count > 0) {
        showToast(
          `Added ${count} movie${count === 1 ? '' : 's'} to your watchlist!`
        );
        window.dispatchEvent(new CustomEvent('watchlist:updated'));
      } else {
        showToast(res?.message || 'Those movies are already in your watchlist.');
      }
      setCloned(true);
    } catch (err) {
      console.error('Clone failed', err);
      showToast(err?.message || 'Could not clone this watchlist.', 'error');
    } finally {
      setCloning(false);
    }
  };

  return (
    <motion.div
      className="discover-watchlist-card"
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <header className="discover-card-header">
        <UserCardHeader user={watchlist} />
      </header>

      <Link to={`/users/${watchlist?.id}/watchlist`} className="discover-card-body-link">
        <div className="discover-card-body" style={{ minHeight: CARD_MIN_HEIGHT - 140 }}>
          <PosterStrip
            movies={watchlist?.previewMovies}
            movieCount={watchlist?.movieCount ?? 0}
            loading={loading}
          />

          <div className="discover-card-caption-wrap">
            <AnimatePresence initial={false}>
              {showReadMore ? (
                <motion.p
                  key="clamped"
                  className="discover-card-caption discover-card-caption-clamp"
                  initial={false}
                  exit={{ opacity: 0 }}
                >
                  {caption.slice(0, 80)}…
                </motion.p>
              ) : (
                <motion.p
                  key="full"
                  className="discover-card-caption"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {caption}
                </motion.p>
              )}
            </AnimatePresence>
            {captionLong && (
              <button
                type="button"
                className="discover-card-read-more"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCaptionExpanded(!captionExpanded);
                }}
              >
                {captionExpanded ? (
                  <>Show less <ChevronUpIcon size={12} /></>
                ) : (
                  <>Read more <ChevronDownIcon size={12} /></>
                )}
              </button>
            )}
          </div>

          <span className="discover-card-view-collection">
            View collection <ExternalLinkIcon size={12} />
          </span>
        </div>
      </Link>

      <footer className="discover-card-engagement">
        <div className="discover-engagement-left">
          <button
            type="button"
            className={`discover-action-btn like-btn ${liked ? 'active' : ''}`}
            onClick={handleLike}
            aria-label="Like"
          >
            <HeartIcon size={18} fill={liked ? 'currentColor' : 'none'} />
            <span>{likeCount}</span>
          </button>
          <span className="discover-action-btn comment-btn" aria-hidden>
            <MessageCircleIcon size={18} />
            <span>{watchlist?.commentCount ?? 0}</span>
          </span>
          <button
            type="button"
            className={`discover-action-btn clone-btn ${cloned ? 'success' : ''}`}
            onClick={handleClone}
            disabled={cloning || cloned || isOwnWatchlist}
            aria-label={cloned ? 'Saved' : 'Clone watchlist'}
          >
            {cloned ? (
              'Saved!'
            ) : (
              <>
                <CopyIcon size={18} />
                {cloning ? 'Saving…' : 'Clone'}
              </>
            )}
          </button>
        </div>
      </footer>
    </motion.div>
  );
}
