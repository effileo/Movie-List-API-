import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HeartIcon, MessageCircleIcon, StarIcon, BookmarkPlusIcon, PenLineIcon } from 'lucide-react';
import { TMDB_IMG } from '../api/client';
import UserPreview from './UserPreview';

/**
 * FeedCard — A single item in the activity feed.
 * Shows user action, movie link, like heart with pop animation, and expandable comment thread.
 */

function getActionText(item) {
  switch (item.type) {
    case 'review':
      return (
        <span>
          rated{' '}
          <Link to={`/movies/${item.movie?.id}`} className="text-cinematic-accent hover:underline font-medium">
            {item.movie?.title}
          </Link>
          {' '}
          <span className="text-cinematic-accent font-bold">★ {item.rating}/10</span>
        </span>
      );
    case 'comment':
      return (
        <span>
          commented on{' '}
          <Link to={`/movies/${item.movie?.id}`} className="text-cinematic-accent hover:underline font-medium">
            {item.movie?.title}
          </Link>
        </span>
      );
    case 'watchlist':
      return (
        <span>
          added{' '}
          <Link to={`/movies/${item.movie?.id}`} className="text-cinematic-accent hover:underline font-medium">
            {item.movie?.title}
          </Link>
          {' '}to their Watchlist
        </span>
      );
    default:
      return null;
  }
}

function getActionIcon(type) {
  switch (type) {
    case 'review': return <StarIcon className="w-3.5 h-3.5 text-cinematic-accent" />;
    case 'comment': return <PenLineIcon className="w-3.5 h-3.5 text-cinematic-accent" />;
    case 'watchlist': return <BookmarkPlusIcon className="w-3.5 h-3.5 text-green-400" />;
    default: return null;
  }
}

function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function FeedCard({ item }) {
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const posterSrc = item.movie?.posterPath ? `${TMDB_IMG}${item.movie.posterPath}` : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl border border-slate-800 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group"
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <UserPreview userId={item.user?.id}>
          <Link to={`/users/${item.user?.id}`}>
            <div className="w-9 h-9 rounded-full bg-cinematic-accent flex items-center justify-center text-xs font-bold text-white shrink-0 cursor-pointer border border-white/10">
              {item.user?.name?.[0]?.toUpperCase() || '?'}
            </div>
          </Link>
        </UserPreview>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white/90 leading-relaxed">
            <Link to={`/users/${item.user?.id}`} className="font-bold hover:text-cinematic-accent transition-colors">
              {item.user?.name}
            </Link>
            {' '}
            {getActionText(item)}
          </p>

          {/* Review/Comment text preview */}
          {item.text && (
            <p className="text-xs text-cinematic-muted mt-1.5 line-clamp-2 italic">"{item.text}"</p>
          )}

          {/* Timestamp & action icon */}
          <div className="flex items-center gap-2 mt-2 text-[10px] text-cinematic-muted">
            {getActionIcon(item.type)}
            <span>{timeAgo(item.createdAt)}</span>
          </div>
        </div>

        {/* Mini poster */}
        {posterSrc && (
          <Link to={`/movies/${item.movie?.id}`} className="shrink-0">
            <img
              src={posterSrc}
              alt=""
              className="w-10 h-14 rounded-lg object-cover border border-slate-700/50 opacity-60 group-hover:opacity-100 transition-opacity"
            />
          </Link>
        )}
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-4 mt-3 ml-12 border-t border-slate-800/50 pt-2">
        {/* Like Button */}
        <button
          type="button"
          onClick={() => setLiked(!liked)}
          className="flex items-center gap-1 text-xs text-cinematic-muted hover:text-red-400 transition-colors"
        >
          <motion.div animate={liked ? { scale: [1, 1.5, 1] } : {}} transition={{ duration: 0.3 }}>
            <HeartIcon
              className={`w-4 h-4 transition-colors ${liked ? 'text-red-500 fill-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.5)]' : ''}`}
            />
          </motion.div>
          <span>{liked ? 'Liked' : 'Like'}</span>
        </button>

        {/* Comment Toggle */}
        <button
          type="button"
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1 text-xs text-cinematic-muted hover:text-cinematic-accent transition-colors"
        >
          <MessageCircleIcon className="w-4 h-4" />
          <span>Comment</span>
        </button>
      </div>

      {/* Expandable Comment Thread */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden ml-12"
          >
            <div className="mt-2 p-3 rounded-lg bg-white/[0.02] border border-slate-800/50">
              <p className="text-xs text-cinematic-muted italic">No replies yet. Start the conversation!</p>
              <input
                type="text"
                placeholder="Write a reply..."
                className="mt-2 w-full bg-transparent border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-cinematic-muted/50 focus:outline-none focus:border-cinematic-accent/50 transition-colors"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
