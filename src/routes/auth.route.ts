import express from 'express';
import passport from 'passport';
import { authController, userController } from '../controllers';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleAuthCallback);
router.post('/logout', authController.logout);
router.get('/users', userController.getUsers);

router.get('/secret', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.json(req.user);
});

export default router;
