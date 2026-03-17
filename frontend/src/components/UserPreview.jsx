import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRoutes, TMDB_IMG } from '../api/client';

/**
 * UserPreview — Glassmorphic popover on avatar hover.
 * Shows top 3 movies and total watched count.
 */
export default function UserPreview({ userId, children }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef(null);
  const cacheRef = useRef({});

  const handleEnter = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      setOpen(true);
      if (cacheRef.current[userId]) {
        setData(cacheRef.current[userId]);
        return;
      }
      setLoading(true);
      try {
        const res = await apiRoutes.users.preview(userId);
        cacheRef.current[userId] = res.data;
        setData(res.data);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleLeave = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setOpen(false), 200);
  };

  return (
    <div className="relative inline-block" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {children}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-4 rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.6)] z-50"
          >
            {/* Arrow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 rotate-45 bg-slate-900/80 border-r border-b border-slate-700/60"></div>
            
            {loading ? (
              <div className="flex items-center justify-center h-16">
                <div className="w-5 h-5 rounded-full border-2 border-cinematic-accent border-t-transparent animate-spin"></div>
              </div>
            ) : data ? (
              <div>
                <p className="font-bold text-white text-sm mb-1">{data.name}</p>
                {data.bio && <p className="text-xs text-cinematic-muted mb-3 line-clamp-2">{data.bio}</p>}
                <p className="text-xs text-cinematic-muted mb-2">
                  <span className="text-white font-semibold">{data.totalWatched}</span> movies watched
                </p>
                
                {data.topMovies?.length > 0 && (
                  <>
                    <p className="text-[10px] text-cinematic-muted uppercase tracking-widest mb-2">Top Rated</p>
                    <div className="flex gap-2">
                      {data.topMovies.map((tm) => (
                        <div key={tm.movie.id} className="w-14 h-20 rounded-lg overflow-hidden border border-slate-700/50 relative group/poster">
                          <img
                            src={tm.movie.posterPath ? `${TMDB_IMG}${tm.movie.posterPath}` : ''}
                            alt={tm.movie.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-[9px] text-center py-0.5 font-bold text-yellow-400">
                            ★ {tm.rating}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
