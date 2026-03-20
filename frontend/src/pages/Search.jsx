import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, Search as SearchIcon, Loader2 } from 'lucide-react';
import { apiRoutes, TMDB_IMG } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { clsx } from 'clsx';

const TMDB_GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' },
];

const YEAR_MIN = 1950;
const YEAR_MAX = new Date().getFullYear() + 1;
const RUNTIME_SLIDER_MAX = 220;
const DEBOUNCE_MS = 420;

function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function buildBrowseParams({
  page,
  titleQuery,
  minRating,
  maxRuntime,
  yearMin,
  yearMax,
  genreIds,
  person,
  personRole,
  streaming,
}) {
  const params = { page: String(page) };
  const q = titleQuery.trim();
  if (q) params.q = q;
  if (minRating > 0) params.vote_average_gte = String(minRating);
  if (maxRuntime < RUNTIME_SLIDER_MAX) params.with_runtime_lte = String(maxRuntime);
  if (yearMin > YEAR_MIN) params.year_gte = String(yearMin);
  if (yearMax < YEAR_MAX) params.year_lte = String(yearMax);
  if (genreIds.length) params.with_genres = [...genreIds].sort((a, b) => a - b).join(',');
  if (person?.id) {
    if (personRole === 'crew') params.with_crew = String(person.id);
    else params.with_cast = String(person.id);
  }
  if (streaming) params.streaming = '1';
  return params;
}

function FilterSlider({ label, value, min, max, step, display, onChange, accent = 'red' }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span className="text-white font-medium tabular-nums">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={clsx(
          'w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-700/80',
          accent === 'red' && '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#e11d48] [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(225,29,72,0.6)] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/20',
          accent === 'red' &&
            '[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#e11d48] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white/20'
        )}
      />
    </div>
  );
}

export default function Search() {
  const { user } = useAuth();
  const [titleQuery, setTitleQuery] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [maxRuntime, setMaxRuntime] = useState(RUNTIME_SLIDER_MAX);
  const [yearMin, setYearMin] = useState(YEAR_MIN);
  const [yearMax, setYearMax] = useState(YEAR_MAX);
  const [genreIds, setGenreIds] = useState([]);
  const [person, setPerson] = useState(null);
  const [personRole, setPersonRole] = useState('cast');
  const [streaming, setStreaming] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [page, setPage] = useState(1);

  const [results, setResults] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [personQuery, setPersonQuery] = useState('');
  const [personResults, setPersonResults] = useState([]);
  const personWrapRef = useRef(null);

  const [adding, setAdding] = useState(null);
  const [toast, setToast] = useState('');

  const draft = useMemo(
    () => ({
      titleQuery,
      minRating,
      maxRuntime,
      yearMin,
      yearMax,
      genreIds,
      person,
      personRole,
      streaming,
    }),
    [titleQuery, minRating, maxRuntime, yearMin, yearMax, genreIds, person, personRole, streaming]
  );

  const debouncedDraft = useDebouncedValue(draft, DEBOUNCE_MS);
  const debouncedStr = useMemo(() => JSON.stringify(debouncedDraft), [debouncedDraft]);
  const prevDebouncedStr = useRef(debouncedStr);

  useEffect(() => {
    let cancelled = false;
    const filtersJustChanged = prevDebouncedStr.current !== debouncedStr;
    if (filtersJustChanged) prevDebouncedStr.current = debouncedStr;

    const requestPage = filtersJustChanged ? 1 : page;
    if (filtersJustChanged && page !== 1) setPage(1);

    (async () => {
      setLoading(true);
      setError('');
      try {
        const params = buildBrowseParams({
          page: requestPage,
          ...debouncedDraft,
        });
        const data = await apiRoutes.movies.browse(params);
        if (cancelled) return;
        setResults(data.results || []);
        setTotalPages(Math.max(1, data.total_pages || 1));
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load movies');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedStr, debouncedDraft, page]);

  const debouncedPersonQ = useDebouncedValue(personQuery, 320);
  useEffect(() => {
    let cancelled = false;
    const q = debouncedPersonQ.trim();
    if (q.length < 2) {
      setPersonResults([]);
      return;
    }
    (async () => {
      try {
        const data = await apiRoutes.movies.searchPerson(q, 1);
        if (!cancelled) setPersonResults(data.results?.slice(0, 10) || []);
      } catch {
        if (!cancelled) setPersonResults([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedPersonQ]);

  useEffect(() => {
    function onDoc(e) {
      if (personWrapRef.current && !personWrapRef.current.contains(e.target)) {
        setPersonResults([]);
      }
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const toggleGenre = (id) => {
    setGenreIds((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  };

  const clearAllFilters = useCallback(() => {
    setTitleQuery('');
    setMinRating(0);
    setMaxRuntime(RUNTIME_SLIDER_MAX);
    setYearMin(YEAR_MIN);
    setYearMax(YEAR_MAX);
    setGenreIds([]);
    setPerson(null);
    setPersonRole('cast');
    setStreaming(false);
    setPersonQuery('');
    setPage(1);
  }, []);

  const removePill = (key, extra) => {
    if (key === 'title') setTitleQuery('');
    if (key === 'rating') setMinRating(0);
    if (key === 'runtime') setMaxRuntime(RUNTIME_SLIDER_MAX);
    if (key === 'yearMin') setYearMin(YEAR_MIN);
    if (key === 'yearMax') setYearMax(YEAR_MAX);
    if (key === 'genre') setGenreIds((g) => g.filter((x) => x !== extra));
    if (key === 'person') {
      setPerson(null);
      setPersonQuery('');
    }
    if (key === 'streaming') setStreaming(false);
    setPage(1);
  };

  const pills = useMemo(() => {
    const list = [];
    if (titleQuery.trim()) list.push({ key: 'title', label: `Title: “${titleQuery.trim().slice(0, 24)}${titleQuery.length > 24 ? '…' : ''}”` });
    if (minRating > 0) list.push({ key: 'rating', label: `Rating ≥ ${minRating.toFixed(1)}` });
    if (maxRuntime < RUNTIME_SLIDER_MAX) list.push({ key: 'runtime', label: `Runtime ≤ ${maxRuntime} min` });
    if (yearMin > YEAR_MIN) list.push({ key: 'yearMin', label: `From ${yearMin}` });
    if (yearMax < YEAR_MAX) list.push({ key: 'yearMax', label: `To ${yearMax}` });
    genreIds.forEach((id) => {
      const g = TMDB_GENRES.find((x) => x.id === id);
      if (g) list.push({ key: 'genre', label: g.name, extra: id });
    });
    if (person) list.push({ key: 'person', label: `${personRole === 'crew' ? 'Crew' : 'Cast'}: ${person.name}` });
    if (streaming) list.push({ key: 'streaming', label: 'Streaming now' });
    return list;
  }, [titleQuery, minRating, maxRuntime, yearMin, yearMax, genreIds, person, personRole, streaming]);

  const hasStrictFilters =
    minRating > 0 ||
    maxRuntime < RUNTIME_SLIDER_MAX ||
    yearMin > YEAR_MIN ||
    yearMax < YEAR_MAX ||
    genreIds.length > 0 ||
    person != null ||
    streaming;

  async function handleAddToWatchlist(tmdbId) {
    if (!user) return;
    setAdding(tmdbId);
    setToast('');
    try {
      await apiRoutes.watchlist.add({ tmdbId, status: 'PLANNED' });
      setToast('Added to watchlist!');
    } catch (err) {
      setToast(err.message || 'Failed to add');
    } finally {
      setAdding(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Search &amp; discover</h1>
        <p className="text-slate-400 text-sm mb-8 max-w-xl">
          Power filters map to TMDB Discover — refine by rating, runtime, year, genres, cast/crew, and streaming.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1 flex items-center rounded-xl border border-white/10 bg-white/[0.04] focus-within:border-[#e11d48]/40 transition-colors">
            <SearchIcon className="absolute left-4 w-5 h-5 text-slate-500" />
            <input
              type="search"
              placeholder="Search by title…"
              value={titleQuery}
              onChange={(e) => setTitleQuery(e.target.value)}
              className="w-full bg-transparent pl-12 pr-4 py-3.5 text-sm placeholder:text-slate-500 outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-[#16161a] px-5 py-3.5 text-sm font-semibold text-white hover:border-[#e11d48]/50 hover:bg-[#1c1c22] transition-all shrink-0"
          >
            <SlidersHorizontal className="w-5 h-5 text-[#e11d48]" />
            Filters
          </button>
        </div>

        {toast && <p className="text-sm text-emerald-400 mb-3">{toast}</p>}
        {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

        {pills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {pills.map((p) => (
              <button
                key={`${p.key}-${p.extra ?? p.label}`}
                type="button"
                onClick={() => removePill(p.key, p.extra)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#e11d48]/35 bg-[#e11d48]/10 px-3 py-1 text-xs font-medium text-red-100 hover:bg-[#e11d48]/20 transition-colors"
              >
                {p.label}
                <X className="w-3.5 h-3.5 opacity-80" />
              </button>
            ))}
          </div>
        )}

        {loading && results.length === 0 ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-10 h-10 text-[#e11d48] animate-spin" />
          </div>
        ) : !loading && results.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#121214]/90 backdrop-blur-md px-8 py-16 text-center max-w-lg mx-auto">
            <p className="text-lg text-slate-300 mb-2 font-medium">That movie doesn&apos;t exist yet…</p>
            <p className="text-sm text-slate-500 mb-8">maybe you should write the script!</p>
            {hasStrictFilters || titleQuery.trim() ? (
              <button
                type="button"
                onClick={clearAllFilters}
                className="rounded-full bg-[#e11d48] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90"
              >
                Clear all filters
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <div className="relative grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {loading && (
                <div className="absolute inset-0 z-10 flex items-start justify-center pt-12 bg-[#050505]/50 backdrop-blur-[1px] rounded-2xl">
                  <Loader2 className="w-8 h-8 text-[#e11d48] animate-spin" />
                </div>
              )}
              {results.map((m) => (
                <div
                  key={m.id}
                  className="group relative aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 bg-[#16161a] shadow-lg hover:border-[#e11d48]/40 transition-all hover:scale-[1.02]"
                >
                  <Link to={`/movie/tmdb/${m.id}`} className="absolute inset-0 z-0">
                    <img
                      src={m.poster_path ? `${TMDB_IMG}${m.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster'}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </Link>
                  <div className="absolute bottom-0 inset-x-0 z-10 bg-gradient-to-t from-black via-black/80 to-transparent p-3 pt-10">
                    <Link to={`/movie/tmdb/${m.id}`} className="block">
                      <h3 className="text-sm font-semibold line-clamp-2 leading-tight">{m.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{m.release_date?.slice(0, 4) || '—'}</p>
                    </Link>
                    {user && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleAddToWatchlist(m.id);
                        }}
                        disabled={adding === m.id}
                        className="mt-2 w-full rounded-lg bg-white/10 py-1.5 text-xs font-medium hover:bg-[#e11d48] transition-colors"
                      >
                        {adding === m.id ? 'Adding…' : 'Watchlist'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-10">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-full border border-white/15 px-4 py-2 text-sm disabled:opacity-40 hover:border-[#e11d48]/50"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-400 tabular-nums">
                  Page {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-full border border-white/15 px-4 py-2 text-sm disabled:opacity-40 hover:border-[#e11d48]/50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {panelOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close filters"
              className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPanelOpen(false)}
            />
            <motion.aside
              role="dialog"
              aria-label="Power filters"
              className="fixed right-0 top-0 bottom-0 z-[70] w-full max-w-md border-l border-white/10 bg-[#121214]/95 backdrop-blur-xl shadow-[-20px_0_60px_rgba(0,0,0,0.5)] flex flex-col"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <h2 className="text-lg font-bold tracking-tight">Power filters</h2>
                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8">
                <FilterSlider
                  label="Minimum rating"
                  value={minRating}
                  min={0}
                  max={10}
                  step={0.5}
                  display={minRating.toFixed(1)}
                  onChange={setMinRating}
                />

                <FilterSlider
                  label="Maximum runtime"
                  value={maxRuntime}
                  min={30}
                  max={RUNTIME_SLIDER_MAX}
                  step={5}
                  display={maxRuntime >= RUNTIME_SLIDER_MAX ? 'No limit' : `${maxRuntime} min`}
                  onChange={setMaxRuntime}
                />

                <div className="space-y-3">
                  <p className="text-xs text-slate-400">Release year range</p>
                  <FilterSlider
                    label="From"
                    value={yearMin}
                    min={YEAR_MIN}
                    max={yearMax}
                    step={1}
                    display={String(yearMin)}
                    onChange={(v) => {
                      setYearMin(v);
                      if (v > yearMax) setYearMax(v);
                    }}
                    accent="red"
                  />
                  <FilterSlider
                    label="To"
                    value={yearMax}
                    min={yearMin}
                    max={YEAR_MAX}
                    step={1}
                    display={String(yearMax)}
                    onChange={(v) => {
                      setYearMax(v);
                      if (v < yearMin) setYearMin(v);
                    }}
                    accent="red"
                  />
                </div>

                <div>
                  <p className="text-xs text-slate-400 mb-3">Genres (match all selected)</p>
                  <div className="flex flex-wrap gap-2">
                    {TMDB_GENRES.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => toggleGenre(g.id)}
                        className={clsx(
                          'rounded-full px-3 py-1.5 text-xs font-medium border transition-colors',
                          genreIds.includes(g.id)
                            ? 'border-[#e11d48] bg-[#e11d48]/20 text-white'
                            : 'border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/20'
                        )}
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3" ref={personWrapRef}>
                  <p className="text-xs text-slate-400">Starring / crew (TMDB person)</p>
                  <div className="flex rounded-lg border border-white/10 overflow-hidden text-xs">
                    <button
                      type="button"
                      onClick={() => setPersonRole('cast')}
                      className={clsx(
                        'flex-1 py-2 font-medium',
                        personRole === 'cast' ? 'bg-[#e11d48]/25 text-white' : 'bg-transparent text-slate-500'
                      )}
                    >
                      Cast
                    </button>
                    <button
                      type="button"
                      onClick={() => setPersonRole('crew')}
                      className={clsx(
                        'flex-1 py-2 font-medium border-l border-white/10',
                        personRole === 'crew' ? 'bg-[#e11d48]/25 text-white' : 'bg-transparent text-slate-500'
                      )}
                    >
                      Crew
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Search actor or director…"
                    value={personQuery}
                    onChange={(e) => setPersonQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm outline-none focus:border-[#e11d48]/40"
                  />
                  {person && (
                    <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 text-sm">
                      <span className="truncate">{person.name}</span>
                      <button type="button" onClick={() => { setPerson(null); setPersonQuery(''); }} className="text-emerald-300 text-xs">
                        Clear
                      </button>
                    </div>
                  )}
                  {personResults.length > 0 && !person && (
                    <ul className="rounded-xl border border-white/10 bg-[#0a0a0c] max-h-48 overflow-y-auto text-sm">
                      {personResults.map((p) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-white/5 flex items-center gap-2"
                            onClick={() => {
                              setPerson({ id: p.id, name: p.name });
                              setPersonQuery(p.name);
                              setPersonResults([]);
                            }}
                          >
                            {p.profile_path && (
                              <img src={`https://image.tmdb.org/t/p/w45${p.profile_path}`} alt="" className="w-8 h-8 rounded-full object-cover" />
                            )}
                            <span>{p.name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <label className="flex items-center justify-between gap-4 cursor-pointer rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">Streaming now</p>
                    <p className="text-xs text-slate-500 mt-0.5">US flatrate providers (TMDB watch providers)</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={streaming}
                    onChange={(e) => setStreaming(e.target.checked)}
                    className="w-5 h-5 accent-[#e11d48] rounded"
                  />
                </label>

                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="w-full rounded-xl border border-white/15 py-3 text-sm font-medium text-slate-300 hover:bg-white/5"
                >
                  Reset all filters
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
