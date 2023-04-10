import 'dotenv/config';
import express, { Application } from 'express';
import passport from './config/passport';
import router from './routes/index';

const app: Application = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(router);

export const server = app.listen(port, () => {
  console.log(`[server] listening at http://localhost:${port}`);
  // console.log(`[server] environment: ${process.env.NODE_ENV}`);
});

export default app;
