// @vitest-environment node
import express from 'express';
import request from 'supertest';
import Database from 'better-sqlite3';
import { initializeSchema } from '../providers/local/schema.js';
import { SqliteDbAdapter } from '../providers/local/SqliteDbAdapter.js';
import { LocalStorageAdapter } from '../providers/local/LocalStorageAdapter.js';
import { LocalAuthAdapter } from '../providers/local/LocalAuthAdapter.js';
import authRouter from './auth.js';

describe('Auth routes (local)', () => {
  let app;
  let db;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    initializeSchema(db);

    app = express();
    app.use(express.json());
    app.locals.providers = {
      type: 'local',
      db: new SqliteDbAdapter(db),
      storage: new LocalStorageAdapter('/tmp/test-storage'),
      auth: new LocalAuthAdapter(db, 'test-secret-key-at-least-32-chars-long'),
    };
    app.use('/api/auth', authRouter);
  });

  afterEach(() => {
    db.close();
  });

  it('POST /register creates a user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@b.com', password: 'pass123' });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('a@b.com');
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it('POST /register rejects missing fields', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
  });

  it('POST /register rejects duplicate email', async () => {
    await request(app).post('/api/auth/register').send({ email: 'a@b.com', password: 'pass123' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@b.com', password: 'pass456' });
    expect(res.status).toBe(400);
  });

  it('POST /login returns token', async () => {
    await request(app).post('/api/auth/register').send({ email: 'a@b.com', password: 'pass123' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@b.com', password: 'pass123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('a@b.com');
  });

  it('POST /login rejects invalid credentials', async () => {
    await request(app).post('/api/auth/register').send({ email: 'a@b.com', password: 'pass123' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@b.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('GET /me returns user from token', async () => {
    await request(app).post('/api/auth/register').send({ email: 'a@b.com', password: 'pass123' });
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@b.com', password: 'pass123' });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('a@b.com');
  });

  it('GET /me rejects missing token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('GET /me rejects invalid token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer garbage');
    expect(res.status).toBe(401);
  });
});
