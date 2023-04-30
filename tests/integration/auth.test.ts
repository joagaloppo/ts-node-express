import { PrismaClient, TokenTypes } from '@prisma/client';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';

import app from '../../src/app';
import insertRandomUser from '../fixtures/user.fixture';
import generateValidToken from '../fixtures/token.fixture';
import { emailService } from '../../src/services';

const prisma = new PrismaClient();

describe('Auth', () => {
  afterAll(async () => prisma.$disconnect());
  describe('POST /auth/register', () => {
    let newUser: { name: string; email: string; password: string };
    beforeEach(() => {
      newUser = {
        name: faker.name.fullName(),
        email: faker.internet.email().toLowerCase(),
        password: faker.internet.password(),
      };
    });

    it('should return 201 and register user if data is ok', async () => {
      const res = await request(app).post('/auth/register').send(newUser).expect(201);
      expect(res.body.user).toMatchObject({
        id: expect.anything(),
        name: newUser.name,
        email: newUser.email,
        emailVerified: false,
        googleId: null,
      });
      expect(res.body.tokens).toEqual({
        access: { token: expect.any(String), expires: expect.anything() },
        refresh: { token: expect.any(String), expires: expect.anything() },
      });
      const dbUser = await prisma.user.findUnique({ where: { id: res.body.user.id } });
      expect(dbUser?.password).not.toBe(newUser.password);
    });

    it('should return 400 if email is invalid', async () => {
      await request(app)
        .post('/auth/register')
        .send({ ...newUser, email: 'invalidEmail' })
        .expect(400);
    });

    it('should return 400 if password length is less than 6 characters', async () => {
      await request(app)
        .post('/auth/register')
        .send({ ...newUser, password: 'short' })
        .expect(400);
    });

    it('should return 400 if name length is less than 2 characters', async () => {
      await request(app)
        .post('/auth/register')
        .send({ ...newUser, name: 'a' })
        .expect(400);
    });

    it('should return 400 if email is already used', async () => {
      await request(app).post('/auth/register').send(newUser);
      await request(app).post('/auth/register').send(newUser).expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should return 200 and login the user if data is ok', async () => {
      const user = await insertRandomUser();
      const login = { email: user.email, password: user.password };
      const res = await request(app).post('/auth/login').send(login).expect(200);
      expect(res.body.user).toMatchObject({
        id: expect.anything(),
        name: user.name,
        email: user.email,
        emailVerified: false,
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
    it('should return 204 and logout the user if refresh token is valid', async () => {
      const user = await insertRandomUser();
      const token = await generateValidToken(user.id, TokenTypes.REFRESH);

      await request(app).post('/auth/logout').send({ refreshToken: token }).expect(204);
      const dbToken = await prisma.token.findUnique({ where: { token } });
      expect(dbToken).toBeNull();
    });

    it('should return 400 if refresh token is not provided', async () => {
      await request(app).post('/auth/logout').send().expect(400);
    });

    it('should return 400 if refresh token is not a string', async () => {
      await request(app).post('/auth/logout').send({ refreshToken: 123 }).expect(400);
    });

    it('should return 404 if token is an access token', async () => {
      const user = await insertRandomUser();
      const token = await generateValidToken(user.id, TokenTypes.ACCESS);
      await request(app).post('/auth/logout').send({ refreshToken: token }).expect(404);
    });

    it('should return 404 if refresh token does not exist', async () => {
      await request(app).post('/auth/logout').send({ refreshToken: 'invalidToken' }).expect(404);
    });
  });

  describe('POST /auth/refresh-tokens', () => {
    it('should return 200 and new access and refresh tokens if refresh token is valid', async () => {
      const user = await insertRandomUser();
      const token = await generateValidToken(user.id, TokenTypes.REFRESH);

      // timeout to assure a different token
      // eslint-disable-next-line
      await new Promise((r) => setTimeout(r, 1000));

      const res = await request(app).post('/auth/refresh-tokens').send({ refreshToken: token }).expect(200);
      expect(res.body).toEqual({
        access: { token: expect.any(String), expires: expect.anything() },
        refresh: { token: expect.not.stringMatching(token), expires: expect.anything() },
      });

      await request(app).post('/auth/refresh-tokens').send({ refreshToken: token }).expect(404);
      const findToken = await prisma.token.findUnique({ where: { token } });
      expect(findToken).toBeNull();
    });

    it('should return 400 if refresh token is not provided', async () => {
      await request(app).post('/auth/refresh-tokens').send().expect(400);
    });

    it('should return 404 if refresh token is an access token', async () => {
      const user = await insertRandomUser();
      const token = await generateValidToken(user.id, TokenTypes.ACCESS);
      await request(app).post('/auth/refresh-tokens').send({ refreshToken: token }).expect(404);
    });

    it('should return 500 if refresh token is not valid', async () => {
      await request(app).post('/auth/refresh-tokens').send({ refreshToken: 'invalidToken' }).expect(500);
    });

    it('should return 500 if refresh token is expired', async () => {
      const user = await insertRandomUser();
      const token = await generateValidToken(user.id, TokenTypes.REFRESH, true);
      await request(app).post('/auth/refresh-tokens').send({ refreshToken: token }).expect(500);
    });

    it('should return 500 if refresh token is using a different secret', async () => {
      const user = await insertRandomUser();
      const token = await generateValidToken(user.id, TokenTypes.REFRESH, false, faker.random.alphaNumeric(32));
      await request(app).post('/auth/refresh-tokens').send({ refreshToken: token }).expect(500);
    });
  });

  describe('POST /auth/forgot-password', () => {
    beforeEach(async () => {
      // eslint-disable-next-line
      jest.spyOn(emailService.transport, 'sendMail').mockResolvedValue(true as any);
    });

    it('should return 204 and send reset password email to the user', async () => {
      const user = await insertRandomUser();
      const sendResetPasswordEmailSpy = jest.spyOn(emailService, 'sendResetPasswordEmail');
      await request(app).post('/auth/forgot-password').send({ email: user.email }).expect(204);
      expect(sendResetPasswordEmailSpy).toHaveBeenCalledWith(user.email, expect.any(String));
      const resetPasswordToken = sendResetPasswordEmailSpy.mock.calls[0][1];
      const dbResetPasswordToken = await prisma.token.findUnique({ where: { token: resetPasswordToken } });
      expect(dbResetPasswordToken?.userId).toEqual(user.id);
      expect(dbResetPasswordToken).toBeDefined();
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

  describe('POST /auth/reset-password', () => {
    it('should return 204 and reset the password', async () => {
      const user = await insertRandomUser();
      const resetPasswordToken = await generateValidToken(user.id, TokenTypes.RESET_PASSWORD);

      await request(app)
        .post('/auth/reset-password')
        .query({ token: resetPasswordToken })
        .send({ password: 'newPassword' })
        .expect(204);

      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      const passMatch = await bcrypt.compare('newPassword', dbUser?.password as string);
      expect(dbUser?.password).not.toEqual(user.password);
      expect(passMatch).toBeTruthy();
    });

    it('should return 400 if password is missing or is invalid', async () => {
      const user = await insertRandomUser();
      const resetPasswordToken = await generateValidToken(user.id, TokenTypes.RESET_PASSWORD);
      await request(app).post('/auth/reset-password').query({ token: resetPasswordToken }).send().expect(400);
      await request(app)
        .post('/auth/reset-password')
        .query({ token: resetPasswordToken })
        .send({ password: 'short' })
        .expect(400);
    });

    it('should return 400 if token is missing', async () => {
      await request(app).post('/auth/reset-password').send({ password: 'newPassword' }).expect(400);
    });

    it('should return 400 if token is not a reset password token', async () => {
      const user = await insertRandomUser();
      const resetPasswordToken = await generateValidToken(user.id, TokenTypes.VERIFY_EMAIL);
      await request(app)
        .post('/auth/reset-password')
        .query({ token: resetPasswordToken })
        .send({ password: 'newPassword' })
        .expect(400);
    });

    it('should return 500 if token is expired', async () => {
      const user = await insertRandomUser();
      const resetPasswordToken = await generateValidToken(user.id, TokenTypes.RESET_PASSWORD, true);
      await request(app)
        .post('/auth/reset-password')
        .query({ token: resetPasswordToken })
        .send({ password: 'newPassword' })
        .expect(500);
    });

    it('should return 500 if token is using a different secret', async () => {
      const user = await insertRandomUser();
      const resetPasswordToken = await generateValidToken(
        user.id,
        TokenTypes.RESET_PASSWORD,
        false,
        faker.random.alphaNumeric(32)
      );
      await request(app)
        .post('/auth/reset-password')
        .query({ token: resetPasswordToken })
        .send({ password: 'newPassword' })
        .expect(500);
    });
  });

  describe('POST /auth/send-verification-email', () => {
    beforeEach(async () => {
      // eslint-disable-next-line
      jest.spyOn(emailService.transport, 'sendMail').mockResolvedValue(true as any);
    });

    it('should return 204 and send verification email to the user', async () => {
      const user = await insertRandomUser();
      const token = await generateValidToken(user.id, TokenTypes.ACCESS);
      const sendVerificationEmailSpy = jest.spyOn(emailService, 'sendVerificationEmail');

      await request(app).post('/auth/send-verification-email').set('Authorization', `Bearer ${token}`).expect(204);
      expect(sendVerificationEmailSpy).toHaveBeenCalledWith(user.email, expect.any(String));

      const verificationToken = sendVerificationEmailSpy.mock.calls[0][1];
      const dbVerificationToken = await prisma.token.findUnique({ where: { token: verificationToken } });
      expect(dbVerificationToken?.userId).toEqual(user.id);
    });

    it('should return 401 if access token is missing', async () => {
      await request(app).post('/auth/send-verification-email').expect(401);
    });

    it('should return 500 if email service fails', async () => {
      const user = await insertRandomUser();
      const token = await generateValidToken(user.id, TokenTypes.ACCESS);
      jest.spyOn(emailService.transport, 'sendMail').mockRejectedValue(new Error('Email service failed'));
      await request(app).post('/auth/send-verification-email').set('Authorization', `Bearer ${token}`).expect(500);
    });
  });

  describe('POST /auth/verify-email', () => {
    it('should return 204 and verify the email', async () => {
      const user = await insertRandomUser();
      const verificationToken = await generateValidToken(user.id, TokenTypes.VERIFY_EMAIL);

      await request(app).post('/auth/verify-email').query({ token: verificationToken }).expect(204);

      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      expect(dbUser?.emailVerified).toBeTruthy();
    });

    it('should return 400 if token is missing', async () => {
      await request(app).post('/auth/verify-email').expect(400);
    });

    it('should return 400 if token is not a verification token', async () => {
      const user = await insertRandomUser();
      const verificationToken = await generateValidToken(user.id, TokenTypes.RESET_PASSWORD);
      await request(app).post('/auth/verify-email').query({ token: verificationToken }).expect(400);
    });

    it('should return 500 if token is expired', async () => {
      const user = await insertRandomUser();
      const verificationToken = await generateValidToken(user.id, TokenTypes.VERIFY_EMAIL, true);
      await request(app).post('/auth/verify-email').query({ token: verificationToken }).expect(500);
    });

    it('should return 500 if token is using a different secret', async () => {
      const user = await insertRandomUser();
      const verificationToken = await generateValidToken(
        user.id,
        TokenTypes.VERIFY_EMAIL,
        false,
        faker.random.alphaNumeric(32)
      );
      await request(app).post('/auth/verify-email').query({ token: verificationToken }).expect(500);
    });
  });
});
