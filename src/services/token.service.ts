import jwt from 'jsonwebtoken';
import moment, { Moment } from 'moment';
import { PrismaClient, TokenTypes, User } from '@prisma/client';
import ApiError from '../utils/ApiError';
import config from '../config/config';

const prisma = new PrismaClient();

const generateToken = (userId: string, expires: Moment, type: TokenTypes, secret = config.jwt.secret) => {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
  };
  return jwt.sign(payload, secret);
};

const saveToken = async (token: string, userId: string, expires: Moment, type: TokenTypes, blacklisted = false) => {
  const tokenDoc = await prisma.token.create({
    data: {
      token,
      type,
      blacklisted,
      User: { connect: { id: userId } },
      expiresAt: expires.toDate(),
    },
  });
  return tokenDoc;
};

const verifyToken = async (token: string, type: TokenTypes) => {
  const payload = jwt.verify(token, config.jwt.secret);
  const tokenDoc = await prisma.token.findUnique({ where: { token }, include: { User: true } });
  if (!tokenDoc) throw new ApiError(404, 'Token not found');
  if (tokenDoc.type !== type) throw new ApiError(400, 'Token is invalid');
  if (tokenDoc.blacklisted) throw new ApiError(400, 'Token is blacklisted');
  if (moment().isAfter(moment(tokenDoc.expiresAt))) throw new ApiError(400, 'Token has expired');
  if (tokenDoc.User && tokenDoc.User.id !== payload.sub) throw new ApiError(400, 'Token is invalid');
  return tokenDoc;
};

const generateAuthTokens = async (userId: string) => {
  const accessTokenExpires = moment().add(config.jwt.accessExpiratonMinutes, 'minutes');
  const accessToken = generateToken(userId, accessTokenExpires, TokenTypes.ACCESS);

  const refreshTokenExpires = moment().add(config.jwt.refreshExpiratonDays, 'days');
  const refreshToken = generateToken(userId, refreshTokenExpires, TokenTypes.REFRESH);
  await saveToken(refreshToken, userId, refreshTokenExpires, TokenTypes.REFRESH);

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

const generateVerifyEmailToken = async (user: User) => {
  const verifyEmailTokenExpires = moment().add(config.jwt.verifyEmailExpiratonMinutes, 'minutes');
  const verifyEmailToken = generateToken(user.id, verifyEmailTokenExpires, TokenTypes.VERIFY_EMAIL);
  await saveToken(verifyEmailToken, user.id, verifyEmailTokenExpires, TokenTypes.VERIFY_EMAIL);
  return verifyEmailToken;
};

const generateResetPasswordToken = async (user: User) => {
  const resetPasswordTokenExpires = moment().add(config.jwt.resetPasswordExpiratonMinutes, 'minutes');
  const resetPasswordToken = generateToken(user.id, resetPasswordTokenExpires, TokenTypes.RESET_PASSWORD);
  await saveToken(resetPasswordToken, user.id, resetPasswordTokenExpires, TokenTypes.RESET_PASSWORD);
  return resetPasswordToken;
};

const tokenService = {
  generateToken,
  saveToken,
  verifyToken,
  generateAuthTokens,
  generateVerifyEmailToken,
  generateResetPasswordToken,
};

export default tokenService;
