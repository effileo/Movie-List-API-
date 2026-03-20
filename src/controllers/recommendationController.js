import { fetchPopularMovies } from '../services/tmdb.js';

// Simple map of common TMDB genre IDs for the empty-state survey and text mapping
export const GENRE_MAP = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
    80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
    14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
    9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
    10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
};

/**
 * Only these movie columns are loaded. Omitting voteAverage keeps this endpoint working
 * when the DB has not yet applied the migration that adds that column.
 */
const RECOMMENDATION_MOVIE_SELECT = {
    id: true,
    tmdbId: true,
    title: true,
    year: true,
    genre: true,
    runTime: true,
    Overview: true,
    posterPath: true,
    backdropPath: true,
    createdAt: true,
    createdBy: true,
};

const TMDB_BASE = 'https://api.themoviedb.org/3';

// Helper to fetch cast for a specific TMDB movie ID
async function fetchMovieCredits(tmdbId) {
    const key = process.env.TMDB_API_KEY?.trim();
    if (!key || tmdbId == null) return null;
    try {
        const url = `${TMDB_BASE}/movie/${tmdbId}/credits?api_key=${key}`;
        const res = await fetch(url);
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.warn('fetchMovieCredits failed', tmdbId, e?.message);
        return null;
    }
}

function normalizeExcludedIds(ids) {
    const set = new Set();
    for (const id of ids) {
        if (id == null) continue;
        const n = Number(id);
        if (!Number.isNaN(n)) set.add(n);
    }
    return set;
}

// Discover movies based on TMDB IDs for genres/actors
async function discoverRecommendations(genreIds, castIds, excludedTmdbIds = [], { relaxed = false } = {}) {
    const key = process.env.TMDB_API_KEY?.trim();
    if (!key) return [];

    const excluded = normalizeExcludedIds(excludedTmdbIds);

    try {
        let url = `${TMDB_BASE}/discover/movie?api_key=${key}&sort_by=popularity.desc&page=1`;
        if (genreIds?.length) url += `&with_genres=${genreIds.join(',')}`;
        if (castIds?.length) url += `&with_cast=${castIds.join(',')}`;

        if (!relaxed) {
            url += '&vote_count.gte=100&vote_average.gte=6.5';
        } else {
            url += '&vote_count.gte=40&vote_average.gte=5.5';
        }

        const res = await fetch(url);
        if (!res.ok) return [];

        const data = await res.json();
        let results = data.results || [];

        results = results.filter((movie) => movie?.id != null && !excluded.has(Number(movie.id)));
        return results;
    } catch (e) {
        console.warn('discoverRecommendations failed', e?.message);
        return [];
    }
}

export const getRecommendations = (prisma) => async (req, res) => {
    try {
        const userId = Number(req.user.id);
        if (Number.isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user' });
        }

        // 1. Fetch user's entire watchlist to analyze and exclude
        const watchlist = await prisma.watchListItem.findMany({
            where: { userId },
            include: { movie: { select: RECOMMENDATION_MOVIE_SELECT } },
        });

        // 1.5 Handle Empty State or Survey Kickstart
        const surveyGenres = req.query.genres ? req.query.genres.split(',').map((g) => g.trim()).filter(Boolean) : [];
        const excludedTmdbIds = watchlist.map((item) => item.movie.tmdbId).filter((id) => id != null);

        if (watchlist.length === 0 && surveyGenres.length === 0) {
            return res.json({ needsOnboarding: true, results: [] });
        }

        let topGenreIds = [];
        let topActors = [];
        let whyBadge = 'Recommended for You';

        // 2. If user passed survey genres, use those directly
        if (surveyGenres.length > 0) {
            topGenreIds = surveyGenres.slice(0, 3);
            whyBadge = `Top Picks for your Selected Genres`;
        } 
        // 3. Otherwise, Analyze their Watchlist
        else {
            const genreCounts = {};
            const recentTopMovies = watchlist
                .sort((a, b) => (b.rating || 0) - (a.rating || 0)) // Sort by rating first
                .slice(0, 5); // Take top 5

            // Count genres mathematically
            watchlist.forEach(item => {
                const genres = item.movie.genre || [];
                genres.forEach(g => {
                    genreCounts[g] = (genreCounts[g] || 0) + 1;
                });
            });

            // Map the string name back to TMDB ID (approximate using the reverse of our map)
            const reverseGenreMap = Object.entries(GENRE_MAP).reduce((acc, [id, name]) => {
                acc[name.toLowerCase()] = id;
                return acc;
            }, {});

            const sortedGenres = Object.entries(genreCounts)
                .sort(([,a], [,b]) => b - a)
                .map(([name]) => reverseGenreMap[name.toLowerCase()])
                .filter(Boolean);

            topGenreIds = sortedGenres.slice(0, 2);

            // Fetch cast heavily from top 5 movies
            const actorCounts = {};
            for (const item of recentTopMovies) {
                if (item.movie.tmdbId) {
                    const credits = await fetchMovieCredits(item.movie.tmdbId);
                    if (credits?.cast) {
                        // Take top 3 billed actors from each movie
                        credits.cast.slice(0, 3).forEach(actor => {
                            if (!actorCounts[actor.id]) {
                                actorCounts[actor.id] = { count: 1, name: actor.name };
                            } else {
                                actorCounts[actor.id].count += 1;
                            }
                        });
                    }
                }
            }

            topActors = Object.entries(actorCounts)
                .map(([id, data]) => ({ id, ...data }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 3);
            
            // Generate the "Why" badge based on what we found
            if (topActors.length > 0 && topActors[0].count > 1) {
                whyBadge = `Because you like ${topActors[0].name}`;
            } else if (sortedGenres.length > 0) {
                const genreName = GENRE_MAP[topGenreIds[0]];
                if (genreName) whyBadge = `Top Pick for ${genreName} Fans`;
            }
        }

        // 4. Fetch the actual recommendations
        const actorIdToUse = topActors.length > 0 ? topActors[0].id : null;
        
        let recs = await discoverRecommendations(
            topGenreIds,
            actorIdToUse ? [actorIdToUse] : [],
            excludedTmdbIds
        );

        // Fallback if the combo was too narrow
        if (recs.length < 5 && topGenreIds.length > 0) {
            const fallback = await discoverRecommendations(topGenreIds.slice(0, 1), [], excludedTmdbIds);
            recs = [...recs, ...fallback];
        }

        if (recs.length < 5) {
            const relaxed = await discoverRecommendations(topGenreIds, [], excludedTmdbIds, { relaxed: true });
            recs = [...recs, ...relaxed];
        }

        // Ensure uniqueness and limit to 5 for the Bento grid
        let uniqueRecs = Array.from(new Map(recs.map((item) => [item.id, item])).values()).slice(0, 5);

        if (uniqueRecs.length === 0) {
            try {
                const pop = await fetchPopularMovies(1);
                const excluded = normalizeExcludedIds(excludedTmdbIds);
                const fromPopular = (pop.results || []).filter(
                    (m) => m?.id != null && !excluded.has(Number(m.id))
                );
                uniqueRecs = fromPopular.slice(0, 5);
                if (uniqueRecs.length > 0) {
                    whyBadge = 'Popular on TMDB right now';
                }
            } catch (e) {
                console.warn('popular fallback failed', e?.message);
            }
        }
        
        // Append why badges and mock similarity score
        const enhancedRecs = uniqueRecs.map(r => ({
            ...r,
            whyBadge,
            similarityScore: Math.floor(Math.random() * (99 - 80 + 1)) + 80 // Mock 80-99%
        }));

        res.json({ needsOnboarding: false, results: enhancedRecs });
    } catch (err) {
        console.error(err);
        res.status(502).json({ error: 'Failed to generate recommendations' });
    }
};

export const getSurpriseMe = (prisma) => async (req, res) => {
    try {
        const userId = Number(req.user.id);
        if (Number.isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user' });
        }

        const watchlist = await prisma.watchListItem.findMany({
            where: { userId },
            include: { movie: { select: RECOMMENDATION_MOVIE_SELECT } },
        });

        const excludedTmdbIds = watchlist.map((item) => item.movie.tmdbId).filter((id) => id != null);
        const watchedGenres = new Set();
        
        watchlist.forEach(item => {
            (item.movie.genre || []).forEach(g => watchedGenres.add(g.toLowerCase()));
        });

        // Find a genre ID the user hasn't watched much of
        const reverseGenreMap = Object.entries(GENRE_MAP).reduce((acc, [id, name]) => {
            acc[name.toLowerCase()] = id;
            return acc;
        }, {});

        const allGenreKeys = Object.keys(reverseGenreMap);
        const unexploredKeys = allGenreKeys.filter(k => !watchedGenres.has(k));
        
        // Pick random unexplored genre, or random genre if they've seen everything
        const pickKey = unexploredKeys.length > 0 
            ? unexploredKeys[Math.floor(Math.random() * unexploredKeys.length)]
            : allGenreKeys[Math.floor(Math.random() * allGenreKeys.length)];

        const targetGenreId = reverseGenreMap[pickKey];

        let recs = await discoverRecommendations([targetGenreId], [], excludedTmdbIds);
        if (recs.length === 0) {
            recs = await discoverRecommendations([targetGenreId], [], excludedTmdbIds, { relaxed: true });
        }
        if (recs.length === 0) {
            return res.status(404).json({ error: 'Could not find a surprise' });
        }

        // Pick one completely random movie from the page of results
        const randomMovie = recs[Math.floor(Math.random() * recs.length)];
        const genreNameName = Object.values(GENRE_MAP).find(name => name.toLowerCase() === pickKey);

        res.json({ 
            ...randomMovie, 
            whyBadge: `Surprise! A highly-rated ${genreNameName || 'movie'} for you to explore.`,
            similarityScore: 'SURPRISE'
        });

    } catch (err) {
        console.error(err);
        res.status(502).json({ error: 'Failed to fetch surprise' });
    }
};
