import jwt from 'jsonwebtoken';
import dayjs from 'dayjs';
import prisma from '../prisma';
import ApiError from '../utils/ApiError';
import config from '../config/config';

const generateToken = (userId: number, expires: dayjs.Dayjs, secret = config.jwt.secret) => {
  const payload = { sub: userId, iat: dayjs().unix(), exp: expires.unix() };
  return jwt.sign(payload, secret);
};

const saveToken = async (token: string, userId: number, expires: dayjs.Dayjs) => {
  const tokenDoc = await prisma.token.create({
    data: { token, User: { connect: { id: userId } }, expiresAt: expires.toDate() },
  });
  return tokenDoc;
};

const verifyToken = async (token: string) => {
  const tokenDoc = await prisma.token.findUnique({ where: { token }, include: { User: true } });
  if (!tokenDoc) throw new ApiError(404, 'Token not found');
  if (dayjs().isAfter(dayjs(tokenDoc.expiresAt))) throw new ApiError(400, 'Token has expired');
  return tokenDoc;
};

const generateAuthTokens = async (userId: number) => {
  const accessTokenExpires = dayjs().add(config.jwt.accessExp, 'minutes');
  const accessToken = generateToken(userId, accessTokenExpires);

  const refreshTokenExpires = dayjs().add(config.jwt.refreshExp, 'days');
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
  const exp = dayjs().add(config.jwt.passwordExp, 'minutes').unix();
  const payload = { name, email, password, iat: dayjs().unix(), exp };
  return jwt.sign(payload, config.jwt.secret);
};

const verifyPasswordToken = async (token: string) => {
  const user: any = jwt.verify(token, config.jwt.secret);
  if (!user) throw new ApiError(400, 'Token is invalid');
  if (dayjs().isAfter(dayjs.unix(user.exp))) throw new ApiError(400, 'Token has expired');
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
