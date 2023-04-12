import express, { Application } from 'express';
import cors from 'cors';
import passport from './config/passport';
import morgan from './config/morgan';
import router from './routes';
import ApiError from './utils/ApiError';
import { errorConverter, errorHandler } from './middlewares/error.middleware';
import config from './config/config';

const app: Application = express();

if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());
app.options('*', cors());

app.use(passport.initialize());
app.use(router);

router.use((req, res, next) => next(new ApiError(404, `Cannot ${req.method} ${req.path}`)));
app.use(errorConverter);
app.use(errorHandler);

export default app;
