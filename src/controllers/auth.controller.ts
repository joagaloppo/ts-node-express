import { Request, Response } from 'express';
import moment from 'moment';
import catchAsync from '../utils/catchAsync';
import { authService, userService, tokenService } from '../services';

const register = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body);
  const token = await tokenService.generateAccessToken(user, moment().add(30, 'minutes'));
  res.status(201).json({ user, token });
});

const login = catchAsync(async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = await authService.loginWithCredentials(username, password);
  const token = await tokenService.generateAccessToken(user, moment().add(30, 'minutes'));
  res.json({ user, token });
});

const logout = catchAsync(async (req: Request, res: Response) => {
  return res.status(200).json({ message: 'Logging out...' });
});

const authController = {
  register,
  login,
  logout,
};

export default authController;
