const TMDB_BASE = 'https://api.themoviedb.org/3';

/**
 * Fetch a single movie from TMDB by their numeric ID (e.g. 550 for Fight Club).
 * Uses TMDB_API_KEY from env.
 */
export async function fetchMovieById(tmdbId) {
    const key = process.env.TMDB_API_KEY;
    if (!key) {
        throw new Error('TMDB_API_KEY is not set in .env');
    }
    const url = `${TMDB_BASE}/movie/${tmdbId}?api_key=${key}`;
    const res = await fetch(url);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`TMDB API error ${res.status}: ${text}`);
    }
    return res.json();
}

/**
 * Fetch popular (most viewed) movies from TMDB.
 * Returns TMDB response: { page, results: [...], total_pages, total_results }.
 */
export async function fetchPopularMovies(page = 1) {
    const key = process.env.TMDB_API_KEY;
    if (!key) throw new Error('TMDB_API_KEY is not set in .env');
    const p = Math.max(1, parseInt(page, 10) || 1);
    const url = `${TMDB_BASE}/movie/popular?api_key=${key}&page=${p}`;
    const res = await fetch(url);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`TMDB API error ${res.status}: ${text}`);
    }
    return res.json();
}

/**
 * Fetch top rated movies from TMDB.
 * Returns TMDB response: { page, results: [...], total_pages, total_results }.
 */
export async function fetchTopRatedMovies(page = 1) {
    const key = process.env.TMDB_API_KEY;
    if (!key) throw new Error('TMDB_API_KEY is not set in .env');
    const p = Math.max(1, parseInt(page, 10) || 1);
    const url = `${TMDB_BASE}/movie/top_rated?api_key=${key}&page=${p}`;
    const res = await fetch(url);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`TMDB API error ${res.status}: ${text}`);
    }
    return res.json();
}

/**
 * Fetch trending movies from TMDB (default window: week).
 * Returns TMDB response: { page, results: [...], total_pages, total_results }.
 */
export async function fetchTrendingMovies(window = 'week', page = 1) {
    const key = process.env.TMDB_API_KEY;
    if (!key) throw new Error('TMDB_API_KEY is not set in .env');
    const p = Math.max(1, parseInt(page, 10) || 1);
    const validWindow = ['day', 'week'].includes(window) ? window : 'week';
    const url = `${TMDB_BASE}/trending/movie/${validWindow}?api_key=${key}&page=${p}`;
    const res = await fetch(url);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`TMDB API error ${res.status}: ${text}`);
    }
    return res.json();
}

/**
 * Search movies on TMDB by query string.
 * Returns TMDB response: { page, results: [...], total_pages, total_results }.
 */
export async function searchMovies(query, page = 1) {
    const key = process.env.TMDB_API_KEY;
    if (!key) {
        throw new Error('TMDB_API_KEY is not set in .env');
    }
    const encoded = encodeURIComponent(String(query).trim());
    const url = `${TMDB_BASE}/search/movie?api_key=${key}&query=${encoded}&page=${Math.max(1, parseInt(page, 10) || 1)}`;
    const res = await fetch(url);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`TMDB API error ${res.status}: ${text}`);
    }
    return res.json();
}

/**
 * Map TMDB movie response to our database movie shape.
 * Used when saving a movie from TMDB into our DB.
 */
export function mapTmdbMovieToDb(tmdbMovie, createdByUserId) {
    const releaseYear = tmdbMovie.release_date
        ? parseInt(tmdbMovie.release_date.slice(0, 4), 10)
        : null;
    const genres = Array.isArray(tmdbMovie.genres)
        ? tmdbMovie.genres.map((g) => g.name).filter(Boolean)
        : [];
    return {
        tmdbId: tmdbMovie.id,
        title: tmdbMovie.title ?? 'Unknown',
        year: releaseYear ?? 0,
        genre: genres,
        runTime: tmdbMovie.runtime ?? null,
        voteAverage:
            tmdbMovie.vote_average != null && !Number.isNaN(Number(tmdbMovie.vote_average))
                ? Number(tmdbMovie.vote_average)
                : null,
        Overview: tmdbMovie.overview ?? null,
        posterPath: tmdbMovie.poster_path ?? null,
        backdropPath: tmdbMovie.backdrop_path ?? null,
        createdBy: createdByUserId,
    };
}

/**
 * Fetch videos for a specific movie from TMDB.
 * Returns { id, results: [ { key, name, site, type, official } ] }
 */
export async function fetchMovieVideos(tmdbId) {
    const key = process.env.TMDB_API_KEY;
    if (!key) throw new Error('TMDB_API_KEY is not set in .env');
    const url = `${TMDB_BASE}/movie/${tmdbId}/videos?api_key=${key}`;
    const res = await fetch(url);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`TMDB API error ${res.status}: ${text}`);
    }
    return res.json();
}

/**
 * TMDB discover/movie — maps query-style options to dotted parameter names.
 * @param {Record<string, string|number|undefined|null>} opts
 */
export async function fetchDiscoverMovies(opts = {}) {
    const key = process.env.TMDB_API_KEY;
    if (!key) throw new Error('TMDB_API_KEY is not set in .env');
    const page = Math.max(1, parseInt(opts.page, 10) || 1);
    const params = new URLSearchParams();
    params.set('api_key', key);
    params.set('page', String(page));
    params.set('sort_by', opts.sort_by || 'popularity.desc');
    params.set('include_adult', opts.include_adult === true || opts.include_adult === 'true' ? 'true' : 'false');

    const pairs = [
        ['vote_average.gte', opts.vote_average_gte],
        ['vote_average.lte', opts.vote_average_lte],
        ['vote_count.gte', opts.vote_count_gte],
        ['with_runtime.gte', opts.with_runtime_gte],
        ['with_runtime.lte', opts.with_runtime_lte],
        ['primary_release_date.gte', opts.primary_release_date_gte],
        ['primary_release_date.lte', opts.primary_release_date_lte],
        ['with_genres', opts.with_genres],
        ['with_cast', opts.with_cast],
        ['with_crew', opts.with_crew],
        ['watch_region', opts.watch_region],
        ['with_watch_monetization_types', opts.with_watch_monetization_types],
        ['with_watch_providers', opts.with_watch_providers],
    ];
    for (const [k, v] of pairs) {
        if (v != null && v !== '') params.set(k, String(v));
    }

    const url = `${TMDB_BASE}/discover/movie?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`TMDB API error ${res.status}: ${text}`);
    }
    return res.json();
}

/**
 * Upcoming releases with a future primary_release_date (UTC), sorted by TMDB popularity.
 * Uses a multi-month window so the feed highlights well-known titles, not only the next few days.
 */
export async function fetchUpcomingMovies(page = 1) {
    const now = new Date();
    const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const y = tomorrow.getUTCFullYear();
    const mo = String(tomorrow.getUTCMonth() + 1).padStart(2, '0');
    const da = String(tomorrow.getUTCDate()).padStart(2, '0');
    const primaryReleaseGte = `${y}-${mo}-${da}`;
    const todayStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;

    const windowEnd = new Date(tomorrow);
    windowEnd.setUTCMonth(windowEnd.getUTCMonth() + 18);
    const ye = windowEnd.getUTCFullYear();
    const me = String(windowEnd.getUTCMonth() + 1).padStart(2, '0');
    const de = String(windowEnd.getUTCDate()).padStart(2, '0');
    const primaryReleaseLte = `${ye}-${me}-${de}`;

    // No vote_count floor: unreleased titles often have very few TMDB votes; a floor can return zero hits.
    let data = await fetchDiscoverMovies({
        page,
        sort_by: 'popularity.desc',
        primary_release_date_gte: primaryReleaseGte,
        primary_release_date_lte: primaryReleaseLte,
        include_adult: false,
    });

    let raw = data.results || [];
    if (!raw.length && (data.total_results === 0 || data.total_results == null)) {
        data = await fetchDiscoverMovies({
            page,
            sort_by: 'popularity.desc',
            primary_release_date_gte: primaryReleaseGte,
            include_adult: false,
        });
        raw = data.results || [];
    }

    let results = raw.filter((m) => {
        if (!m?.release_date) return true;
        return String(m.release_date) > todayStr;
    });
    if (results.length === 0 && raw.length > 0) {
        results = raw;
    }
    return { ...data, results };
}

/**
 * Search people (for cast/crew picker).
 */
export async function searchPersons(query, page = 1) {
    const key = process.env.TMDB_API_KEY;
    if (!key) throw new Error('TMDB_API_KEY is not set in .env');
    const q = String(query || '').trim();
    if (!q) {
        return { page: 1, results: [], total_pages: 0, total_results: 0 };
    }
    const p = Math.max(1, parseInt(page, 10) || 1);
    const url = `${TMDB_BASE}/search/person?api_key=${key}&query=${encodeURIComponent(q)}&page=${p}`;
    const res = await fetch(url);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`TMDB API error ${res.status}: ${text}`);
    }
    return res.json();
}
