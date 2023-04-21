import { PrismaClient, TokenTypes } from '@prisma/client';
import request from 'supertest';
import { faker } from '@faker-js/faker';
import moment from 'moment';
import jwt from 'jsonwebtoken';

import app from '../../src/app';
import config from '../../src/config/config';
import { emailService, tokenService } from '../../src/services';

const prisma = new PrismaClient();

interface registerUser {
  name: string;
  email: string;
  password: string;
}

describe('Auth', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /auth/register', () => {
    let newUser: registerUser;
    beforeAll(() => {
      newUser = {
        name: faker.name.fullName(),
        email: faker.internet.email().toLowerCase(),
        password: faker.random.alphaNumeric(8),
      };
    });

    it('should return 201 and create user if data is ok', async () => {
      const res = await request(app).post('/auth/register').send(newUser).expect(201);
      expect(res.body.user).toMatchObject({
        id: expect.any(String),
        name: newUser.name,
        email: newUser.email,
        emailVerified: false,
        googleId: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      expect(res.body.tokens).toEqual({
        access: { token: expect.any(String), expires: expect.anything() },
        refresh: { token: expect.any(String), expires: expect.anything() },
      });

      const dbUser = await prisma.user.findUnique({ where: { id: res.body.user.id } });
      expect(dbUser).toBeDefined();
      expect(dbUser?.password).not.toBe(newUser.password);
      expect(dbUser).toMatchObject({ name: newUser.name, email: newUser.email, emailVerified: false });
    });

    it('should return 400 error if email is invalid', async () => {
      newUser.email = 'invalid-email';
      const res = await request(app).post('/auth/register').send(newUser);
      expect(res.status).toBe(400);
    });

    it('should return 400 error if email is already used', async () => {
      await prisma.user.create({ data: { name: newUser.name, email: newUser.email, password: newUser.password } });
      const res = await request(app).post('/auth/register').send(newUser);
      expect(res.status).toBe(400);
    });

    it('should return 400 error if password length is less than 6 characters', async () => {
      newUser.password = 'short';
      const res = await request(app).post('/auth/register').send(newUser);
      expect(res.status).toBe(400);
    });

    it('should return 400 error if name length is less than 2 characters', async () => {
      newUser.name = 'a';
      const res = await request(app).post('/auth/register').send(newUser);
      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    let newUser: registerUser;
    let login: { email: string; password: string };
    beforeAll(async () => {
      newUser = {
        name: faker.name.fullName(),
        email: faker.internet.email().toLowerCase(),
        password: faker.random.alphaNumeric(8),
      };
      await request(app).post('/auth/register').send(newUser);
      login = { email: newUser.email, password: newUser.password };
    });

    it('should return 200 and login user if email and password match', async () => {
      const res = await request(app).post('/auth/login').send(login).expect(200);
      expect(res.body.user).toMatchObject({
        id: expect.anything(),
        name: newUser.name,
        email: newUser.email,
        emailVerified: false,
      });
      expect(res.body.tokens).toEqual({
        access: { token: expect.any(String), expires: expect.anything() },
        refresh: { token: expect.any(String), expires: expect.anything() },
      });
    });

    it('should return 401 error if there are no users with that email', async () => {
      login.email = faker.internet.email().toLowerCase();
      await request(app).post('/auth/login').send(login).expect(401);
    });

    it('should return 401 error if password is wrong', async () => {
      login.password = 'wrongPassword1';
      await request(app).post('/auth/login').send(login).expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    let newUser: registerUser;
    let refreshToken: string;
    beforeAll(async () => {
      newUser = {
        name: faker.name.fullName(),
        email: faker.internet.email().toLowerCase(),
        password: faker.random.alphaNumeric(8),
      };
      const register = await request(app).post('/auth/register').send(newUser);
      refreshToken = register.body.tokens.refresh.token;
    });

    it('should return 204 if refresh token is valid', async () => {
      await request(app).post('/auth/logout').send({ refreshToken }).expect(204);
      const dbToken = await prisma.token.findUnique({ where: { token: refreshToken } });
      expect(dbToken).toBeNull();
    });

    it('should return 400 error if refresh token is not provided', async () => {
      await request(app).post('/auth/logout').send().expect(400);
    });

    it('should return 400 error if refresh token is not a string', async () => {
      await request(app).post('/auth/logout').send({ refreshToken: 123 }).expect(400);
    });

    it('should return 404 error if refresh token was already used', async () => {
      await request(app).post('/auth/logout').send({ refreshToken }).expect(404);
    });

    it('should return 404 error if refresh token does not exist', async () => {
      await request(app).post('/auth/logout').send({ refreshToken: 'invalidToken' }).expect(404);
    });
  });

  describe('POST /auth/refresh-tokens', () => {
    let newUser: registerUser;
    let refreshToken: string;
    let userId: string;
    beforeAll(async () => {
      newUser = {
        name: faker.name.fullName(),
        email: faker.internet.email().toLowerCase(),
        password: faker.random.alphaNumeric(8),
      };
      const register = await request(app).post('/auth/register').send(newUser);
      refreshToken = register.body.tokens.refresh.token;
      userId = register.body.user.id;
    });

    it('should return 200 and new access and refresh tokens if refresh token is valid', async () => {
      // two seconds timeout to assure that new token != old one
      // eslint-disable-next-line
      await new Promise((r) => setTimeout(r, 2000));

      const res = await request(app).post('/auth/refresh-tokens').send({ refreshToken }).expect(200);
      expect(res.body).toEqual({
        access: { token: expect.any(String), expires: expect.anything() },
        refresh: { token: expect.not.stringMatching(refreshToken), expires: expect.anything() },
      });
      const dbToken = await prisma.token.findUnique({ where: { token: refreshToken } });
      expect(dbToken).toBeNull();
    });

    it('should return 404 error if refresh token was already used', async () => {
      await request(app).post('/auth/refresh-tokens').send({ refreshToken }).expect(404);
    });

    it('should return 404 error if refresh token is an access token', async () => {
      const expiredToken = tokenService.generateToken(
        userId,
        moment().add(config.jwt.accessExpirationMinutes, 'minutes'),
        TokenTypes.ACCESS
      );
      await tokenService.saveToken(
        refreshToken,
        userId,
        moment().add(config.jwt.accessExpirationMinutes, 'minutes'),
        TokenTypes.ACCESS
      );
      await request(app).post('/auth/refresh-tokens').send({ refreshToken: expiredToken }).expect(404);
    });

    it('should return 400 error if refresh token is not provided', async () => {
      await request(app).post('/auth/refresh-tokens').send().expect(400);
    });

    it('should return 500 error if refresh token is not valid', async () => {
      await request(app).post('/auth/refresh-tokens').send({ refreshToken: 'invalidToken' }).expect(500);
    });

    it('should return 500 error if refresh token is expired', async () => {
      const expiredToken = tokenService.generateToken(userId, moment().subtract(1, 'day'), TokenTypes.REFRESH);
      await tokenService.saveToken(expiredToken, userId, moment().subtract(1, 'day'), TokenTypes.REFRESH);
      await request(app).post('/auth/refresh-tokens').send({ refreshToken: expiredToken }).expect(500);
    });

    it('should return 500 error if refresh token is using a different secret', async () => {
      const secretToken = jwt.sign(
        {
          sub: userId,
          iat: moment().unix(),
          exp: moment().add(config.jwt.refreshExpirationDays, 'days').unix(),
          type: TokenTypes.REFRESH,
        },
        faker.random.alphaNumeric(32)
      );
      await tokenService.saveToken(secretToken, userId, moment().subtract(1, 'day'), TokenTypes.REFRESH);
      await request(app).post('/auth/refresh-tokens').send({ refreshToken: secretToken }).expect(500);
    });
  });

  describe('POST /auth/forgot-password', () => {
    let newUser: registerUser;
    let userId: string;
    beforeAll(async () => {
      newUser = {
        name: faker.name.fullName(),
        email: faker.internet.email().toLowerCase(),
        password: faker.random.alphaNumeric(8),
      };
      const register = await request(app).post('/auth/register').send(newUser);
      userId = register.body.user.id;
    });

    beforeEach(async () => {
      jest.spyOn(emailService.transport, 'sendMail').mockResolvedValue(true as any);
    });

    it('should return 204 and send reset password email to the user', async () => {
      const sendResetPasswordEmailSpy = jest.spyOn(emailService, 'sendResetPasswordEmail');
      await request(app).post('/auth/forgot-password').send({ email: newUser.email }).expect(204);

      expect(sendResetPasswordEmailSpy).toHaveBeenCalledWith(newUser.email, expect.any(String));
      const resetPasswordToken = sendResetPasswordEmailSpy.mock.calls[0][1];
      const dbResetPasswordTokenDoc = await prisma.token.findUnique({ where: { token: resetPasswordToken } });
      expect(dbResetPasswordTokenDoc?.userId).toEqual(userId);
      expect(dbResetPasswordTokenDoc).toBeDefined();
    });

    it('should return 400 if email is missing', async () => {
      await request(app).post('/auth/forgot-password').send().expect(400);
    });

    it('should return 404 if email does not belong to any user', async () => {
      await request(app).post('/auth/forgot-password').send({ email: faker.internet.email() }).expect(404);
    });

    it('should return 500 if email service fails', async () => {
      jest.spyOn(emailService.transport, 'sendMail').mockRejectedValue(new Error('Email service failed'));
      await request(app).post('/auth/forgot-password').send({ email: newUser.email }).expect(500);
    });
  });
});
