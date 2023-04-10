import express from 'express';
import authRouter from './auth.route';

const router = express.Router();

router.use('/auth', authRouter);
router.use((req, res) => res.status(404).json({ message: `Cannot ${req.method} ${req.path}` }));

export default router;
