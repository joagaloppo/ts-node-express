import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const getUsers = async () => {
  const users = await prisma.user.findMany();
  return users;
};

const getUserById = async (id: number) => {
  const user = await prisma.user.findUnique({ where: { id } });
  return user;
};

const getUserByEmail = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  return user;
};

const createUser = async (userBody: any) => {
  const newUser = { ...userBody };
  if (newUser.password) newUser.password = await bcrypt.hash(newUser.password, 10);
  const user = await prisma.user.create({ data: { ...newUser } });
  return user;
};

const updateUserById = async (id: number, userBody: any) => {
  const data = { ...userBody };
  if (data.password) data.password = await bcrypt.hash(userBody.password, 10);
  const user = await prisma.user.update({ where: { id }, data: { ...data } });
  return user;
};

const dropUserById = async (id: number) => {
  const user = await prisma.user.delete({ where: { id } });
  return user;
};

const dropAllUsers = async () => {
  const users = await prisma.user.deleteMany();
  return users;
};

const userService = {
  getUsers,
  getUserById,
  getUserByEmail,
  createUser,
  updateUserById,
  dropUserById,
  dropAllUsers,
};

export default userService;
