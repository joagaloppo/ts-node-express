import bcrypt from 'bcryptjs';
import { userService } from './index';

const loginWithCredentials = async (email: string, password: string) => {
  const user = await userService.getUserByEmail(email);
  if (user && user.password && bcrypt.compareSync(password, user.password)) return user;
  throw new Error('Invalid email or password');
};

const loginWithGoogle = async (accessToken: string, refreshToken: string, profile: any, done: any) => {
  try {
    const user = await userService.getUserByGoogleId(profile.id);

    if (user) {
      return done(null, user);
    }
    const newUser = await userService.createUser({
      googleId: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
    });
    return done(null, newUser);
  } catch (error) {
    return done(error);
  }
};

const authService = {
  loginWithCredentials,
  loginWithGoogle,
};

export default authService;
