import prisma from '../prisma';

const getUsers = async () => prisma.user.findMany();
const getUserById = async (id: number) => prisma.user.findUnique({ where: { id } });
const getUserByEmail = async (email: string) => prisma.user.findUnique({ where: { email } });
const createUser = async (body: any) => prisma.user.create({ data: body });
const updateUserById = async (id: number, body: any) => prisma.user.update({ where: { id }, data: body });
const dropUserById = async (id: number) => prisma.user.delete({ where: { id } });
const dropAllUsers = async () => prisma.user.deleteMany();

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
