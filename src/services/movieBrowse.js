import { fetchDiscoverMovies, searchMovies } from './tmdb.js';

/** Major US streaming provider IDs (flatrate) — used when streaming=1 */
const DEFAULT_STREAMING_PROVIDERS_US = '8|9|15|337|384|386|350|531|1899';

/**
 * Post-filter TMDB search/movie results (list view has limited fields).
 */
export function filterSearchMovieResults(results, q) {
    const minRating = q.vote_average_gte != null && q.vote_average_gte !== '' ? Number(q.vote_average_gte) : null;
    const yearMin = q.year_gte != null && q.year_gte !== '' ? parseInt(q.year_gte, 10) : null;
    const yearMax = q.year_lte != null && q.year_lte !== '' ? parseInt(q.year_lte, 10) : null;
    const maxRuntime =
        q.with_runtime_lte != null && q.with_runtime_lte !== '' ? parseInt(q.with_runtime_lte, 10) : null;
    const genres = q.with_genres
        ? String(q.with_genres)
              .split(',')
              .map((x) => parseInt(x.trim(), 10))
              .filter((n) => !Number.isNaN(n))
        : [];

    return (results || []).filter((m) => {
        if (minRating != null && !Number.isNaN(minRating) && (m.vote_average ?? 0) < minRating) return false;
        const y = m.release_date ? parseInt(String(m.release_date).slice(0, 4), 10) : null;
        if (yearMin != null && !Number.isNaN(yearMin) && y != null && y < yearMin) return false;
        if (yearMax != null && !Number.isNaN(yearMax) && y != null && y > yearMax) return false;
        if (maxRuntime != null && !Number.isNaN(maxRuntime) && m.runtime != null && m.runtime > maxRuntime) {
            return false;
        }
        if (genres.length && Array.isArray(m.genre_ids)) {
            if (!genres.every((gid) => m.genre_ids.includes(gid))) return false;
        }
        return true;
    });
}

function titleMatchesQuery(movie, text) {
    if (!text || !String(text).trim()) return true;
    const t = String(text).trim().toLowerCase();
    const title = (movie.title || movie.name || '').toLowerCase();
    const orig = (movie.original_title || '').toLowerCase();
    return title.includes(t) || orig.includes(t);
}

/**
 * Build discover options from Express query object (flat keys).
 */
export function queryToDiscoverOpts(q) {
    const page = Math.max(1, parseInt(q.page, 10) || 1);
    const sort_by = q.sort_by || 'popularity.desc';

    const vote_average_gte =
        q.vote_average_gte != null && q.vote_average_gte !== '' ? Number(q.vote_average_gte) : undefined;
    const with_runtime_lte =
        q.with_runtime_lte != null && q.with_runtime_lte !== '' ? parseInt(q.with_runtime_lte, 10) : undefined;
    const with_genres = q.with_genres?.trim() || undefined;
    const with_cast = q.with_cast?.trim() || undefined;
    const with_crew = q.with_crew?.trim() || undefined;

    const yearGte = q.year_gte != null && q.year_gte !== '' ? parseInt(q.year_gte, 10) : null;
    const yearLte = q.year_lte != null && q.year_lte !== '' ? parseInt(q.year_lte, 10) : null;
    let primary_release_date_gte;
    let primary_release_date_lte;
    if (yearGte != null && !Number.isNaN(yearGte)) primary_release_date_gte = `${yearGte}-01-01`;
    if (yearLte != null && !Number.isNaN(yearLte)) primary_release_date_lte = `${yearLte}-12-31`;

    const streaming =
        q.streaming === '1' || q.streaming === 'true' || q.streaming === true;
    const watch_region = (q.watch_region || 'US').trim() || 'US';

    let with_watch_monetization_types;
    let with_watch_providers;
    if (streaming) {
        with_watch_monetization_types = 'flatrate';
        with_watch_providers = q.with_watch_providers?.trim() || DEFAULT_STREAMING_PROVIDERS_US;
    }

    return {
        page,
        sort_by,
        vote_average_gte: vote_average_gte != null && !Number.isNaN(vote_average_gte) ? vote_average_gte : undefined,
        with_runtime_lte: with_runtime_lte != null && !Number.isNaN(with_runtime_lte) ? with_runtime_lte : undefined,
        with_genres,
        with_cast,
        with_crew,
        primary_release_date_gte,
        primary_release_date_lte,
        watch_region: streaming ? watch_region : undefined,
        with_watch_monetization_types,
        with_watch_providers,
    };
}

export function discoverUsesOnlyDefaults(q) {
    const keys = [
        'vote_average_gte',
        'with_runtime_lte',
        'with_genres',
        'with_cast',
        'with_crew',
        'year_gte',
        'year_lte',
        'streaming',
    ];
    for (const k of keys) {
        const v = q[k];
        if (v != null && String(v).trim() !== '') return false;
    }
    return true;
}

/**
 * Unified browse: title search vs discover, optional title substring filter on discover when q present.
 */
export async function browseMovies(q) {
    const textQ = q.q?.trim();
    const useSearchOnly = Boolean(textQ) && discoverUsesOnlyDefaults(q);

    if (useSearchOnly) {
        const page = Math.max(1, parseInt(q.page, 10) || 1);
        const data = await searchMovies(textQ, page);
        const filtered = filterSearchMovieResults(data.results || [], q);
        return { ...data, results: filtered };
    }

    const opts = queryToDiscoverOpts(q);
    const data = await fetchDiscoverMovies(opts);
    let results = data.results || [];
    if (textQ) {
        results = results.filter((m) => titleMatchesQuery(m, textQ));
    }
    return { ...data, results };
}
