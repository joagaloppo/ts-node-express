import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import passport from './config/passport';
import limiter from './middlewares/limiter.middleware';
import morgan from './config/morgan';
import router from './routes';
import ApiError from './utils/ApiError';
import { errorConverter, errorHandler } from './middlewares/error.middleware';
import config from './config/config';

const app = express();

if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
  app.use('/auth', limiter);
}

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(cors({ origin: config.client_url }));
app.use(passport.initialize());
app.use(router);

app.use((req, _, next) => next(new ApiError(404, `Cannot ${req.method} ${req.path}`)));
app.use(errorConverter);
app.use(errorHandler);

export default app;
