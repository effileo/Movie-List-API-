import express from 'express';
import Router from './routes/movieroutes.js';
import {config} from 'dotenv';
import { connectDB, disconnectDB} from './config/db.js';

config();
connectDB();
const app = express();
const port = 5001;

app.use('/movies', Router);

app.listen(port, () => {
    console.log('server is runninf on port ' + port);
}) 

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