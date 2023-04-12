import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { User } from '@prisma/client';
import catchAsync from '../utils/catchAsync';
import { authService, userService, tokenService, emailService } from '../services';
import ApiError from '../utils/ApiError';

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

const refreshTokens = catchAsync(async (req: Request, res: Response) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  return res.status(200).json({ ...tokens });
});

const logout = catchAsync(async (req: Request, res: Response) => {
  await authService.logout(req.body.refreshToken);
  return res.status(204).send();
});

const sendVerificationEmail = catchAsync(async (req: Request, res: Response) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user as User);
  await emailService.sendVerificationEmail((req.user as User).email, verifyEmailToken);
  return res.status(204).send();
});

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.query;
  if (!token || typeof token !== 'string') throw new ApiError(400, 'Invalid token');
  await authService.verifyEmail(token);
  return res.status(204).send();
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await userService.getUserByEmail(email);
  if (!user) throw new ApiError(404, 'User not found');
  const resetPasswordToken = await tokenService.generateResetPasswordToken(user);
  await emailService.sendResetPasswordEmail(email, resetPasswordToken);
  return res.status(204).send();
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { token, password } = req.body;
  // TO-DO: delete all refresh tokens of the user
  if (!token || typeof token !== 'string') throw new ApiError(400, 'Invalid token');
  await authService.resetPassword(token, password);
  return res.status(204).send();
});

const authController = {
  register,
  login,
  googleAuth,
  googleAuthCallback,
  refreshTokens,
  logout,
  sendVerificationEmail,
  verifyEmail,
  forgotPassword,
  resetPassword,
};

export default authController;
