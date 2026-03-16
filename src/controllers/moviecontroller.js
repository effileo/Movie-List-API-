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

export { findOrCreateFromTmdb, listMovies };
