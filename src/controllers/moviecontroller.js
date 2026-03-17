import { fetchMovieById, mapTmdbMovieToDb } from '../services/tmdb.js';

/** GET /movies – list movies from our DB with pagination and optional search by title. */
const listMovies = (prisma) => async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const search = req.query.search?.trim() || '';
    const skip = (page - 1) * limit;
    const where = search
        ? { title: { contains: search, mode: 'insensitive' } }
        : {};
    const [movies, total] = await Promise.all([
        prisma.movie.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { creator: { select: { id: true, name: true } } },
        }),
        prisma.movie.count({ where }),
    ]);
    res.json({
        status: 'success',
        data: movies,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
};

/**
 * Find movie in DB by tmdbId, or fetch from TMDB and create. Returns { movie, created }.
 * Use this from other controllers (e.g. watchlist) when you need a movie by TMDB id.
 */
export async function getOrCreateMovieByTmdbId(prisma, tmdbId, userId) {
    const id = parseInt(tmdbId, 10);
    if (Number.isNaN(id)) return { movie: null, created: false };
    let movie = await prisma.movie.findUnique({ where: { tmdbId: id } });
    if (movie) return { movie, created: false };
    const tmdbMovie = await fetchMovieById(id);
    const data = mapTmdbMovieToDb(tmdbMovie, userId);
    movie = await prisma.movie.create({ data });
    return { movie, created: true };
}

/**
 * Find movie in our DB by tmdbId, or fetch from TMDB and create. Returns our movie record.
 * Requires auth (req.user.id used as createdBy when creating).
 */
const findOrCreateFromTmdb = (prisma) => async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ error: 'Not authorized' });
    }
    try {
        const { movie, created } = await getOrCreateMovieByTmdbId(prisma, req.body.tmdbId, userId);
        return res.status(created ? 201 : 200).json({ status: 'success', data: movie });
    } catch (err) {
        if (err.message.startsWith('TMDB API error 404')) {
            return res.status(404).json({ error: 'Movie not found on TMDB' });
        }
        console.error(err);
        return res.status(502).json({ error: err.message || 'Failed to get movie from TMDB' });
    }
};

/**
 * GET /movies/featured – movies that have at least one review, with poster and one featured review.
 * For landing page recommendations.
 */
const listFeatured = (prisma) => async (req, res) => {
    const limit = Math.min(12, Math.max(1, parseInt(req.query.limit, 10) || 6));
    const moviesWithReviews = await prisma.movie.findMany({
        where: { reviews: { some: {} } },
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
            reviews: {
                take: 1,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { id: true, name: true } } },
            },
        },
    });
    const movieIds = moviesWithReviews.map((m) => m.id);
    const aggregates = await prisma.review.groupBy({
        by: ['movieId'],
        _avg: { rating: true },
        _count: true,
        where: { movieId: { in: movieIds } },
    });
    const aggMap = Object.fromEntries(
        aggregates.map((a) => [a.movieId, { averageRating: a._avg.rating, count: a._count }])
    );
    let data = moviesWithReviews.map((m) => {
        const [featuredReview] = m.reviews || [];
        const { reviews, ...movie } = m;
        return {
            movie,
            featuredReview: featuredReview
                ? {
                    id: featuredReview.id,
                    rating: featuredReview.rating,
                    text: featuredReview.text,
                    user: featuredReview.user,
                }
                : null,
            aggregate: aggMap[m.id] ?? null,
        };
    });

    // Enrich movies missing posterPath by fetching from TMDB (e.g. older DB rows)
    const toEnrich = data.filter((d) => !d.movie.posterPath && d.movie.tmdbId);
    if (toEnrich.length > 0) {
        const enrichedList = await Promise.all(
            toEnrich.map(async (item) => {
                try {
                    const tmdbMovie = await fetchMovieById(item.movie.tmdbId);
                    const posterPath = tmdbMovie.poster_path ?? null;
                    const backdropPath = tmdbMovie.backdrop_path ?? null;
                    if (posterPath || backdropPath) {
                        await prisma.movie.update({
                            where: { id: item.movie.id },
                            data: {
                                ...(posterPath && { posterPath }),
                                ...(backdropPath && { backdropPath }),
                            },
                        });
                    }
                    return {
                        ...item,
                        movie: {
                            ...item.movie,
                            posterPath: posterPath ?? item.movie.posterPath,
                            backdropPath: backdropPath ?? item.movie.backdropPath,
                        },
                    };
                } catch {
                    return item;
                }
            })
        );
        const enrichedById = Object.fromEntries(enrichedList.map((e) => [e.movie.id, e]));
        data = data.map((d) => enrichedById[d.movie.id] ?? d);
    }

    res.json({ status: 'success', data });
};

export { findOrCreateFromTmdb, listMovies, listFeatured };
