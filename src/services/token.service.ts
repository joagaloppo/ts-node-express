import jwt from 'jsonwebtoken';
import moment, { Moment } from 'moment';
import { PrismaClient, TokenTypes, User } from '@prisma/client';

const prisma = new PrismaClient();
const { JWT_SECRET } = process.env;
if (!JWT_SECRET) throw new Error('JWT secret is not defined');

const generateToken = (userId: string, expires: Moment, type: TokenTypes, secret = JWT_SECRET) => {
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
  const payload = jwt.verify(token, JWT_SECRET);
  const tokenDoc = await prisma.token.findUnique({ where: { token }, include: { User: true } });
  if (!tokenDoc) throw new Error('Token not found');
  if (tokenDoc.type !== type) throw new Error('Token is invalid');
  if (tokenDoc.blacklisted) throw new Error('Token is blacklisted');
  if (moment().isAfter(moment(tokenDoc.expiresAt))) throw new Error('Token has expired');
  if (tokenDoc.User && tokenDoc.User.id !== payload.sub) throw new Error('Token is invalid');
  return tokenDoc;
};

const generateAuthTokens = async (userId: string) => {
  const accessTokenExpires = moment().add(30, 'minutes');
  const accessToken = generateToken(userId, accessTokenExpires, TokenTypes.ACCESS);

  const refreshTokenExpires = moment().add(30, 'days');
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
  const verifyEmailTokenExpires = moment().add(10, 'minutes');
  const verifyEmailToken = generateToken(user.id, verifyEmailTokenExpires, TokenTypes.VERIFY_EMAIL);
  await saveToken(verifyEmailToken, user.id, verifyEmailTokenExpires, TokenTypes.VERIFY_EMAIL);
  return verifyEmailToken;
};

const tokenService = {
  generateToken,
  saveToken,
  verifyToken,
  generateAuthTokens,
  generateVerifyEmailToken,
};

export default tokenService;
