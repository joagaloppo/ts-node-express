import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', (req, res) => res.json({ message: 'Hello World!' }));

router.post('/user', async (req, res) => {
  const { name, email } = req.body;
  const user = await prisma.user.create({
    data: {
      name,
      email,
    },
  });
  return res.json(user);
});

router.get('/users', async (req, res) => {
  const allItems = await prisma.user.findMany();
  res.json(allItems);
});

export default router;
