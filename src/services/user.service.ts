import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const createUser = async (userBody: User) => {
  const hashedPassword = userBody.password && (await bcrypt.hash(userBody.password, 10));
  const user = await prisma.user.create({ data: { ...userBody, password: hashedPassword } });
  return user;
};

const getUsers = async () => {
  const users = await prisma.user.findMany();
  return users;
};

const getUserByEmail = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  return user;
};

const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  return user;
};

const getUserByGoogleId = async (googleId: string) => {
  const user = await prisma.user.findUnique({ where: { googleId } });
  return user;
};

const updateUserById = async (id: string, userBody: User) => {
  const user = await prisma.user.update({ where: { id }, data: { ...userBody } });
  return user;
};

const deleteUserById = async (id: string) => {
  const user = await prisma.user.delete({ where: { id } });
  return user;
};

const deleteAllUsers = async () => {
  const users = await prisma.user.deleteMany();
  return users;
};

const userService = {
  createUser,
  getUsers,
  getUserByEmail,
  getUserById,
  getUserByGoogleId,
  updateUserById,
  deleteUserById,
  deleteAllUsers,
};

export default userService;