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

describe('User', () => {
  afterAll(async () => prisma.$disconnect());

  describe('GET /user', () => {
    it('should return 200 and successfully get all users', async () => {
      const accessToken = await generateAccessToken((await insertRandomUser('ADMIN')).id);
      const res = await request(app).get('/user').set('Authorization', `Bearer ${accessToken}`).send().expect(200);
      expect(res.body.users).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number),
            email: expect.any(String),
            role: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          }),
        ])
      );
    });

    it('should return 401 error if access token is missing', async () => {
      await request(app).get('/user').send().expect(401);
    });

    it('should return 403 error if user is not admin', async () => {
      const accessToken = await generateAccessToken((await insertRandomUser()).id);
      await request(app).get('/user').set('Authorization', `Bearer ${accessToken}`).send().expect(403);
    });
  });

  describe('POST /user/', () => {
    let accessToken: string;
    let user: { name: string; email: string; password: string };

    beforeEach(async () => {
      accessToken = await generateAccessToken((await insertRandomUser('ADMIN')).id);
      user = randomUser();
    });

    it('should return 201 and successfully create new user if data is ok', async () => {
      const res = await request(app).post('/user').set('Authorization', `Bearer ${accessToken}`).send(user).expect(201);
      expect(res.body.user).toMatchObject(
        expect.objectContaining({
          id: expect.any(Number),
          email: user.email,
          role: 'USER',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        })
      );
      const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
      expect(dbUser).toBeDefined();
      expect(dbUser?.password).not.toBe(user.password);
      expect(dbUser?.role).toBe('USER');
    });

    it('should return 401 error if access token is missing', async () => {
      await request(app).post('/user').send().expect(401);
    });

    it('should return 403 error if user is not admin', async () => {
      accessToken = await generateAccessToken((await insertRandomUser()).id);
      await request(app).post('/user').set('Authorization', `Bearer ${accessToken}`).send().expect(403);
    });

    it('should return 400 error if email is invalid', async () => {
      user.email = 'invalidEmail';
      await request(app).post('/user').set('Authorization', `Bearer ${accessToken}`).send(user).expect(400);
    });

    it('should return 400 error if email is already used', async () => {
      await prisma.user.create({ data: user });
      await request(app).post('/user').set('Authorization', `Bearer ${accessToken}`).send(user).expect(400);
    });

    it('should return 400 error if password length is less than 6 characters', async () => {
      user.password = 'short';
      await request(app).post('/user').set('Authorization', `Bearer ${accessToken}`).send(user).expect(400);
    });

    it('should return 400 error if name is not provided', async () => {
      user.name = '';
      await request(app).post('/user').set('Authorization', `Bearer ${accessToken}`).send(user).expect(400);
    });
  });

  describe('GET /user/me', () => {
    it('should return 200 and the user object if access token is ok', async () => {
      const user = await insertRandomUser();
      const accessToken = await generateAccessToken(user.id);
      const res = await request(app).get('/user/me').set('Authorization', `Bearer ${accessToken}`).send().expect(200);
      expect(res.body).toMatchObject({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should return 401 error if access token is missing', async () => {
      await request(app).get('/user/me').send().expect(401);
    });

    it('should return 401 error if access token is wrong', async () => {
      const accessToken = await generateAccessToken((await insertRandomUser()).id);
      await request(app).get('/user/me').set('Authorization', `Bearer ${accessToken}wrong`).send().expect(401);
    });

    it('should return 401 error if user not longer exist', async () => {
      const user = await insertRandomUser();
      const accessToken = await generateAccessToken(user.id);
      await prisma.user.delete({ where: { id: user.id } });
      await request(app).get('/user/me').set('Authorization', `Bearer ${accessToken}`).send().expect(401);
    });
  });

  describe('PATCH /user/me', () => {
    it('should return 200 and successfully update user if data is ok', async () => {
      const user = await insertRandomUser();
      const accessToken = await generateAccessToken(user.id);
      const res = await request(app)
        .patch('/user/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: faker.name.fullName() })
        .expect(200);
      expect(res.body.user).toMatchObject({
        id: user.id,
        name: expect.any(String),
        email: user.email,
        role: user.role,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      expect(dbUser).toBeDefined();
      expect(dbUser?.name).not.toEqual(user.name);
      expect(dbUser?.updatedAt).not.toEqual(user.updatedAt);
    });

    it('should return 401 error if access token is missing', async () => {
      await request(app).patch('/user/me').send().expect(401);
    });

    it('should return 401 error if access token is wrong', async () => {
      const accessToken = await generateAccessToken((await insertRandomUser()).id);
      await request(app).patch('/user/me').set('Authorization', `Bearer ${accessToken}wrong`).send().expect(401);
    });

    it('should return 401 error if user not longer exist', async () => {
      const user = await insertRandomUser();
      const accessToken = await generateAccessToken(user.id);
      await prisma.user.delete({ where: { id: user.id } });
      await request(app).patch('/user/me').set('Authorization', `Bearer ${accessToken}`).send().expect(401);
    });

    it('should return 400 error if name is not provided', async () => {
      const user = await insertRandomUser();
      const accessToken = await generateAccessToken(user.id);
      await request(app).patch('/user/me').set('Authorization', `Bearer ${accessToken}`).send({ name: '' }).expect(400);
    });

    it('should return 400 error if email is invalid', async () => {
      const user = await insertRandomUser();
      const accessToken = await generateAccessToken(user.id);
      await request(app)
        .patch('/user/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ email: 'invalidEmail' })
        .expect(400);
    });

    it('should return 400 error if email is already used', async () => {
      const user = await insertRandomUser();
      const accessToken = await generateAccessToken(user.id);
      const randomEmail = faker.internet.email();
      await prisma.user.create({ data: { ...randomUser(), email: randomEmail } });
      await request(app)
        .patch('/user/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ email: randomEmail })
        .expect(400);
    });

    it('should return 400 error if password length is less than 6 characters', async () => {
      const user = await insertRandomUser();
      const accessToken = await generateAccessToken(user.id);
      await request(app)
        .patch('/user/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ password: 'short' })
        .expect(400);
    });
  });
});
