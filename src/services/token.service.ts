import jwt from 'jsonwebtoken';
import moment, { Moment } from 'moment';
import { User } from '@prisma/client';

const { JWT_SECRET } = process.env;
if (!JWT_SECRET) throw new Error('JWT secret is not defined');

const generateAccessToken = (user: User, expires: Moment, secret = JWT_SECRET) => {
  const payload = {
    sub: user.id,
    iat: moment().unix(),
    exp: expires.unix(),
  };
  return jwt.sign(payload, secret);
};

const tokenService = {
  generateAccessToken,
};

export default tokenService;
