import request from 'supertest';
const { afterAll } = require('@jest/globals');

import app from '../src/index';
import { server } from '../src/index';

describe('GET /', () => {
  it('should return "Hello World!"', async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Hello World!' });
  });
});

afterAll(() => {
    server.close();
});