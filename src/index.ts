import 'dotenv/config';
import express, { Application } from 'express';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const app: Application = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => res.json({ message: 'Hello World!' }));

app.post('/user', async (req, res) => {
  const { name, email } = req.body;
  const user = await prisma.user.create({
    data: {
      name,
      email,
    },
  });
  return res.json(user);
});

app.get('/users', async (req, res) => {
  const allItems = await prisma.user.findMany();
  res.json(allItems);
});

app.use((req, res) => res.status(404).json({ message: `Cannot ${req.method} ${req.path}` }));

export const server = app.listen(port, () => {
  console.log('\x1b[34m', `[server] listening at http://localhost:${port}`, '\x1b[0m');
});

export default app;
