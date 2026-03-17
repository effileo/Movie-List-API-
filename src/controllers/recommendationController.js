import { fetchMovieById } from '../services/tmdb.js';

// Simple map of common TMDB genre IDs for the empty-state survey and text mapping
export const GENRE_MAP = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
    80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
    14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
    9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
    10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
};

const TMDB_BASE = 'https://api.themoviedb.org/3';

// Helper to fetch cast for a specific TMDB movie ID
async function fetchMovieCredits(tmdbId) {
    const key = process.env.TMDB_API_KEY;
    const url = `${TMDB_BASE}/movie/${tmdbId}/credits?api_key=${key}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.json();
}

// Discover movies based on TMDB IDs for genres/actors
async function discoverRecommendations(genreIds, castIds, excludedTmdbIds = []) {
    const key = process.env.TMDB_API_KEY;
    
    let url = `${TMDB_BASE}/discover/movie?api_key=${key}&sort_by=popularity.desc&page=1`;
    if (genreIds?.length) url += `&with_genres=${genreIds.join(',')}`;
    if (castIds?.length) url += `&with_cast=${castIds.join(',')}`;
    
    // We want high quality recs
    url += '&vote_count.gte=100&vote_average.gte=6.5';
    
    const res = await fetch(url);
    if (!res.ok) return [];
    
    const data = await res.json();
    let results = data.results || [];
    
    // Filter out movies the user has already watched/watchlisted
    results = results.filter(movie => !excludedTmdbIds.includes(movie.id));
    return results;
}

export const getRecommendations = (prisma) => async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 1. Fetch user's entire watchlist to analyze and exclude
        const watchlist = await prisma.watchListItem.findMany({
            where: { userId },
            include: { movie: true }
        });
        
        // 1.5 Handle Empty State or Survey Kickstart
        const surveyGenres = req.query.genres ? req.query.genres.split(',') : [];
        const excludedTmdbIds = watchlist.map(item => item.movie.tmdbId).filter(Boolean);

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

        // Ensure uniqueness and limit to 5 for the Bento grid
        const uniqueRecs = Array.from(new Map(recs.map(item => [item.id, item])).values()).slice(0, 5);
        
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
        const userId = req.user.id;
        
        const watchlist = await prisma.watchListItem.findMany({
            where: { userId },
            include: { movie: true }
        });
        
        const excludedTmdbIds = watchlist.map(item => item.movie.tmdbId).filter(Boolean);
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

        const recs = await discoverRecommendations([targetGenreId], [], excludedTmdbIds);
        if (recs.length === 0) {
           return res.status(404).json({ error: "Could not find a surprise" });
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
