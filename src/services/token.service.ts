import jwt from 'jsonwebtoken';
import moment, { Moment } from 'moment';
import { PrismaClient } from '@prisma/client';
import ApiError from '../utils/ApiError';
import config from '../config/config';

const prisma = new PrismaClient();

const generateToken = (userId: number, expires: Moment, secret = config.jwt.secret) => {
  const payload = { sub: userId, iat: moment().unix(), exp: expires.unix() };
  return jwt.sign(payload, secret);
};

const saveToken = async (token: string, userId: number, expires: Moment) => {
  const tokenDoc = await prisma.token.create({
    data: { token, User: { connect: { id: userId } }, expiresAt: expires.toDate() },
  });
  return tokenDoc;
};

const verifyToken = async (token: string) => {
  const tokenDoc = await prisma.token.findUnique({ where: { token }, include: { User: true } });
  if (!tokenDoc) throw new ApiError(404, 'Token not found');
  if (moment().isAfter(moment(tokenDoc.expiresAt))) throw new ApiError(400, 'Token has expired');
  return tokenDoc;
};

const generateAuthTokens = async (userId: number) => {
  const accessTokenExpires = moment().add(config.jwt.accessExp, 'minutes');
  const accessToken = generateToken(userId, accessTokenExpires);

  const refreshTokenExpires = moment().add(config.jwt.refreshExp, 'days');
  const refreshToken = generateToken(userId, refreshTokenExpires);
  await saveToken(refreshToken, userId, refreshTokenExpires);

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};

const generatePasswordToken = async (name: string, email: string, password: string) => {
  const exp = moment().add(config.jwt.passwordExp, 'minutes').unix();
  const payload = { name, email, password, iat: moment().unix(), exp };
  return jwt.sign(payload, config.jwt.secret);
};

const verifyPasswordToken = async (token: string) => {
  const user: any = jwt.verify(token, config.jwt.secret);
  if (!user) throw new ApiError(400, 'Token is invalid');
  if (moment().isAfter(moment.unix(user.exp))) throw new ApiError(400, 'Token has expired');
  return user;
};

const deleteUserTokens = async (userId: number) => {
  await prisma.token.deleteMany({ where: { userId } });
};

const tokenService = {
  generateToken,
  saveToken,
  verifyToken,
  verifyPasswordToken,
  generateAuthTokens,
  generatePasswordToken,
  deleteUserTokens,
};

export default tokenService;
