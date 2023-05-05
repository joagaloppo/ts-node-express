import express from 'express';
import validate from '../middlewares/validate.middleware';
import { authValidation } from '../validations';
import { authController } from '../controllers';

const router = express.Router();

router.post('/register', validate(authValidation.register), authController.register);
router.post('/login', validate(authValidation.login), authController.login);
router.post('/google', validate(authValidation.google), authController.google);
router.post('/logout', validate(authValidation.logout), authController.logout);
router.post('/set-password', validate(authValidation.setPassword), authController.setPassword);
router.post('/forgot-password', validate(authValidation.forgotPassword), authController.forgotPassword);
router.post('/refresh-tokens', validate(authValidation.refreshTokens), authController.refreshTokens);

export default router;
