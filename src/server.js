import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import movieRoutes from './routes/movieRoutes.js';
import { config } from 'dotenv';
import { connectDB, disconnectDB } from './config/db.js';
import { validateEnv } from './config/env.js';
import createAuthRoutes from './routes/authRoutes.js';
import prisma from './config/db.js';
import watchlistRoutes from './routes/watchlistRoutes.js';
import userRoutes from './routes/userRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import cineMatchRoutes from './routes/cineMatchRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { attachSocketServer } from './realtime/socketServer.js';

config();
validateEnv();

const app = express();
const port = process.env.PORT ?? 5001;

app.use(morgan('dev'));
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL ?? true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/auth', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { error: 'Too many attempts, try again later' },
}), createAuthRoutes(prisma));

app.use('/movies', movieRoutes(prisma));
app.use('/watchlist', watchlistRoutes(prisma));
app.use('/users', userRoutes(prisma));
app.use('/reviews', reviewRoutes(prisma));
app.use('/comments', commentRoutes(prisma));
app.use('/cine-match', cineMatchRoutes(prisma));
app.use('/calendar', calendarRoutes(prisma));

app.get('/health', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.status(200).json({ status: 'ok', database: 'connected' });
    } catch (err) {
        res.status(503).json({ status: 'error', database: 'disconnected' });
    }
});

app.use(notFoundHandler);
app.use(errorHandler);

const httpServer = createServer(app);

attachSocketServer(httpServer);

const start = async () => {
    await connectDB();
    httpServer.listen(port, () => {
        console.log('server is running on port ' + port);
    });
};
start();

process.on('unhandledRejection', async (err) => {
    console.error('Unhandled Rejection:', err);
    await disconnectDB();
    process.exit(1);
});

process.on('uncaughtException', async (err) => {
    console.error('Uncaught Exception:', err);
    await disconnectDB();
    process.exit(1);
});
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    await disconnectDB();
    process.exit(0);
});

export default app;
