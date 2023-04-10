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

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Server error' });
    }
    if (!user) {
      return res.status(401).json({ message: 'Authentication failed' });
    }
    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
    return res.json({ user, token });
  })(req, res, next);
});

export default router;
