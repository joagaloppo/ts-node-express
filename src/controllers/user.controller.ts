import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { userService } from '../services';

const getUsers = catchAsync(async (req: Request, res: Response) => {
  const users = await userService.getUsers();
  res.json({ users });
});

const deleteAllUsers = catchAsync(async (req: Request, res: Response) => {
  await userService.deleteAllUsers();
  res.json({ message: 'All users dropped' });
});

const userController = {
  getUsers,
  deleteAllUsers,
};

export default userController;
