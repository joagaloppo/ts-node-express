import 'dotenv/config';
import express, { Application } from 'express';
import router from './routes/index';

const app: Application = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', router);
app.use((req, res) => res.status(404).json({ message: `Cannot ${req.method} ${req.path}` }));

export const server = app.listen(port, () => {
  console.log(`[server] listening at http://localhost:${port}`);
  // console.log(`[server] environment: ${process.env.NODE_ENV}`);
});

export default app;
