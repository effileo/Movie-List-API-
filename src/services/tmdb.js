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
        Overview: tmdbMovie.overview ?? null,
        posterPath: tmdbMovie.poster_path ?? null,
        backdropPath: tmdbMovie.backdrop_path ?? null,
        createdBy: createdByUserId,
    };
}
