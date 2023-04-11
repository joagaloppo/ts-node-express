import bcrypt from 'bcryptjs';
import { PrismaClient, TokenTypes } from '@prisma/client';
import { userService, tokenService } from './index';

const prisma = new PrismaClient();
const loginWithCredentials = async (email: string, password: string) => {
  const user = await userService.getUserByEmail(email);
  if (user && user.password && bcrypt.compareSync(password, user.password)) return user;
  throw new Error('Invalid email or password');
};

const loginWithGoogle = async (accessToken: string, refreshToken: string, profile: any, done: any) => {
  try {
    const user = await userService.getUserByGoogleId(profile.id);
    if (user) return done(null, user);
    const newUser = await userService.createUser({
      googleId: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
      emailVerified: true,
    });
    return done(null, newUser);
  } catch (error) {
    return done(error);
  }
};

const refreshAuth = async (refreshToken: string) => {
  const tokenDoc = await tokenService.verifyToken(refreshToken, TokenTypes.REFRESH);
  if (!tokenDoc.User) throw new Error('User not found');
  const user = await userService.getUserById(tokenDoc.User.id);
  if (!user) throw new Error('User not found');
  await prisma.token.delete({ where: { id: tokenDoc.id } });
  const tokens = await tokenService.generateAuthTokens(user.id);
  return tokens;
};

const logout = async (refreshToken: string) => {
  const refreshTokenDoc = await prisma.token.findUnique({ where: { token: refreshToken } });
  if (!refreshTokenDoc) throw new Error('Not found');
  await prisma.token.delete({ where: { id: refreshTokenDoc.id } });
};

const verifyEmail = async (token: string) => {
  const tokenDoc = await tokenService.verifyToken(token, TokenTypes.VERIFY_EMAIL);
  if (!tokenDoc.User) throw new Error('User not found');
  const user = await userService.getUserById(tokenDoc.User.id);
  if (!user) throw new Error('User not found');
  await prisma.token.delete({ where: { id: tokenDoc.id } });
  await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });
};

const authService = {
  loginWithCredentials,
  loginWithGoogle,
  refreshAuth,
  logout,
  verifyEmail,
};

export default authService;
