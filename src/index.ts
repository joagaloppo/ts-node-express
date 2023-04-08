import 'dotenv/config';
import express, { Application } from 'express';

const app: Application = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res) => res.status(404).json({ message: `Cannot ${req.method} ${req.path}` }));

app.listen(port, () => {
  console.log('\x1b[34m', `[server] listening at http://localhost:${port}`, '\x1b[0m');
});

export default app;
