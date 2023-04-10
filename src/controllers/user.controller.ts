import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { userService } from '../services';

const getUsers = catchAsync(async (req: Request, res: Response) => {
  const users = await userService.getUsers();
  res.json({ users });
});

const userController = {
  getUsers,
};

export default userController;
