import bcrypt from 'bcryptjs';
import { userService } from './index';

const loginWithCredentials = async (email: string, password: string) => {
  const user = await userService.getUserByEmail(email);
  if (user && user.password && bcrypt.compareSync(password, user.password)) return user;
  throw new Error('Invalid email or password');
};

const authService = {
  loginWithCredentials,
};

export default authService;
