import express from 'express';
import { fetchMovieById, searchMovies } from '../services/tmdb.js';
import { findOrCreateFromTmdb, listMovies } from '../controllers/moviecontroller.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { fromTmdbSchema } from '../validators/movieValidators.js';

function movieRoutes(prisma) {
    const router = express.Router();

    router.get('/hello', (req, res) => {
        res.json({ message: "Hello from movie routes" });
    });

    /** GET /movies – list movies from our DB (pagination: page, limit; optional search by title). */
    router.get('/', listMovies(prisma));

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