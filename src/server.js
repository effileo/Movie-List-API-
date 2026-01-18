import express from 'express';
import Router from './routes/movieroutes.js';

const app = express();
const port = 5001;

app.use('/movies', Router);

app.listen(port, () => {
    console.log('server is runninf on port ' + port);
})