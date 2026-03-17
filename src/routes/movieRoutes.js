import express from 'express';
import { fetchMovieById, searchMovies, fetchPopularMovies, fetchTopRatedMovies, fetchTrendingMovies, fetchMovieVideos } from '../services/tmdb.js';
import { findOrCreateFromTmdb, listMovies, listFeatured } from '../controllers/moviecontroller.js';
import { listReviewsByMovie, createOrUpdateReview } from '../controllers/reviewcontroller.js';
import { listCommentsByMovie, createComment } from '../controllers/commentcontroller.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { fromTmdbSchema } from '../validators/movieValidators.js';
import { createReviewSchema } from '../validators/reviewValidators.js';
import { createCommentSchema } from '../validators/commentValidators.js';

function movieRoutes(prisma) {
    const router = express.Router();

    router.get('/hello', (req, res) => {
        res.json({ message: "Hello from movie routes" });
    });

    /** GET /movies – list movies from our DB (pagination: page, limit; optional search by title). */
    router.get('/', listMovies(prisma));

    /** GET /movies/featured?limit=6 – movies with at least one review, for landing recommendations. */
    router.get('/featured', listFeatured(prisma));

    /** GET /movies/popular?page=1 – TMDB popular (most viewed) movies. */
    router.get('/popular', async (req, res) => {
        try {
            const data = await fetchPopularMovies(req.query.page);
            res.json(data);
        } catch (err) {
            res.status(502).json({ error: err.message || 'Failed to fetch popular movies' });
        }
    });

    /** GET /movies/top-rated?page=1 – TMDB top rated movies. */
    router.get('/top-rated', async (req, res) => {
        try {
            const data = await fetchTopRatedMovies(req.query.page);
            res.json(data);
        } catch (err) {
            res.status(502).json({ error: err.message || 'Failed to fetch top rated movies' });
        }
    });

    /** GET /movies/trending?window=week&page=1 – TMDB trending movies. */
    router.get('/trending', async (req, res) => {
        try {
            const window = req.query.window || 'week';
            const data = await fetchTrendingMovies(window, req.query.page);
            res.json(data);
        } catch (err) {
            res.status(502).json({ error: err.message || 'Failed to fetch trending movies' });
        }
    });

    /** GET /movies/search?q=...&page=1 – search movies on TMDB (no DB). */
    router.get('/search', async (req, res) => {
        const q = req.query.q?.trim();
        if (!q) {
            return res.status(400).json({ error: 'Query parameter "q" is required' });
        }
        try {
            const data = await searchMovies(q, req.query.page);
            res.json(data);
        } catch (err) {
            res.status(502).json({ error: err.message || 'Search failed' });
        }
    });

    /** GET /movies/tmdb/:id – fetch movie from TMDB API (no DB). */
    router.get('/tmdb/:id', async (req, res) => {
        try {
            const movie = await fetchMovieById(req.params.id);
            res.json(movie);
        } catch (err) {
            const status = err.message.startsWith('TMDB API error 404') ? 404 : 502;
            res.status(status).json({ error: err.message });
        }
    });

    /** GET /movies/tmdb/:id/videos – fetch movie videos from TMDB. */
    router.get('/tmdb/:id/videos', async (req, res) => {
        try {
            const data = await fetchMovieVideos(req.params.id);
            res.json(data);
        } catch (err) {
            res.status(502).json({ error: err.message || 'Failed to fetch videos' });
        }
    });

    /** GET /movies/:id/reviews – list reviews + aggregate rating. */
    router.get('/:id/reviews', listReviewsByMovie(prisma));
    /** POST /movies/:id/reviews – create or update your review (auth). Body: { rating, text? }. */
    router.post('/:id/reviews', authMiddleware, validateRequest(createReviewSchema), createOrUpdateReview(prisma));
    /** GET /movies/:id/comments – list comments. */
    router.get('/:id/comments', listCommentsByMovie(prisma));
    /** POST /movies/:id/comments – add comment (auth). Body: { text }. */
    router.post('/:id/comments', authMiddleware, validateRequest(createCommentSchema), createComment(prisma));

    /** GET /movies/:id – get one movie from our DB by uuid (e.g. from watchlist). */
    router.get('/:id', async (req, res) => {
        const movie = await prisma.movie.findUnique({
            where: { id: req.params.id },
            include: { creator: { select: { id: true, name: true, email: true } } },
        });
        if (!movie) {
            return res.status(404).json({ error: 'Movie not found' });
        }
        res.json({ status: 'success', data: movie });
    });

    /** POST /movies/from-tmdb – find or create movie in our DB from TMDB id (auth required). */
    router.post('/from-tmdb', authMiddleware, validateRequest(fromTmdbSchema), findOrCreateFromTmdb(prisma));

    return router;
}

export default movieRoutes;     