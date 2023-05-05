import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { userService, tokenService } from '.';
import ApiError from '../utils/ApiError';

const prisma = new PrismaClient();

const upsertUserPassword = async (token: string, password: string) => {
  const userToken = await tokenService.verifyPasswordToken(token);
  const userExists = await userService.getUserByEmail(userToken.email);
  if (userExists) {
    if (!userExists.password) return userService.updateUserById(userExists.id, { password });
    if (userExists.password !== userToken.password) throw new ApiError(400, 'Your password has already been set');
    if (bcrypt.compareSync(password, userExists.password)) throw new ApiError(400, 'You cannot use your old password');
    return userService.updateUserById(userExists.id, { password });
  }

  return userService.createUser({ name: userToken.name, email: userToken.email, password });
};

const loginWithCredentials = async (email: string, password: string) => {
  const user = await userService.getUserByEmail(email);
  if (!user) throw new ApiError(401, 'This email is not registered');
  if (!user.password) throw new ApiError(401, 'This account was created with Google');
  if (!bcrypt.compareSync(password, user.password)) throw new ApiError(401, 'The password is incorrect');
  return user;
};

const loginWithGoogle = async (token: string) => {
  const google = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  }).then((res) => res.json());
  if (!google || !google.email) throw new ApiError(400, 'Google login failed');
  const userExists = await userService.getUserByEmail(google.email);
  if (!userExists) return userService.createUser({ googleId: google.sub, email: google.email, name: google.name });
  if (!userExists.googleId) return userService.updateUserById(userExists.id, { googleId: google.sub });
  return userExists;
};

const logout = async (refreshToken: string) => {
  const refreshTokenDoc = await prisma.token.findUnique({ where: { token: refreshToken } });
  if (refreshTokenDoc) await prisma.token.delete({ where: { id: refreshTokenDoc.id } });
};

const refreshAuth = async (refreshToken: string) => {
  const tokenDoc = await tokenService.verifyToken(refreshToken);
  if (!tokenDoc.User) throw new ApiError(404, 'User not found');
  await prisma.token.delete({ where: { id: tokenDoc.id } });
  const tokens = await tokenService.generateAuthTokens(tokenDoc.User.id);
  return tokens;
};

const authService = {
  upsertUserPassword,
  loginWithCredentials,
  loginWithGoogle,
  logout,
  refreshAuth,
};

export default authService;
