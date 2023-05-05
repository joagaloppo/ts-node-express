import { Request, Response } from 'express';
import { User } from '@prisma/client';
import catchAsync from '../utils/catchAsync';
import { userService } from '../services';
import ApiError from '../utils/ApiError';

const getUser = catchAsync(async (req: Request, res: Response) => {
  const id = Number(req.params.userId);
  const user = await userService.getUserById(id);
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

const updateMe = catchAsync(async (req: Request, res: Response) => {
  const id = Number((req.user as User).id);
  const user = await userService.updateUserById(id, req.body);
  res.status(200).json({ user });
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
  const id = Number(req.params.userId);
  if (!id) throw new ApiError(400, 'User id is required');
  const exist = await userService.getUserById(id);
  if (!exist) throw new ApiError(404, 'User not found');
  const user = await userService.updateUserById(id, req.body);
  res.status(200).json({ user });
});

const dropMe = catchAsync(async (req: Request, res: Response) => {
  const id = Number((req.user as User).id);
  await userService.dropUserById(id);
  res.status(204).json({ message: 'User dropped' });
});

const dropUser = catchAsync(async (req: Request, res: Response) => {
  const id = Number(req.params.userId);
  const exist = await userService.getUserById(id);
  if (!exist) throw new ApiError(404, 'User not found');
  await userService.dropUserById(id);
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
  updateMe,
  updateUser,
  dropMe,
  dropUser,
  dropAllUsers,
};

export default userController;
