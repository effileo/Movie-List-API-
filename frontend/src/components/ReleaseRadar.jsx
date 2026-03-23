import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, Plus, Sparkles } from 'lucide-react';
import { apiRoutes, posterUrl, POSTER_PLACEHOLDER } from '../api/client';
import { useToast } from './ui/ToastProvider.jsx';

function GoogleCalendarGlyph({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"
      />
      <path fill="#EA4335" d="M7 12h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z" />
    </svg>
  );
}

function countdownLabel(releaseDate) {
  if (!releaseDate) return '';
  const target = new Date(`${releaseDate}T12:00:00.000Z`);
  const now = new Date();
  const diffMs = target - now;
  const days = Math.ceil(diffMs / 86400000);
  if (days < 0) return 'Released';
  if (days === 0) return 'Released today';
  if (days === 1) return 'Releases in 1 day';
  return `Releases in ${days} days`;
}

export default function ReleaseRadar() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [localSynced, setLocalSynced] = useState(() => new Set());

  const upcomingQuery = useQuery({
    queryKey: ['movies', 'upcoming'],
    queryFn: () => apiRoutes.movies.upcoming(1),
  });

  const watchlistQuery = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => apiRoutes.watchlist.list(),
  });

  const calendarQuery = useQuery({
    queryKey: ['calendar', 'status'],
    queryFn: () => apiRoutes.calendar.status(),
  });

  useEffect(() => {
    const cal = searchParams.get('calendar');
    if (cal === 'connected') {
      showToast('Google Calendar connected. You can sync premieres.');
      queryClient.invalidateQueries({ queryKey: ['calendar', 'status'] });
      const next = new URLSearchParams(searchParams);
      next.delete('calendar');
      setSearchParams(next, { replace: true });
    } else if (cal === 'error') {
      showToast('Could not connect Google Calendar. Try again.', 'error');
      const next = new URLSearchParams(searchParams);
      next.delete('calendar');
      next.delete('reason');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, showToast, queryClient]);

  const anticipatedItems = useMemo(() => {
    const raw = watchlistQuery.data?.data;
    if (!Array.isArray(raw)) return [];
    return raw.filter((item) => item.status === 'ANTICIPATED');
  }, [watchlistQuery.data]);

  const anticipatedTmdbSet = useMemo(() => {
    const s = new Set();
    anticipatedItems.forEach((item) => {
      const id = item.movie?.tmdbId;
      if (id != null) s.add(Number(id));
    });
    return s;
  }, [anticipatedItems]);

  const serverSynced = useMemo(() => {
    const ids = calendarQuery.data?.syncedTmdbIds;
    return new Set(Array.isArray(ids) ? ids.map(Number) : []);
  }, [calendarQuery.data]);

  const addAnticipated = useMutation({
    mutationFn: (tmdbId) =>
      apiRoutes.watchlist.add({ tmdbId, status: 'ANTICIPATED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      showToast('Added to Anticipated');
    },
    onError: (err) => showToast(err.message || 'Could not add', 'error'),
  });

  const syncMutation = useMutation({
    mutationFn: (payload) => apiRoutes.calendar.sync(payload),
    onSuccess: (data, variables) => {
      setLocalSynced((prev) => new Set(prev).add(variables.tmdbId));
      queryClient.invalidateQueries({ queryKey: ['calendar', 'status'] });
      if (!data?.alreadySynced) {
        showToast('Synced to Google Calendar! See you at the premiere.');
      } else {
        showToast('Already on your calendar.');
      }
    },
    onError: async (err) => {
      const msg = err.message || '';
      if (msg.includes('Connect Google') || msg.includes('401')) {
        try {
          const { url } = await apiRoutes.calendar.authUrl();
          if (url) window.location.href = url;
        } catch (e) {
          showToast(e.message || 'Calendar setup failed', 'error');
        }
        return;
      }
      showToast(msg || 'Sync failed', 'error');
    },
  });

  async function handleSync(movie) {
    const tmdbId = Number(movie.id);
    if (serverSynced.has(tmdbId) || localSynced.has(tmdbId)) return;

    if (!calendarQuery.data?.connected) {
      try {
        const { url } = await apiRoutes.calendar.authUrl();
        if (url) window.location.href = url;
      } catch (e) {
        showToast(e.message || 'Calendar is not available', 'error');
      }
      return;
    }

    syncMutation.mutate({
      tmdbId,
      releaseDate: movie.release_date,
      title: movie.title,
      overview: movie.overview || '',
    });
  }

  const results = upcomingQuery.data?.results || [];
  const loading = upcomingQuery.isLoading;
  const err = upcomingQuery.error;

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-12">
      <header className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cinematic-accent mb-2">
              Coming soon
            </p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-wide text-white font-movie-title">
              Release Radar
            </h1>
            <p className="text-cinematic-muted text-sm mt-2 max-w-xl">
              Popular upcoming releases (TMDB popularity, next 18 months). Save titles to Anticipated and
              sync release day to Google Calendar.
            </p>
          </div>
          {calendarQuery.data && (
            <div
              className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
                calendarQuery.data.connected
                  ? 'border-emerald-500/40 text-emerald-300/90 bg-emerald-500/10'
                  : 'border-white/10 text-cinematic-muted bg-white/5'
              }`}
            >
              {calendarQuery.data.connected ? 'Google Calendar linked' : 'Calendar not connected'}
            </div>
          )}
        </div>
      </header>

      {anticipatedItems.length > 0 && (
        <section aria-labelledby="anticipated-heading" className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cinematic-accent" aria-hidden />
            <h2 id="anticipated-heading" className="text-lg font-semibold tracking-wide text-white">
              Your Anticipated
            </h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 hide-scroll">
            {anticipatedItems.map((item) => {
              const m = item.movie;
              if (!m?.tmdbId) return null;
              const src = posterUrl(m.posterPath);
              return (
                <Link
                  key={item.id}
                  to={`/movie/tmdb/${m.tmdbId}`}
                  className="shrink-0 w-24 group"
                >
                  <div className="release-radar-card rounded-lg overflow-hidden border border-white/10 aspect-[2/3] bg-cinematic-surface">
                    <img
                      src={src || POSTER_PLACEHOLDER}
                      alt=""
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                  <p className="text-[11px] text-cinematic-muted truncate mt-1.5">{m.title}</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section aria-labelledby="feed-heading" className="space-y-6">
        <h2 id="feed-heading" className="text-xl font-semibold text-white tracking-wide">
          Feed
        </h2>

        {loading && (
          <div className="flex items-center gap-2 text-cinematic-muted">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading upcoming releases…
          </div>
        )}

        {err && (
          <p className="text-red-400 text-sm">{err.message || 'Failed to load upcoming movies.'}</p>
        )}

        {!loading && !err && results.length === 0 && (
          <p className="text-cinematic-muted text-sm">No upcoming releases found right now.</p>
        )}

        <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {results.map((movie) => {
            const tmdbId = Number(movie.id);
            const inAnticipated = anticipatedTmdbSet.has(tmdbId);
            const synced =
              serverSynced.has(tmdbId) || localSynced.has(tmdbId);
            const poster = posterUrl(movie.poster_path);

            return (
              <li key={movie.id}>
                <article className="release-radar-card rounded-xl overflow-hidden bg-cinematic-surface/80 border border-white/[0.07] flex flex-col h-full">
                  <div className="relative aspect-[2/3] w-full bg-black/40">
                    <img
                      src={poster || POSTER_PLACEHOLDER}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pt-16 px-4 pb-4">
                      <p className="text-xs font-medium text-cinematic-accent uppercase tracking-wider">
                        {countdownLabel(movie.release_date)}
                      </p>
                      <h3 className="text-lg font-bold text-white mt-1 font-movie-title leading-tight">
                        {movie.title}
                      </h3>
                      {movie.release_date && (
                        <p className="text-[11px] text-white/50 mt-1">{movie.release_date}</p>
                      )}
                    </div>
                  </div>
                  <div className="p-4 flex flex-col gap-3 flex-1">
                    <p className="text-sm text-cinematic-muted line-clamp-3">
                      {movie.overview || 'Synopsis coming soon.'}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-auto">
                      <button
                        type="button"
                        disabled={inAnticipated || addAnticipated.isPending}
                        onClick={() => addAnticipated.mutate(tmdbId)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-white/10 bg-white/5 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {inAnticipated ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            In Anticipated
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            Add to Anticipated
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={
                          synced ||
                          syncMutation.isPending ||
                          !movie.release_date
                        }
                        onClick={() => handleSync(movie)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-cinematic-accent/40 bg-cinematic-accent/15 text-white hover:bg-cinematic-accent/25 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                      >
                        {syncMutation.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : synced ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <GoogleCalendarGlyph className="w-4 h-4" />
                        )}
                        {synced ? 'Synced' : 'Sync to Calendar'}
                      </button>
                      <Link
                        to={`/movie/tmdb/${movie.id}`}
                        className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-medium text-cinematic-muted hover:text-white border border-transparent hover:border-white/10 transition-colors"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
