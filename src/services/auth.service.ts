import bcrypt from 'bcryptjs';
import { PrismaClient, TokenTypes } from '@prisma/client';
import { VerifyCallback } from 'passport-google-oauth20';
import { Profile } from 'passport';
import { userService, tokenService } from '.';
import ApiError from '../utils/ApiError';

const prisma = new PrismaClient();
const loginWithCredentials = async (email: string, password: string) => {
  const user = await userService.getUserByEmail(email);
  if (user && user.password && bcrypt.compareSync(password, user.password)) return user;
  throw new ApiError(401, 'Incorrect email or password');
};

const loginWithGoogle = async (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
  try {
    const user = await userService.getUserByGoogleId(profile.id);
    if (user) return done(null, user);
    const newUser = await userService.createUser({
      googleId: profile.id,
      email: profile.emails?.[0].value,
      name: profile.displayName,
      emailVerified: true,
    });
    return done(null, newUser);
  } catch (error) {
    return done(error as Error);
  }
};

const refreshAuth = async (refreshToken: string) => {
  const tokenDoc = await tokenService.verifyToken(refreshToken, TokenTypes.REFRESH);
  if (!tokenDoc.User) throw new ApiError(404, 'User not found');
  const user = await userService.getUserById(tokenDoc.User.id);
  if (!user) throw new ApiError(404, 'User not found');
  await prisma.token.delete({ where: { id: tokenDoc.id } });
  const tokens = await tokenService.generateAuthTokens(user.id);
  return tokens;
};

const logout = async (refreshToken: string) => {
  const refreshTokenDoc = await prisma.token.findUnique({ where: { token: refreshToken } });
  if (!refreshTokenDoc) throw new ApiError(404, 'Refresh token not found');
  await prisma.token.delete({ where: { id: refreshTokenDoc.id } });
};

const verifyEmail = async (token: string) => {
  const tokenDoc = await tokenService.verifyToken(token, TokenTypes.VERIFY_EMAIL);
  if (!tokenDoc.User) throw new ApiError(404, 'User not found');
  const user = await userService.getUserById(tokenDoc.User.id);
  if (!user) throw new ApiError(404, 'User not found');
  await prisma.token.delete({ where: { id: tokenDoc.id } });
  await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });
};

const resetPassword = async (token: string, password: string) => {
  const tokenDoc = await tokenService.verifyToken(token, TokenTypes.RESET_PASSWORD);
  if (!tokenDoc.User) throw new ApiError(404, 'User not found');
  const user = await userService.getUserById(tokenDoc.User.id);
  if (!user) throw new ApiError(404, 'User not found');

  const refreshTokens = await prisma.token.findMany({ where: { type: TokenTypes.REFRESH } });
  await prisma.token.deleteMany({ where: { id: { in: refreshTokens.map((t) => t.id) } } });

  await prisma.token.delete({ where: { id: tokenDoc.id } });
  const hashedPassword = bcrypt.hashSync(password, 10);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword } });
};

const authService = {
  loginWithCredentials,
  loginWithGoogle,
  refreshAuth,
  logout,
  verifyEmail,
  resetPassword,
};

export default authService;
