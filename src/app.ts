import express, { Application } from 'express';
import passport from './config/passport';
import router from './routes/index';

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(router);

export default app;
