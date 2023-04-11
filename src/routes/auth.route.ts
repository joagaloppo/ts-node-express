import express from 'express';
import { authController, userController } from '../controllers';
import authMiddleware from '../middlewares/auth.middleware';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleAuthCallback);
router.post('/refresh-tokens', authController.refreshTokens);
router.post('/logout', authController.logout);
router.post('/send-verification-email', authMiddleware, authController.sendVerificationEmail);
router.post('/verify-email', authController.verifyEmail);
router.get('/users', userController.getUsers);

router.get('/secret', authMiddleware, (req, res) => res.json(req.user));

export default router;
