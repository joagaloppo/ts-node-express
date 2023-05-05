import dayjs from 'dayjs';
import jwt from 'jsonwebtoken';
import config from '../../src/config/config';
import { tokenService } from '../../src/services';

const generateAccessToken = async (userId: number, expired = false, secret = config.jwt.secret) => {
  const expires = expired ? dayjs().subtract(5, 'minutes') : dayjs().add(config.jwt.accessExp, 'minutes');
  const token = jwt.sign({ sub: userId, iat: dayjs().unix(), exp: expires.unix() }, secret);
  return token;
};

const generateRefreshToken = async (userId: number, expired = false, secret = config.jwt.secret) => {
  const expires = expired ? dayjs().subtract(5, 'minutes') : dayjs().add(config.jwt.refreshExp, 'days');
  const token = jwt.sign({ sub: userId, iat: dayjs().unix(), exp: expires.unix() }, secret);
  await tokenService.saveToken(token, userId, expires);
  return token;
};

const generatePasswordToken = async (
  name: string,
  email: string,
  password: string,
  expired = false,
  secret = config.jwt.secret
) => {
  const expires = expired ? dayjs().subtract(5, 'minutes') : dayjs().add(config.jwt.passwordExp, 'minutes');
  const payload = { name, email, password, iat: dayjs().unix(), exp: expires.unix() };
  return jwt.sign(payload, secret);
};

export { generateAccessToken, generateRefreshToken, generatePasswordToken };
