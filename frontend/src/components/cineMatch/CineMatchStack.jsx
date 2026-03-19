import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CineMatchCard from './CineMatchCard';
import MatchModal from './MatchModal';
import { apiRoutes } from '../../api/client';

const PRELOAD_THRESHOLD = 5;

export default function CineMatchStack({ friendId, friends, selectedFriend, partnerStatus }) {
  const [stack, setStack] = useState([]);
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState(null); // { movie, friend }

  const loadStack = useCallback(async (replace = false) => {
    try {
      const res = await apiRoutes.cineMatch.stack();
      const results = res.results ?? [];
      if (replace) {
        setStack(results);
      } else {
        setStack((prev) => {
          const ids = new Set(prev.map((m) => m.id));
          const newOnes = results.filter((m) => !ids.has(m.id));
          return [...prev, ...newOnes];
        });
      }
    } catch (err) {
      console.error('Cine-Match stack load failed', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setStack([]);
    setLoading(true);
    loadStack();
  }, [loadStack]);

  useEffect(() => {
    if (stack.length <= PRELOAD_THRESHOLD && !loading) {
      loadStack();
    }
  }, [stack.length, loading, loadStack]);

  const handleSwipe = async (direction, movie) => {
    if (!movie?.id) return;
    const current = stack[0];
    if (current?.id !== movie.id) return;

    setStack((prev) => prev.slice(1));

    try {
      const res = await apiRoutes.cineMatch.swipe({
        tmdbId: movie.id,
        direction,
        friendId: friendId || undefined,
      });
      if (res.isMatch && res.friend && res.movie) {
        setMatch({ movie: res.movie, friend: res.friend });
      }
    } catch (err) {
      console.error('Swipe failed', err);
    }
  };

  const topCards = stack.slice(0, 3);

  const waitingForPartner = partnerStatus === 'pending_sent' && selectedFriend;

  return (
    <div className="cine-match-stack-wrap">
      {waitingForPartner && (
        <div className="cine-match-waiting-overlay">
          <p className="cine-match-waiting-text">Waiting for {selectedFriend.name} to join…</p>
          <p className="cine-match-waiting-hint">They’ll need to accept your invite or open Cine-Match.</p>
        </div>
      )}
      {loading && stack.length === 0 ? (
        <div className="cine-match-stack-skeleton">
          <div className="cine-match-skeleton-poster" />
          <div className="cine-match-skeleton-title" />
        </div>
      ) : stack.length === 0 ? (
        <div className="cine-match-stack-empty">
          <p>No more movies in your stack.</p>
          <button type="button" onClick={() => { setLoading(true); loadStack(true); }} className="cine-match-refresh-btn">
            Refresh stack
          </button>
        </div>
      ) : (
        <div className="cine-match-stack">
          <AnimatePresence initial={false}>
            {topCards.map((movie, index) => (
              <motion.div
                key={movie.id}
                className="cine-match-stack-card-wrap"
                style={{
                  zIndex: topCards.length - index,
                  scale: 1 - index * 0.04,
                  y: index * 8,
                }}
              >
                <CineMatchCard
                  movie={movie}
                  onSwipe={(dir) => handleSwipe(dir, movie)}
                  isTop={index === 0}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <MatchModal
        open={!!match}
        onClose={() => setMatch(null)}
        movie={match?.movie}
        friend={match?.friend}
      />
    </div>
  );
}
