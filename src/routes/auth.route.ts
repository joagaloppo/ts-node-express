import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { authController, userController } from '../controllers';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/users', userController.getUsers);

router.get('/secret', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.json(req.user);
});

router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleAuthCallback);

export default router;
