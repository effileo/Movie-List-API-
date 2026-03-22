import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Flame, Loader2, Clapperboard } from 'lucide-react';
import { apiRoutes, posterUrl, POSTER_PLACEHOLDER } from '../../api/client.js';
import './DirectorsCutTimeline.css';

const rowVariants = {
  hidden: (side) => ({
    opacity: 0,
    x: side === 'left' ? -52 : 52,
    y: 18,
  }),
  show: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] },
  },
};

function yearFromIso(iso) {
  return new Date(iso).getFullYear();
}

function formatWatchDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function GenreMoodBars({ topGenres, maxCount }) {
  if (!topGenres?.length) return <p className="dc-mood-empty muted">No genre data</p>;
  const max = maxCount || Math.max(1, ...topGenres.map((g) => g.count));
  return (
    <div className="dc-mood-bars" aria-label="Top genres">
      {topGenres.map(({ genre, count }) => (
        <div key={genre} className="dc-mood-row">
          <span className="dc-mood-label">{genre}</span>
          <div className="dc-mood-track">
            <motion.div
              className="dc-mood-fill"
              initial={{ width: '0%' }}
              whileInView={{ width: `${Math.max(10, (count / max) * 100)}%` }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <span className="dc-mood-count">{count}</span>
        </div>
      ))}
    </div>
  );
}

function MilestoneCard({ milestone, side }) {
  return (
    <motion.article
      className="dc-node dc-node-milestone"
      variants={rowVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-12% 0px' }}
      custom={side}
    >
      <span className="dc-eyepoint dc-eyepoint-milestone" aria-hidden />
      <div className="dc-milestone-inner">
        <span className="dc-milestone-badge">Milestone</span>
        <h4 className="dc-milestone-title">{milestone.label}</h4>
        <p className="dc-milestone-film">{milestone.movieTitle}</p>
        <time className="dc-milestone-time">{formatWatchDate(milestone.at)}</time>
      </div>
    </motion.article>
  );
}

function MovieNode({ event, side, expanded, onToggle, posterShift }) {
  const p = posterUrl(event.posterPath) || POSTER_PLACEHOLDER;
  const rating = event.effectiveRating;

  const slot = (
    <div className="dc-slot">
      <button type="button" className="dc-movie-card" onClick={() => onToggle(event.watchlistItemId)} aria-expanded={expanded}>
        <motion.div className="dc-poster-wrap" style={{ y: posterShift }}>
          <img src={p} alt="" className="dc-poster" loading="lazy" />
          <div className="dc-poster-shine" aria-hidden />
        </motion.div>
        <div className="dc-movie-meta">
          <h4 className="dc-movie-title">{event.title}</h4>
          {event.year != null && <span className="dc-movie-year">{event.year}</span>}
          {rating != null && <span className="dc-movie-rating-pill">{rating}/10</span>}
        </div>
      </button>
      {expanded && (
        <div className="dc-movie-expanded">
          <p>
            <span className="muted">Watched</span> {formatWatchDate(event.completedAt)}
          </p>
          {event.watchlistRating != null && (
            <p>
              <span className="muted">Your list rating</span> {event.watchlistRating}/10
            </p>
          )}
          {event.review && (
            <p>
              <span className="muted">Review</span> {event.review.rating}/10
              {event.review.hasText ? ' · with notes' : ''}
            </p>
          )}
          <Link to={`/movies/${event.movieId}#reviews`} className="dc-social-pulse">
            Social pulse — open review thread
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <motion.article
      className={`dc-node dc-node-movie dc-node-${side}`}
      variants={rowVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-10% 0px' }}
      custom={side}
    >
      {side === 'left' ? (
        <>
          {slot}
          <span className="dc-eyepoint" aria-hidden />
          <div className="dc-slot-spacer" aria-hidden />
        </>
      ) : (
        <>
          <div className="dc-slot-spacer" aria-hidden />
          <span className="dc-eyepoint" aria-hidden />
          {slot}
        </>
      )}
    </motion.article>
  );
}

function mergeRowsForRange(events, milestones, startMs, endMs) {
  const rows = [];
  for (const e of events) {
    const t = new Date(e.completedAt).getTime();
    if (t >= startMs && t <= endMs) rows.push({ kind: 'movie', at: e.completedAt, data: e });
  }
  for (const m of milestones) {
    const t = new Date(m.at).getTime();
    if (t >= startMs && t <= endMs) rows.push({ kind: 'milestone', at: m.at, data: m });
  }
  rows.sort((a, b) => new Date(a.at) - new Date(b.at));
  return rows;
}

function topGenresFromEvents(evs) {
  const counts = new Map();
  for (const e of evs) {
    for (const g of e.genres || []) {
      const k = g?.trim() || 'Unknown';
      counts.set(k, (counts.get(k) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([genre, count]) => ({ genre, count }));
}

export default function DirectorsCutTimeline({ userId, enabled }) {
  const [zoom, setZoom] = useState('month');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const timelineRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ['start end', 'end start'],
  });
  const trackGlow = useTransform(scrollYProgress, [0, 0.5, 1], [0.4, 1, 0.45]);
  const posterParallax = useTransform(scrollYProgress, [0, 1], [28, -36]);

  useEffect(() => {
    if (!enabled || !userId) {
      setData(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setFetchError('');
      try {
        const res = await apiRoutes.users.directorsTimeline(userId);
        if (!cancelled) setData(res.data ?? null);
      } catch (e) {
        if (!cancelled) {
          setFetchError(e.message || 'Could not load timeline');
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, userId]);

  const sections = useMemo(() => {
    if (!data?.events?.length) return [];
    const { events, milestones = [], monthlyMood = [] } = data;

    let run = 0;
    function assignSides(rawRows) {
      const mapped = rawRows.map((row, i) => ({
        ...row,
        side: (run + i) % 2 === 0 ? 'left' : 'right',
      }));
      run += rawRows.length;
      return mapped;
    }

    if (zoom === 'month') {
      return monthlyMood.map((block) => {
        const start = new Date(block.year, block.month - 1, 1).getTime();
        const end = new Date(block.year, block.month, 0, 23, 59, 59, 999).getTime();
        const rows = assignSides(mergeRowsForRange(events, milestones, start, end));
        const maxG = block.topGenres?.length
          ? Math.max(...block.topGenres.map((g) => g.count))
          : 1;
        return {
          key: block.key,
          heading: block.label,
          rows,
          topGenres: block.topGenres,
          maxCount: maxG,
          summary: `${block.count} film${block.count === 1 ? '' : 's'}`,
          moodLabel: 'Monthly mood',
        };
      });
    }

    const yearsMap = new Map();
    for (const e of events) {
      const y = yearFromIso(e.completedAt);
      if (!yearsMap.has(y)) yearsMap.set(y, []);
      yearsMap.get(y).push(e);
    }
    for (const m of milestones) {
      const y = yearFromIso(m.at);
      if (!yearsMap.has(y)) yearsMap.set(y, []);
    }
    const years = [...yearsMap.keys()].sort((a, b) => a - b);
    return years.map((year) => {
      const start = new Date(year, 0, 1).getTime();
      const end = new Date(year, 11, 31, 23, 59, 59, 999).getTime();
      const rows = assignSides(mergeRowsForRange(events, milestones, start, end));
      const inYear = events.filter((e) => yearFromIso(e.completedAt) === year);
      const topGenres = topGenresFromEvents(inYear);
      const maxCount = topGenres.length ? Math.max(...topGenres.map((g) => g.count)) : 1;
      return {
        key: String(year),
        heading: String(year),
        rows,
        topGenres,
        maxCount,
        summary: `${inYear.length} completed in ${year}`,
        moodLabel: 'Year in genres',
      };
    });
  }, [data, zoom]);

  if (!enabled || !userId) return null;

  return (
    <section className="profile-section dc-timeline-root" aria-labelledby="dc-timeline-heading">
      <div className="dc-header">
        <h2 id="dc-timeline-heading" className="profile-section-title">
          <Clapperboard className="profile-section-title-icon" aria-hidden />
          Director&apos;s Cut
        </h2>
        <p className="profile-section-lead dc-tagline">Your watching history, cut on a single reel.</p>
      </div>

      {loading && (
        <div className="dc-loading">
          <Loader2 className="dc-spin" aria-hidden />
          <span>Threading the reel…</span>
        </div>
      )}

      {fetchError && !loading && <p className="movies-message">{fetchError}</p>}

      {!loading && !fetchError && data && data.totalCompleted === 0 && (
        <p className="muted dc-empty">
          No completed films yet. Mark titles as watched on your watchlist to see them here.
        </p>
      )}

      {!loading && !fetchError && data && data.totalCompleted > 0 && (
        <>
          <div className="dc-toolbar">
            <div className="dc-streak" title="Consecutive days with at least one completed film (by date)">
              <Flame className="dc-streak-icon" aria-hidden />
              <div>
                <span className="dc-streak-value">{data.streak?.currentDays ?? 0}</span>
                <span className="dc-streak-label"> day streak</span>
                {data.streak?.currentWeeksApprox > 0 && (
                  <span className="dc-streak-weeks"> · ~{data.streak.currentWeeksApprox} wk</span>
                )}
              </div>
              <span className="dc-streak-long muted">Best: {data.streak?.longestDays ?? 0} days</span>
            </div>
            <div className="dc-zoom" role="group" aria-label="Timeline zoom">
              <button
                type="button"
                className={`dc-zoom-btn ${zoom === 'month' ? 'active' : ''}`}
                onClick={() => setZoom('month')}
              >
                Monthly
              </button>
              <button
                type="button"
                className={`dc-zoom-btn ${zoom === 'year' ? 'active' : ''}`}
                onClick={() => setZoom('year')}
              >
                Yearly
              </button>
            </div>
          </div>

          <div className="dc-timeline" ref={timelineRef}>
            <motion.div className="dc-film-strip" style={{ opacity: trackGlow }} aria-hidden>
              <div className="dc-film-strip-line" />
              <div className="dc-film-strip-glow" />
            </motion.div>

            <div className="dc-rail">
              {sections.map((sec) => (
                <div key={sec.key} className="dc-segment">
                  <header className="dc-segment-head">
                    <h3 className="dc-segment-title">{sec.heading}</h3>
                    <span className="dc-segment-summary muted">{sec.summary}</span>
                  </header>

                  <div className="dc-segment-body">
                    {sec.rows.map((row) => {
                      if (row.kind === 'milestone') {
                        return (
                          <MilestoneCard
                            key={`m-${row.data.type}-${row.at}`}
                            milestone={row.data}
                            side={row.side}
                          />
                        );
                      }
                      return (
                        <MovieNode
                          key={row.data.watchlistItemId}
                          event={row.data}
                          side={row.side}
                          expanded={expandedId === row.data.watchlistItemId}
                          onToggle={(id) => setExpandedId((cur) => (cur === id ? null : id))}
                          posterShift={posterParallax}
                        />
                      );
                    })}
                  </div>

                  <div className="dc-mood-glass">
                    <span className="dc-mood-title">{sec.moodLabel}</span>
                    <GenreMoodBars topGenres={sec.topGenres} maxCount={sec.maxCount} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
