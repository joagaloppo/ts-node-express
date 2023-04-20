import { User } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import catchAsync from '../utils/catchAsync';
import config from '../config/config';
import { authService, userService, tokenService, emailService } from '../services';

const register = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body);
  const tokens = await tokenService.generateAuthTokens(user.id);
  return res.status(httpStatus.CREATED).json({ user, tokens });
});

const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await authService.loginWithCredentials(email, password);
  const tokens = await tokenService.generateAuthTokens(user.id);
  return res.status(httpStatus.OK).json({ user, tokens });
});

const googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });

const googleAuthCallback = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('google', { session: false }, async (err, user) => {
    if (err) return res.status(httpStatus.BAD_REQUEST).json({ message: err.message });
    if (!user) return res.status(httpStatus.BAD_REQUEST).json({ message: 'Something went wrong' });
    const tokens = await tokenService.generateAuthTokens(user.id);
    return res.redirect(`${config.google.redirectUrl}?access=${tokens.access.token}&refresh=${tokens.refresh.token}`);
  })(req, res, next);
});

const refreshTokens = catchAsync(async (req: Request, res: Response) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  return res.status(httpStatus.OK).json({ ...tokens });
});

const logout = catchAsync(async (req: Request, res: Response) => {
  await authService.logout(req.body.refreshToken);
  return res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req: Request, res: Response) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user as User);
  await emailService.sendVerificationEmail((req.user as User).email, verifyEmailToken);
  return res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.query;
  if (!token || typeof token !== 'string') throw new ApiError(400, 'Invalid token');
  await authService.verifyEmail(token);
  return res.status(httpStatus.NO_CONTENT).send();
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await userService.getUserByEmail(email);
  if (!user) throw new ApiError(404, 'User not found');
  const resetPasswordToken = await tokenService.generateResetPasswordToken(user);
  await emailService.sendResetPasswordEmail(email, resetPasswordToken);
  return res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.query;
  const { password } = req.body;
  // TO-DO: delete all refresh tokens of the user
  if (!token || typeof token !== 'string') throw new ApiError(400, 'Invalid token');
  await authService.resetPassword(token, password);
  return res.status(httpStatus.NO_CONTENT).send();
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
