import express from 'express';
import movieRoutes from './routes/movieRoutes.js';
import { config } from 'dotenv';
import { connectDB, disconnectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import prisma from './config/db.js';
import watchlistRoutes from './routes/watchlistRoutes.js';  

config();

const app = express();
const port = 5001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/movies', movieRoutes);
app.use('/auth', authRoutes);
app.use('/watchlist', watchlistRoutes(prisma));

const start = async () => {
    await connectDB();
    app.listen(port, () => {
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