import { PrismaClient, User, Role } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface RandomUser {
  name: string;
  email: string;
  password: string;
}

const randomUser = (): RandomUser => ({
  name: faker.name.fullName(),
  email: faker.internet.email().toLowerCase(),
  password: 'password',
});

const insertUser = async (user: RandomUser, role?: Role) => {
  const hashedPassword = await bcrypt.hash(user.password, 10);
  return prisma.user.create({
    data: {
      name: user.name,
      email: user.email,
      password: hashedPassword,
      role,
    },
  });
};

const insertRandomUser = async (role?: Role): Promise<User> => {
  const user = randomUser();
  const dbUser = await insertUser(user, role);
  return dbUser;
};

export { randomUser, insertUser, insertRandomUser };
