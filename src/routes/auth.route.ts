import express from 'express';
import { authController, userController } from '../controllers';
import isAuth from '../middlewares/auth.middleware';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleAuthCallback);
router.post('/logout', authController.logout);
router.post('/refresh-tokens', authController.refreshTokens);
router.post('/send-verification-email', isAuth, authController.sendVerificationEmail);
router.post('/verify-email', authController.verifyEmail);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/users', userController.getUsers);
router.delete('/users', userController.deleteAllUsers);
router.get('/secret', isAuth, (req, res) => res.json(req.user));

export default router;
