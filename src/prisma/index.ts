import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import ApiError from '../utils/ApiError';

const prisma = new PrismaClient();

prisma.$use(async (params, next) => {
  if (params.model === 'User' && ['create', 'update'].includes(params.action)) {
    if (params.args.data.password) {
      const hashedPassword = await bcrypt.hash(params.args.data.password, 8);
      // eslint-disable-next-line no-param-reassign
      params.args.data.password = hashedPassword;
    }
  }

  return next(params);
});

prisma.$use(async (params, next) => {
  if (params.model === 'User' && ['create', 'update'].includes(params.action)) {
    if (params.args.data.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: params.args.data.email },
      });

      if (
        existingUser &&
        (params.action === 'create' || (params.action === 'update' && params.args.where.id !== existingUser.id))
      ) {
        throw new ApiError(400, 'Email is already in use');
      }
    }
  }

  return next(params);
});

export default prisma;
