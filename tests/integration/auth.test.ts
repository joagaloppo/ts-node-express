import { PrismaClient, User } from '@prisma/client';
import request from 'supertest';
import dayjs from 'dayjs';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';
import { randomUser, insertRandomUser } from '../fixtures/user.fixture';
import { generateAccessToken, generatePasswordToken, generateRefreshToken } from '../fixtures/token.fixture';

import app from '../../src/app';
import config from '../../src/config/config';
import { emailService, tokenService } from '../../src/services';

const prisma = new PrismaClient();

describe('Auth', () => {
  afterAll(async () => prisma.$disconnect());

  describe('POST /auth/register', () => {
    beforeEach(async () => {
      // eslint-disable-next-line
      jest.resetModules()
      jest.resetAllMocks();
      jest.spyOn(emailService.transport, 'sendMail').mockResolvedValue(true as any);
    });

    it('should return 201 and send reset password email to the user', async () => {
      const { name, email } = randomUser();
      const sendPasswordEmailSpy = jest.spyOn(emailService, 'sendPasswordEmail');
      await request(app).post('/auth/register').send({ email, name }).expect(201);
      expect(sendPasswordEmailSpy).toHaveBeenCalledWith(email, expect.any(String));
      const resetPasswordToken = sendPasswordEmailSpy.mock.calls[0][1];
      expect(await tokenService.verifyPasswordToken(resetPasswordToken)).toMatchObject({ email, name });
    });

    it('should return 400 if email is invalid', async () => {
      await request(app)
        .post('/auth/register')
        .send({ email: 'invalidEmail', name: faker.name.fullName() })
        .expect(400);
    });

    it('should return 400 if name length is less than 2 characters', async () => {
      await request(app).post('/auth/register').send({ email: faker.internet.email(), name: 'a' }).expect(400);
    });

    it('should return 400 if email is already used', async () => {
      const user = await insertRandomUser();
      await request(app).post('/auth/register').send({ email: user.email, name: faker.name.fullName() }).expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should return 200 if email and password match', async () => {
      const user = await insertRandomUser();
      const login = { email: user.email, password: 'password' };
      const res = await request(app).post('/auth/login').send(login).expect(200);
      expect(res.body.user).toMatchObject({
        id: expect.anything(),
        name: user.name,
        email: user.email,
      });
      expect(res.body.tokens).toEqual({
        access: { token: expect.any(String), expires: expect.anything() },
        refresh: { token: expect.any(String), expires: expect.anything() },
      });
    });

    it('should return 401 if there are no users with that email', async () => {
      const user = await await insertRandomUser();
      const login = { email: faker.internet.email(), password: user.password };
      await request(app).post('/auth/login').send(login).expect(401);
    });

    it('should return 401 if password is wrong', async () => {
      const user = await insertRandomUser();
      const login = { email: user.email, password: faker.internet.password() };
      await request(app).post('/auth/login').send(login).expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('should return 204 if refresh token is valid', async () => {
      const user = await insertRandomUser();

      const expires = dayjs().add(config.jwt.refreshExp, 'days');
      const refreshToken = tokenService.generateToken(user.id, expires);
      await tokenService.saveToken(refreshToken, user.id, expires);

      await request(app).post('/auth/logout').send({ refreshToken }).expect(204);
      const dbToken = await prisma.token.findUnique({ where: { token: refreshToken } });
      expect(dbToken).toBeNull();
    });

    it('should return 204 if refresh token is not valid', async () => {
      const user = await insertRandomUser();
      const expires = dayjs().add(config.jwt.refreshExp, 'days');
      const refreshToken = tokenService.generateToken(user.id, expires);
      await request(app).post('/auth/logout').send({ refreshToken }).expect(204);
    });

    it('should return 400 if refresh token is not provided', async () => {
      await request(app).post('/auth/logout').send().expect(400);
    });

    it('should return 400 if refresh token is not a string', async () => {
      await request(app).post('/auth/logout').send({ refreshToken: 123 }).expect(400);
    });
  });

  describe('POST /auth/refresh-tokens', () => {
    let user: User;
    let refreshToken: string;
    let expiredRefreshToken: string;
    let accessToken: string;

    beforeAll(async () => {
      user = await insertRandomUser();
      refreshToken = await generateRefreshToken(user.id);
      expiredRefreshToken = await generateRefreshToken(user.id, true);
      accessToken = await generateAccessToken(user.id);
      // eslint-disable-next-line
      await new Promise((r) => setTimeout(r, 1000));
    });

    it('should return 200 and new access and refresh tokens if refresh token is valid', async () => {
      const res = await request(app).post('/auth/refresh-tokens').send({ refreshToken }).expect(200);
      expect(res.body).toEqual({
        access: { token: expect.any(String), expires: expect.anything() },
        refresh: { token: expect.not.stringMatching(refreshToken), expires: expect.anything() },
      });
      await request(app).post('/auth/refresh-tokens').send({ refreshToken }).expect(404);
      const findToken = await prisma.token.findUnique({ where: { token: refreshToken } });
      expect(findToken).toBeNull();
    });

    it('should return 400 if refresh token is not provided', async () => {
      await request(app).post('/auth/refresh-tokens').send().expect(400);
    });

    it('should return 400 if refresh token is expired', async () => {
      await request(app).post('/auth/refresh-tokens').send({ refreshToken: expiredRefreshToken }).expect(400);
    });

    it('should return 404 if refresh token is an access token', async () => {
      await request(app).post('/auth/refresh-tokens').send({ refreshToken: accessToken }).expect(404);
    });

    it('should return 404 if refresh token is not valid', async () => {
      await request(app).post('/auth/refresh-tokens').send({ refreshToken: 'invalidToken' }).expect(404);
    });
  });

  describe('POST /auth/forgot-password', () => {
    beforeAll(async () => {
      jest.resetModules();
      jest.resetAllMocks();
      // eslint-disable-next-line
      jest.spyOn(emailService.transport, 'sendMail').mockResolvedValue(true as any);
    });

    it('should return 201 and send reset password email to the user', async () => {
      const { email, name } = await insertRandomUser();
      const sendPasswordEmailSpy = jest.spyOn(emailService, 'sendPasswordEmail');
      await request(app).post('/auth/forgot-password').send({ email }).expect(201);
      expect(sendPasswordEmailSpy).toHaveBeenCalledWith(email, expect.any(String));
      const resetPasswordToken = sendPasswordEmailSpy.mock.calls[0][1];
      expect(await tokenService.verifyPasswordToken(resetPasswordToken)).toMatchObject({ email, name });
    });

    it('should return 400 if email is missing', async () => {
      await request(app).post('/auth/forgot-password').send().expect(400);
    });

    it('should return 404 if email does not belong to any user', async () => {
      await request(app).post('/auth/forgot-password').send({ email: faker.internet.email() }).expect(404);
    });

    it('should return 500 if email service fails', async () => {
      const user = await insertRandomUser();
      jest.spyOn(emailService.transport, 'sendMail').mockRejectedValue(new Error('Email service failed'));
      await request(app).post('/auth/forgot-password').send({ email: user.email }).expect(500);
    });
  });

  describe('POST /auth/set-password', () => {
    it('should return 200 and reset the password', async () => {
      const user = await insertRandomUser();
      const token = await generatePasswordToken(user.name, user.email, user.password || '');
      await request(app).post('/auth/set-password').send({ token, password: 'newPassword' }).expect(200);
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      expect(await bcrypt.compare('newPassword', dbUser?.password as string)).toBeTruthy();
      expect(await bcrypt.compare('password', dbUser?.password as string)).toBeFalsy();
      await request(app).post('/auth/set-password').send({ token, password: 'newPassword' }).expect(400);
    });

    it('should return 400 if password is missing or is invalid', async () => {
      const user = await insertRandomUser();
      const token = await generatePasswordToken(user.name, user.email, user.password || '');
      await request(app).post('/auth/set-password').send({ token }).expect(400);
      await request(app).post('/auth/set-password').send({ token, password: 'short' }).expect(400);
      await request(app).post('/auth/set-password').send({ token, password: '12345' }).expect(400);
    });

    it('should return 400 if token is missing', async () => {
      await request(app).post('/auth/set-password').send({ password: 'newPassword' }).expect(400);
    });

    it('should return 500 if token is not a reset password token', async () => {
      const user = await insertRandomUser();
      const token = await generateAccessToken(user.id);
      await request(app).post('/auth/set-password').send({ token, password: 'newPassword' }).expect(500);
    });

    it('should return 500 if token is expired', async () => {
      const user = await insertRandomUser();
      const token = await generatePasswordToken(user.name, user.email, user.password || '', true);
      await request(app).post('/auth/set-password').send({ token, password: 'newPassword' }).expect(500);
    });

    it('should return 500 if token is using a different secret', async () => {
      const user = await insertRandomUser();
      const token = await generatePasswordToken(
        user.name,
        user.email,
        user.password || '',
        false,
        faker.random.alphaNumeric(32)
      );
      await request(app).post('/auth/set-password').send({ token, password: 'newPassword' }).expect(500);
    });
  });
});
