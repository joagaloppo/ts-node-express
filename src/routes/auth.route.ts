import express from 'express';
import isAuth from '../middlewares/auth.middleware';
import validate from '../middlewares/validate.middleware';
import { authValidation } from '../validations';
import { authController, userController } from '../controllers';

const router = express.Router();

// Credentials auth
router.post('/register', validate(authValidation.register), authController.register);
router.post('/login', validate(authValidation.login), authController.login);

// Google auth
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleAuthCallback);

// Tokens management
router.post('/logout', validate(authValidation.logout), authController.logout);
router.post('/refresh-tokens', validate(authValidation.refreshTokens), authController.refreshTokens);

// Email verification
router.post('/send-verification-email', isAuth, authController.sendVerificationEmail);
router.post('/verify-email', validate(authValidation.verifyEmail), authController.verifyEmail);

// Password reset
router.post('/forgot-password', validate(authValidation.forgotPassword), authController.forgotPassword);
router.post('/reset-password', validate(authValidation.resetPassword), authController.resetPassword);

// Users management
router.get('/users', userController.getUsers);
router.delete('/users', userController.deleteAllUsers);
router.get('/secret', isAuth, (req, res) => res.json(req.user));

export default router;
