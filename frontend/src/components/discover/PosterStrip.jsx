import { useState } from 'react';
import { posterUrl, POSTER_PLACEHOLDER } from '../../api/client';

/** 2:3 posters — larger so artwork reads on Discover cards */
const MULTI = { w: 100, h: 150, overlap: 38 };
const SINGLE = { w: 140, h: 210, overlap: 0 };

/**
 * Overlapping poster fan (multi) or one hero poster (single).
 */
export default function PosterStrip({ movies = [], movieCount = 0, loading = false }) {
  const [loadedCount, setLoadedCount] = useState(0);
  const display = (movies || []).slice(0, 4);
  const extra = Math.max(0, (movieCount || display.length) - display.length);
  const isSingle = !loading && display.length === 1;
  const { w: POSTER_WIDTH, h: POSTER_HEIGHT, overlap: OVERLAP } = isSingle ? SINGLE : MULTI;

  const handleLoad = () => {
    setLoadedCount((c) => Math.min(c + 1, display.length));
  };

  const posterSrc = (path) => {
    const u = posterUrl(path);
    if (u) return u;
    return POSTER_PLACEHOLDER;
  };

  if (loading) {
    return (
      <div className="poster-strip poster-strip-skeleton" aria-hidden>
        <div
          className="poster-strip-inner poster-strip-inner--multi"
          style={{ minHeight: MULTI.h + 16 }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="poster-strip-poster poster-strip-poster-placeholder"
              style={{
                width: MULTI.w,
                height: MULTI.h,
                marginLeft: i === 0 ? 0 : -MULTI.overlap,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  const allLoaded = display.length === 0 || loadedCount >= display.length;

  return (
    <div className={`poster-strip ${!allLoaded ? 'poster-strip-loading' : ''} ${isSingle ? 'poster-strip--single' : 'poster-strip--multi'}`}>
      <div
        className={`poster-strip-inner ${isSingle ? 'poster-strip-inner--single' : 'poster-strip-inner--multi'}`}
        style={{ minHeight: POSTER_HEIGHT + (isSingle ? 24 : 20) }}
      >
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
                src={posterSrc(movie?.posterPath)}
                alt={movie?.title ?? ''}
                loading="lazy"
                decoding="async"
                onLoad={handleLoad}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = POSTER_PLACEHOLDER;
                  handleLoad();
                }}
              />
            </div>
          ))
        )}
        {extra > 0 && (
          <div
            className="poster-strip-more"
            style={{
              width: Math.min(POSTER_WIDTH, 88),
              height: Math.min(POSTER_HEIGHT, 132),
              marginLeft: display.length > 0 ? -Math.min(OVERLAP, 28) : 0,
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
