import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { faker } from '@faker-js/faker';
import moment from 'moment';
import bcrypt from 'bcryptjs';
import app from '../../src/app';

const prisma = new PrismaClient();

interface User {
  name: string;
  email: string;
  password: string | null;
}

describe('Auth', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /auth/register', () => {
    let newUser: User;
    beforeEach(() => {
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
    let userOnePass: string;
    let userOne: User;
    let loginCredentials: { email: string; password: string };

    beforeEach(async () => {
      userOnePass = faker.random.alphaNumeric(8);
      userOne = await prisma.user.create({
        data: {
          name: faker.name.fullName(),
          email: faker.internet.email().toLowerCase(),
          password: await bcrypt.hash(userOnePass, 8),
        },
      });

      loginCredentials = {
        email: userOne.email,
        password: userOnePass,
      };
    });

    it('should return 200 and login user if email and password match', async () => {
      const res = await request(app).post('/auth/login').send(loginCredentials).expect(200);

      expect(res.body.user).toMatchObject({
        id: expect.anything(),
        name: userOne.name,
        email: userOne.email,
        emailVerified: false,
      });

      expect(res.body.tokens).toEqual({
        access: { token: expect.any(String), expires: expect.anything() },
        refresh: { token: expect.any(String), expires: expect.anything() },
      });
    });

    it('should return 401 error if there are no users with that email', async () => {
      loginCredentials.email = faker.internet.email().toLowerCase();
      await request(app).post('/auth/login').send(loginCredentials).expect(401);
    });

    it('should return 401 error if password is wrong', async () => {
      loginCredentials.password = 'wrongPassword1';
      await request(app).post('/auth/login').send(loginCredentials).expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    let userOnePass: string;
    let userOne: User;
    let loginCredentials: { email: string; password: string };
    let refreshToken: string;

    beforeAll(async () => {
      userOnePass = faker.random.alphaNumeric(8);
      userOne = await prisma.user.create({
        data: {
          name: faker.name.fullName(),
          email: faker.internet.email().toLowerCase(),
          password: await bcrypt.hash(userOnePass, 8),
        },
      });

      loginCredentials = {
        email: userOne.email,
        password: userOnePass,
      };

      const res = await request(app).post('/auth/login').send(loginCredentials);
      refreshToken = res.body.tokens.refresh.token;
    });

    it('should return 204 if refresh token is valid', async () => {
      await request(app).post('/auth/logout').send({ refreshToken }).expect(204);
      const dbToken = await prisma.token.findUnique({ where: { token: refreshToken } });
      expect(dbToken).toBeNull();
    });

    it('should return 400 error if refresh token is not provided', async () => {
      await request(app).post('/auth/logout').send().expect(400);
    });

    it('should return 404 error if refresh token does not exist', async () => {
      await request(app).post('/auth/logout').send({ refreshToken: 'invalidToken' }).expect(404);
    });
  });
});
