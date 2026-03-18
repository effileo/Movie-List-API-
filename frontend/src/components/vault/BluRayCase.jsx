import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRoutes, posterUrl, POSTER_PLACEHOLDER } from '../../api/client';
import { XIcon, PlayIcon, CheckCircleIcon } from 'lucide-react';

/**
 * Individual 3D Blu-ray case on a shelf.
 * Click to inspect: slides out → rotates 360° → opens to reveal details.
 */
export default function BluRayCase({ item, onStatusUpdate }) {
  const [inspecting, setInspecting] = useState(false);
  const [updating, setUpdating] = useState(false);

  const movie = item.movie;
  const imgSrc = posterUrl(movie.posterPath) || POSTER_PLACEHOLDER;
  const statusLower = (item.status || 'planned').toLowerCase();

  async function handleStartWatching() {
    if (updating) return;
    setUpdating(true);
    try {
      const newStatus = item.status === 'COMPLETED' ? 'COMPLETED' : 'WATCHING';
      await apiRoutes.watchlist.update(item.id, { status: newStatus });
      if (onStatusUpdate) onStatusUpdate(item.id, newStatus);
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setUpdating(false);
    }
  }

  async function handleMarkComplete() {
    if (updating) return;
    setUpdating(true);
    try {
      await apiRoutes.watchlist.update(item.id, { status: 'COMPLETED' });
      if (onStatusUpdate) onStatusUpdate(item.id, 'COMPLETED');
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <>
      {/* Shelf Case */}
      <motion.div
        className="bluray-case"
        layoutId={`case-${item.id}`}
        onClick={() => setInspecting(true)}
        whileHover={{ y: -8 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <div className="bluray-case-inner">
          <div className="bluray-case-front">
            <img
              src={imgSrc}
              alt={movie.title}
              onError={(e) => { e.target.onerror = null; e.target.src = POSTER_PLACEHOLDER; }}
            />
            <div className={`case-status-dot ${statusLower}`} />
            <div className="bluray-case-title">{movie.title}</div>
          </div>
        </div>
      </motion.div>

      {/* Inspected Overlay */}
      <AnimatePresence>
        {inspecting && (
          <motion.div
            className="case-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setInspecting(false)}
          >
            <motion.div
              className="case-inspected"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.7, rotateY: -180, opacity: 0 }}
              animate={{
                scale: 1,
                rotateY: 0,
                opacity: 1,
                transition: {
                  duration: 0.8,
                  ease: [0.34, 1.56, 0.64, 1],
                },
              }}
              exit={{
                scale: 0.7,
                rotateY: 180,
                opacity: 0,
                transition: { duration: 0.4 },
              }}
            >
              <div className="case-inspected-inner">
                <button
                  className="case-close-btn"
                  onClick={() => setInspecting(false)}
                >
                  <XIcon size={24} />
                </button>

                <motion.div
                  className="case-inspected-visual"
                  layoutId={`case-${item.id}`}
                >
                  <img
                    src={imgSrc}
                    alt={movie.title}
                    onError={(e) => { e.target.onerror = null; e.target.src = POSTER_PLACEHOLDER; }}
                  />
                </motion.div>

                <div className="case-details">
                  <h2>{movie.title}</h2>
                  <p className="case-year">{movie.year}</p>

                  {movie.genre?.length > 0 && (
                    <div className="case-genres">
                      {movie.genre.map((g) => (
                        <span key={g} className="case-genre-chip">{g}</span>
                      ))}
                    </div>
                  )}

                  {item.rating != null && (
                    <p className="case-rating">★ {item.rating}/10</p>
                  )}

                  {item.notes && (
                    <p className="case-notes">"{item.notes}"</p>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {item.status !== 'COMPLETED' && (
                      <button
                        className="case-action-btn"
                        onClick={handleStartWatching}
                        disabled={updating}
                      >
                        <PlayIcon size={16} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: 'middle' }} />
                        {item.status === 'WATCHING' ? 'Continue Watching' : 'Start Watching'}
                      </button>
                    )}
                    {item.status !== 'COMPLETED' && (
                      <button
                        className="case-action-btn completed"
                        onClick={handleMarkComplete}
                        disabled={updating}
                      >
                        <CheckCircleIcon size={16} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: 'middle' }} />
                        Mark Complete
                      </button>
                    )}
                    {item.status === 'COMPLETED' && (
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
                        ✅ Completed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
