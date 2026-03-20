import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Check, Trash2, Play, Plus, X, Loader2 } from 'lucide-react';
import { apiRoutes, posterUrl, POSTER_PLACEHOLDER } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/ui/ToastProvider.jsx';
import { clsx } from 'clsx';

const SORT_OPTIONS = [
  { id: 'added', label: 'Date added' },
  { id: 'rating', label: 'TMDB rating' },
  { id: 'release', label: 'Release date' },
  { id: 'runtime', label: 'Runtime' },
];

function stableAccentKey(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h + str.charCodeAt(i) * (i + 1)) % 1000;
  return h % 2 === 0;
}

function pickYoutubeTrailerKey(results) {
  if (!Array.isArray(results)) return null;
  const yt = results.filter((v) => v.site === 'YouTube' && v.key);
  const official = (type) => yt.find((v) => v.type === type && v.official);
  return (
    official('Trailer')?.key ||
    official('Teaser')?.key ||
    yt.find((v) => v.type === 'Trailer')?.key ||
    yt.find((v) => v.type === 'Teaser')?.key ||
    yt[0]?.key ||
    null
  );
}

function sortWatchlistItems(items, sortBy) {
  const list = [...items];
  list.sort((a, b) => {
    switch (sortBy) {
      case 'added':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'rating': {
        const ar = a.movie?.voteAverage;
        const br = b.movie?.voteAverage;
        if (ar == null && br == null) return 0;
        if (ar == null) return 1;
        if (br == null) return -1;
        return br - ar;
      }
      case 'release':
        return (b.movie?.year ?? 0) - (a.movie?.year ?? 0);
      case 'runtime': {
        const ar = a.movie?.runTime;
        const br = b.movie?.runTime;
        if (ar == null && br == null) return 0;
        if (ar == null) return 1;
        if (br == null) return -1;
        return br - ar;
      }
      default:
        return 0;
    }
  });
  return list;
}

function TrailerModal({ open, title, youtubeKey, loading, error, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Watch trailer"
            className="relative w-full max-w-4xl rounded-2xl border border-white/10 bg-cinematic-surface shadow-[0_0_60px_-20px_rgba(225,29,72,0.35)] overflow-hidden"
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10">
              <h2 className="text-sm font-semibold text-white truncate pr-2">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 p-2 rounded-full text-cinematic-muted hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video bg-black flex items-center justify-center">
              {loading && <Loader2 className="w-10 h-10 text-cinematic-accent animate-spin" />}
              {error && <p className="text-cinematic-muted text-sm px-6 text-center">{error}</p>}
              {!loading && !error && youtubeKey && (
                <iframe
                  title="Trailer"
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${youtubeKey}?autoplay=1&rel=0`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function WatchProgressBar({ status }) {
  if (status === 'PLANNED' || status === 'DROPPED') return null;
  const widthPct = status === 'COMPLETED' ? 100 : 42;
  return (
    <div className="absolute bottom-0 left-0 right-0 h-1 z-[25] bg-black/60 overflow-hidden">
      <motion.div
        className={clsx(
          'h-full rounded-none',
          status === 'COMPLETED' ? 'bg-slate-400 shadow-[0_0_10px_rgba(148,163,184,0.7)]' : 'bg-cinematic-accent shadow-[0_0_12px_rgba(225,29,72,0.65)]'
        )}
        initial={false}
        animate={{ width: `${widthPct}%` }}
        transition={{ type: 'spring', stiffness: 200, damping: 28 }}
      />
      {status === 'WATCHING' && (
        <motion.div
          className="pointer-events-none absolute inset-y-0 left-0 w-2/5 bg-gradient-to-r from-transparent via-white/35 to-transparent"
          animate={{ x: ['-100%', '280%'] }}
          transition={{ repeat: Infinity, duration: 2.4, ease: 'linear' }}
        />
      )}
    </div>
  );
}

function WatchlistMovieCard({
  item,
  updating,
  glowRed,
  onRemove,
  onMarkWatched,
  onOpenTrailer,
  vaultFlashId,
}) {
  const { movie } = item;
  const poster = posterUrl(movie.posterPath) || POSTER_PLACEHOLDER;
  const title = movie.title || 'Untitled';
  const year = movie.year != null ? String(movie.year) : '—';
  const busy = updating === item.id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.88, transition: { duration: 0.28 } }}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      className="relative group"
    >
      <div
        className={clsx(
          'relative aspect-[2/3] w-full overflow-hidden rounded-2xl border transition-all duration-300',
          glowRed
            ? 'border-white/[0.08] hover:border-cinematic-accent/80 hover:shadow-[0_0_28px_-8px_rgba(225,29,72,0.55)]'
            : 'border-white/[0.08] hover:border-slate-400/70 hover:shadow-[0_0_28px_-8px_rgba(148,163,184,0.35)]',
          'hover:scale-105 hover:z-10'
        )}
      >
        <Link to={`/movies/${movie.id}`} className="absolute inset-0 z-0 block" tabIndex={-1}>
          <img
            src={poster}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = POSTER_PLACEHOLDER;
            }}
          />
        </Link>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black via-black/75 to-transparent pt-12 pb-3 px-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.06] backdrop-blur-md px-2.5 py-2 shadow-lg pointer-events-auto">
            <Link to={`/movies/${movie.id}`} className="block min-w-0">
              <h3 className="text-sm font-semibold text-white leading-tight line-clamp-1 tracking-tight">{title}</h3>
            </Link>
            <p className="text-xs text-white/60 mt-0.5 tabular-nums">{year}</p>
          </div>
        </div>

        <WatchProgressBar status={item.status} />

        <AnimatePresence>
          {vaultFlashId === item.id && (
            <motion.div
              className="absolute inset-0 z-[35] flex items-center justify-center bg-cinematic-accent/25 backdrop-blur-[2px] pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ scale: 0.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              >
                <div className="rounded-full bg-black/50 p-4 border border-white/20">
                  <Check className="w-10 h-10 text-white" strokeWidth={2.5} />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute top-2 right-2 z-30 flex flex-col gap-2 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            disabled={busy || item.status === 'COMPLETED'}
            title="Mark as watched (Cine-Vault)"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMarkWatched(item);
            }}
            className={clsx(
              'flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-md transition-colors',
              item.status === 'COMPLETED'
                ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-200 cursor-default opacity-80'
                : 'border-white/20 bg-black/50 text-white hover:bg-cinematic-accent/90 hover:border-cinematic-accent'
            )}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" strokeWidth={2.5} />}
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            disabled={busy}
            title="Remove from watchlist"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove(item.id);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-md hover:bg-red-500/80 hover:border-red-400 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            disabled={busy || !movie.tmdbId}
            title="Watch trailer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOpenTrailer(item, title);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-md hover:bg-white/15 transition-colors disabled:opacity-40"
          >
            <Play className="h-4 w-4 fill-current" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default function Watchlist() {
  const { user: me } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [sortBy, setSortBy] = useState('added');
  const [genreFilter, setGenreFilter] = useState(null);
  const [vaultFlashId, setVaultFlashId] = useState(null);
  const [trailer, setTrailer] = useState({
    open: false,
    title: '',
    key: null,
    loading: false,
    error: '',
  });

  const publicWatchlistUrl = me?.id ? `${window.location.origin}/users/${me.id}/watchlist` : null;

  function copyShareLink() {
    if (!publicWatchlistUrl) return;
    navigator.clipboard.writeText(publicWatchlistUrl).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }

  const loadWatchlist = useCallback(async () => {
    try {
      setError('');
      const res = await apiRoutes.watchlist.list();
      setItems(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadWatchlist();
  }, [loadWatchlist]);

  useEffect(() => {
    const onUpdated = () => loadWatchlist();
    window.addEventListener('watchlist:updated', onUpdated);
    return () => window.removeEventListener('watchlist:updated', onUpdated);
  }, [loadWatchlist]);

  const genreOptions = useMemo(() => {
    const s = new Set();
    items.forEach((i) => (i.movie?.genre || []).forEach((g) => s.add(g)));
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filteredSorted = useMemo(() => {
    let list = [...items];
    if (genreFilter) {
      list = list.filter((i) => (i.movie?.genre || []).includes(genreFilter));
    }
    return sortWatchlistItems(list, sortBy);
  }, [items, sortBy, genreFilter]);

  async function handleRemove(id) {
    setUpdating(id);
    try {
      await apiRoutes.watchlist.remove(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      showToast('Removed from watchlist');
    } catch (err) {
      showToast(err.message || 'Could not remove', 'error');
    } finally {
      setUpdating(null);
    }
  }

  async function handleMarkWatched(item) {
    if (item.status === 'COMPLETED') return;
    setUpdating(item.id);
    try {
      const { data } = await apiRoutes.watchlist.update(item.id, { status: 'COMPLETED' });
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, ...data } : i)));
      setVaultFlashId(item.id);
      setTimeout(() => setVaultFlashId(null), 750);
      showToast('Marked watched — saved to your Cine-Vault');
    } catch (err) {
      showToast(err.message || 'Could not update', 'error');
    } finally {
      setUpdating(null);
    }
  }

  const closeTrailer = useCallback(() => {
    setTrailer({ open: false, title: '', key: null, loading: false, error: '' });
  }, []);

  async function handleStartWatchingIfNeeded(item) {
    if (item.status !== 'PLANNED' && item.status !== 'DROPPED') return;
    try {
      const { data } = await apiRoutes.watchlist.update(item.id, { status: 'WATCHING' });
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, ...data } : i)));
    } catch {
      /* trailer still opens */
    }
  }

  async function handleOpenTrailer(item, title) {
    const tmdbId = item.movie?.tmdbId;
    if (!tmdbId) {
      showToast('No TMDB id for this film', 'error');
      return;
    }
    await handleStartWatchingIfNeeded(item);
    setTrailer({ open: true, title, key: null, loading: true, error: '' });
    try {
      const data = await apiRoutes.movies.videos(tmdbId);
      const key = pickYoutubeTrailerKey(data?.results);
      if (!key) {
        setTrailer((t) => ({ ...t, loading: false, error: 'No trailer found on TMDB.' }));
        return;
      }
      setTrailer((t) => ({ ...t, loading: false, key }));
    } catch (err) {
      setTrailer((t) => ({
        ...t,
        loading: false,
        error: err.message || 'Failed to load trailer.',
      }));
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] bg-[#050505] px-4 md:px-10 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="h-9 w-48 rounded-lg bg-white/5 animate-pulse mb-8" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-2xl bg-white/[0.04] border border-white/5 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[50vh] bg-[#050505] flex items-center justify-center px-6">
        <p className="text-cinematic-muted text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-cinematic-accent/30">
      <TrailerModal
        open={trailer.open}
        title={trailer.title}
        youtubeKey={trailer.key}
        loading={trailer.loading}
        error={trailer.error}
        onClose={closeTrailer}
      />

      <div className="mx-auto max-w-7xl px-4 md:px-10 py-10 pb-24">
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white drop-shadow-sm">My watchlist</h1>
          <p className="mt-2 text-sm text-cinematic-muted max-w-xl">
            Curate, sort, and filter your queue - a premium view of everything you plan to watch.
          </p>
        </header>

        {me && (
          <section className="mb-10 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-[0_0_40px_-20px_rgba(0,0,0,0.8)]">
            <h2 className="text-lg font-semibold text-white tracking-tight">Share your watchlist</h2>
            <p className="mt-2 text-sm text-cinematic-muted leading-relaxed max-w-2xl">
              Post your watchlist so others can view it, like it, and leave comments. When your watchlist is public, anyone with the link can interact with it.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                to={`/users/${me.id}/watchlist`}
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-colors"
              >
                View public page
              </Link>
              {publicWatchlistUrl && (
                <button
                  type="button"
                  onClick={copyShareLink}
                  className="inline-flex items-center justify-center rounded-full border border-cinematic-accent/40 text-cinematic-accent px-5 py-2.5 text-sm font-medium hover:bg-cinematic-accent/10 transition-colors"
                >
                  {linkCopied ? 'Copied!' : 'Copy link'}
                </button>
              )}
            </div>
            <p className="mt-3 text-xs text-cinematic-muted/80">
              Turn &quot;Watchlist public&quot; on in your profile so others can see it.
            </p>
          </section>
        )}

        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 px-6 text-center rounded-2xl border border-dashed border-cinematic-accent/35 bg-white/[0.02]"
          >
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-cinematic-accent text-cinematic-accent">
              <Plus className="h-8 w-8" strokeWidth={2} />
            </div>
            <p className="text-cinematic-muted text-base max-w-md leading-relaxed">
              Your cinematic journey starts here. Add a movie to begin.
            </p>
            <Link
              to="/search"
              className="mt-8 inline-flex rounded-full bg-cinematic-accent px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Browse movies
            </Link>
          </motion.div>
        ) : (
          <>
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSortBy(opt.id)}
                    className={clsx(
                      'rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all border',
                      sortBy === opt.id
                        ? 'border-cinematic-accent bg-cinematic-accent/15 text-white shadow-[0_0_20px_-8px_rgba(225,29,72,0.5)]'
                        : 'border-white/10 bg-white/[0.04] text-cinematic-muted hover:border-white/20 hover:text-white'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {genreOptions.length > 0 && (
              <div className="mb-8 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-cinematic-muted mr-1">Genres</span>
                <button
                  type="button"
                  onClick={() => setGenreFilter(null)}
                  className={clsx(
                    'rounded-full px-3 py-1.5 text-xs font-medium border transition-colors',
                    genreFilter === null
                      ? 'border-white/25 bg-white/10 text-white'
                      : 'border-white/10 bg-transparent text-cinematic-muted hover:text-white'
                  )}
                >
                  All
                </button>
                {genreOptions.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGenreFilter((prev) => (prev === g ? null : g))}
                    className={clsx(
                      'rounded-full px-3 py-1.5 text-xs font-medium border transition-colors',
                      genreFilter === g
                        ? 'border-cinematic-accent/60 bg-cinematic-accent/10 text-white'
                        : 'border-white/10 bg-white/[0.03] text-cinematic-muted hover:border-white/20 hover:text-white'
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            )}

            <LayoutGroup>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                <AnimatePresence mode="popLayout">
                  {filteredSorted.map((item) => (
                    <WatchlistMovieCard
                      key={item.id}
                      item={item}
                      updating={updating}
                      glowRed={stableAccentKey(item.id)}
                      onRemove={handleRemove}
                      onMarkWatched={handleMarkWatched}
                      onOpenTrailer={handleOpenTrailer}
                      vaultFlashId={vaultFlashId}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </LayoutGroup>

            {filteredSorted.length === 0 && (
              <p className="mt-12 text-center text-cinematic-muted text-sm">
                No titles match this genre.{' '}
                <button type="button" onClick={() => setGenreFilter(null)} className="text-cinematic-accent hover:underline">
                  Clear filter
                </button>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
