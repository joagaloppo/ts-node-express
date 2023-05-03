import { Request, Response } from 'express';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import catchAsync from '../utils/catchAsync';
import { authService, userService, tokenService, emailService } from '../services';

const register = catchAsync(async (req: Request, res: Response) => {
  const { name, email } = req.body;
  const userExists = await userService.getUserByEmail(email);
  if (userExists) throw new ApiError(400, 'This email is already being used');
  const token = await tokenService.generatePasswordToken(name, email);
  await emailService.sendPasswordEmail(email, token);
  return res.status(httpStatus.NO_CONTENT).send();
});

const setPassword = catchAsync(async (req: Request, res: Response) => {
  const { token, password } = req.body;
  const user = await authService.setPassword(token, password);
  // TO-DO: delete all refresh tokens of the user.
  const tokens = await tokenService.generateAuthTokens(user.id);
  return res.status(httpStatus.OK).json({ user, tokens });
});

const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await authService.loginWithCredentials(email, password);
  const tokens = await tokenService.generateAuthTokens(user.id);
  return res.status(httpStatus.OK).json({ user, tokens });
});

const google = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.body;
  const user = await authService.loginWithGoogle(token);
  const tokens = await tokenService.generateAuthTokens(user.id);
  return res.status(httpStatus.OK).json({ user, tokens });
});

const logout = catchAsync(async (req: Request, res: Response) => {
  await authService.logout(req.body.refreshToken);
  return res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req: Request, res: Response) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  return res.status(httpStatus.OK).json({ ...tokens });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await userService.getUserByEmail(email);
  if (!user) throw new ApiError(404, 'User with this email does not exist');
  const token = await tokenService.generatePasswordToken(user.name, user.email);
  await emailService.sendPasswordEmail(email, token);
  return res.status(httpStatus.NO_CONTENT).send();
});

const authController = {
  register,
  setPassword,
  login,
  google,
  logout,
  refreshTokens,
  forgotPassword,
};

export default authController;
