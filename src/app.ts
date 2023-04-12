import express, { Application } from 'express';
import passport from './config/passport';
import router from './routes';
import ApiError from './utils/ApiError';
import { errorConverter, errorHandler } from './middlewares/error.middleware';

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(router);

router.use((req, res, next) => next(new ApiError(404, `Cannot ${req.method} ${req.path}`)));
app.use(errorConverter);
app.use(errorHandler);

export default app;
