import dayjs from 'dayjs';
import { PrismaClient, TokenTypes } from '@prisma/client';
import jwt from 'jsonwebtoken';
import tokenService from '../../src/services/token.service';
import config from '../../src/config/config';

const Prisma = new PrismaClient();

const expire = {
  [TokenTypes.ACCESS]: [config.jwt.accessExpirationMinutes, 'minutes'],
  [TokenTypes.REFRESH]: [config.jwt.refreshExpirationDays, 'days'],
  [TokenTypes.RESET_PASSWORD]: [config.jwt.resetPasswordExpirationMinutes, 'minutes'],
  [TokenTypes.VERIFY_EMAIL]: [config.jwt.verifyEmailExpirationMinutes, 'minutes'],
};

const generateValidToken = async (userId: string, type: TokenTypes, expired = false, secret = config.jwt.secret) => {
  const expires = expired ? dayjs().subtract(1, 'minute') : dayjs().add(...expire[type]);
  const token = jwt.sign({ sub: userId, iat: dayjs().unix(), exp: expires.unix(), type }, secret);
  if (type !== TokenTypes.ACCESS)
    await Prisma.token.create({
      data: { token, type, blacklisted: false, User: { connect: { id: userId } }, expiresAt: expires.toDate() },
    });
  return token;
};

export default generateValidToken;
