import bcrypt from 'bcryptjs';
import { PrismaClient, TokenTypes } from '@prisma/client';
import { userService, tokenService } from '.';
import ApiError from '../utils/ApiError';

const prisma = new PrismaClient();

const loginWithCredentials = async (email: string, password: string) => {
  const user = await userService.getUserByEmail(email);
  if (user && user.password && bcrypt.compareSync(password, user.password)) return user;
  throw new ApiError(401, 'Incorrect email or password');
};

const loginWithGoogle = async (token: string) => {
  const google = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  }).then((res) => res.json());

  if (!google) throw new ApiError(400, 'Google login failed');
  if (!google.email) throw new ApiError(400, 'Email not found');

  const existingUser = await userService.getUserByEmail(google.email);

  if (!existingUser)
    return userService.createUser({
      googleId: google.sub,
      email: google.email,
      name: google.name,
      emailVerified: true,
    });

  if (!existingUser.googleId)
    await prisma.user.update({ where: { id: existingUser.id }, data: { googleId: google.sub } });
  if (!existingUser.emailVerified)
    await prisma.user.update({ where: { id: existingUser.id }, data: { emailVerified: true } });

  return existingUser;
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
