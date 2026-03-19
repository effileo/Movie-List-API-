import { useState } from 'react';
import { posterUrl, POSTER_PLACEHOLDER } from '../../api/client';

const POSTER_WIDTH = 44;
const POSTER_HEIGHT = 66;
const OVERLAP = 14;

/**
 * Horizontal strip of up to 4 overlapping poster thumbnails. +X badge if more.
 * Shows pulsing skeleton while images load to prevent layout shift.
 */
export default function PosterStrip({ movies = [], movieCount = 0, loading = false }) {
  const [loadedCount, setLoadedCount] = useState(0);
  const display = (movies || []).slice(0, 4);
  const extra = Math.max(0, (movieCount || display.length) - display.length);

  const handleLoad = () => {
    setLoadedCount((c) => Math.min(c + 1, display.length));
  };

  if (loading) {
    return (
      <div className="poster-strip poster-strip-skeleton" aria-hidden>
        <div className="poster-strip-inner">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="poster-strip-poster poster-strip-poster-placeholder"
              style={{
                width: POSTER_WIDTH,
                height: POSTER_HEIGHT,
                marginLeft: i === 0 ? 0 : -OVERLAP,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  const allLoaded = display.length === 0 || loadedCount >= display.length;

  return (
    <div className={`poster-strip ${!allLoaded ? 'poster-strip-loading' : ''}`}>
      <div className="poster-strip-inner">
        {display.length === 0 ? (
          <div
            className="poster-strip-poster poster-strip-poster-placeholder"
            style={{ width: POSTER_WIDTH, height: POSTER_HEIGHT }}
          />
        ) : (
          display.map((movie, i) => (
            <div
              key={`${movie?.title ?? i}-${i}`}
              className="poster-strip-poster"
              style={{
                width: POSTER_WIDTH,
                height: POSTER_HEIGHT,
                marginLeft: i === 0 ? 0 : -OVERLAP,
                zIndex: display.length - i,
              }}
            >
              <img
                src={posterUrl(movie?.posterPath) || POSTER_PLACEHOLDER}
                alt={movie?.title ?? ''}
                loading="lazy"
                onLoad={handleLoad}
              />
            </div>
          ))
        )}
        {extra > 0 && (
          <div
            className="poster-strip-more"
            style={{
              width: POSTER_WIDTH,
              height: POSTER_HEIGHT,
              marginLeft: display.length > 0 ? -OVERLAP : 0,
              zIndex: 0,
            }}
          >
            +{extra}
          </div>
        )}
      </div>
    </div>
  );
}
