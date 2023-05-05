import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { userService } from '../services';
import ApiError from '../utils/ApiError';

const getUser = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ user });
});

const getUsers = catchAsync(async (req: Request, res: Response) => {
  const users = await userService.getUsers();
  res.json({ users });
});

const createUser = catchAsync(async (req: Request, res: Response) => {
  const exist = await userService.getUserByEmail(req.body.email);
  if (exist) throw new ApiError(400, 'Email already taken');
  const user = await userService.createUser(req.body);
  res.status(201).json({ user });
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
  const exist = await userService.getUserById(req.params.userId);
  if (!exist) throw new ApiError(404, 'User not found');
  const user = await userService.updateUserById(req.params.userId, req.body);
  res.json({ user });
});

const dropUser = catchAsync(async (req: Request, res: Response) => {
  const exist = await userService.getUserById(req.params.userId);
  if (!exist) throw new ApiError(404, 'User not found');
  await userService.dropUserById(req.params.userId);
  res.status(204).json({ message: 'User dropped' });
});

const dropAllUsers = catchAsync(async (req: Request, res: Response) => {
  await userService.dropAllUsers();
  res.json({ message: 'All users dropped' });
});

const userController = {
  getUser,
  getUsers,
  createUser,
  updateUser,
  dropUser,
  dropAllUsers,
};

export default userController;
