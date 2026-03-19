import { useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { InfoIcon } from 'lucide-react';
import { posterUrl, POSTER_PLACEHOLDER } from '../../api/client';

const DRAG_THRESHOLD = 80;
const SWIPE_VELOCITY = 300;

export default function CineMatchCard({ movie, onSwipe, isTop }) {
  const [flipped, setFlipped] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const watchOpacity = useTransform(x, [0, DRAG_THRESHOLD, 150], [0, 0.5, 1]);
  const skipOpacity = useTransform(x, [-150, -DRAG_THRESHOLD, 0], [1, 0.5, 0]);

  const handleDragEnd = (_, info) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    if (offset > DRAG_THRESHOLD || velocity > SWIPE_VELOCITY) {
      animate(x, 400, { type: 'spring', stiffness: 300, damping: 25 }).then(() => onSwipe('like'));
      return;
    }
    if (offset < -DRAG_THRESHOLD || velocity < -SWIPE_VELOCITY) {
      animate(x, -400, { type: 'spring', stiffness: 300, damping: 25 }).then(() => onSwipe('dislike'));
      return;
    }
    animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
  };

  const title = movie?.title ?? 'Movie';
  const overview = movie?.overview ?? '';
  const rating = movie?.vote_average != null ? Number(movie.vote_average).toFixed(1) : '—';
  const poster = posterUrl(movie?.poster_path) || POSTER_PLACEHOLDER;

  return (
    <motion.div
      className="cine-match-card"
      style={{
        x,
        rotate,
        zIndex: isTop ? 10 : 0,
        cursor: isTop && !flipped ? 'grab' : 'default',
      }}
      drag={isTop && !flipped ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      onDragEnd={handleDragEnd}
      whileTap={isTop ? { scale: 1.02 } : {}}
      initial={false}
    >
      {/* WATCH / SKIP badges */}
      <motion.div
        className="cine-match-badge cine-match-badge-watch"
        style={{ opacity: watchOpacity }}
        aria-hidden
      >
        WATCH
      </motion.div>
      <motion.div
        className="cine-match-badge cine-match-badge-skip"
        style={{ opacity: skipOpacity }}
        aria-hidden
      >
        SKIP
      </motion.div>

      <motion.div
        className="cine-match-card-inner"
        style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      >
        <div className="cine-match-card-face cine-match-card-front">
          <div className="cine-match-poster-wrap">
            <img src={poster} alt={title} />
          </div>
          <div className="cine-match-card-footer">
            <h3 className="cine-match-title">{title}</h3>
            <button
              type="button"
              className="cine-match-info-btn"
              onClick={(e) => {
                e.stopPropagation();
                setFlipped(true);
              }}
              aria-label="Show details"
            >
              <InfoIcon size={20} />
            </button>
          </div>
        </div>

        <div className="cine-match-card-face cine-match-card-back">
          <div className="cine-match-back-content">
            <p className="cine-match-synopsis">
              {overview ? `${overview.slice(0, 120)}${overview.length > 120 ? '…' : ''}` : 'No synopsis.'}
            </p>
            <p className="cine-match-rating">★ {rating}</p>
            <button
              type="button"
              className="cine-match-flip-back"
              onClick={(e) => {
                e.stopPropagation();
                setFlipped(false);
              }}
            >
              Back
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
