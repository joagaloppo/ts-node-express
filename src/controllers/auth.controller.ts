import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import catchAsync from '../utils/catchAsync';
import { authService, userService, tokenService } from '../services';

const register = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body);
  const tokens = await tokenService.generateAuthTokens(user.id);
  return res.status(201).json({ user, tokens });
});

const login = catchAsync(async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = await authService.loginWithCredentials(username, password);
  const tokens = await tokenService.generateAuthTokens(user.id);
  return res.status(200).json({ user, tokens });
});

const googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });

const googleAuthCallback = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('google', { session: false }, async (err, user) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (!user) return res.status(401).json({ message: 'Authentication failed' });
    const tokens = await tokenService.generateAuthTokens(user.id);
    return res.status(200).json({ user, tokens });
  })(req, res, next);
});

const logout = catchAsync(async (req: Request, res: Response) => {
  return res.status(200).json({ message: 'Logging out...' });
});

const authController = {
  register,
  login,
  googleAuth,
  googleAuthCallback,
  logout,
};

export default authController;
