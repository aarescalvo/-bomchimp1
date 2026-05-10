import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from '../server/routes/auth';

// Mocking the DB
vi.mock('../db/schema', () => ({
  db: {
    prepare: vi.fn(() => ({
      get: vi.fn(() => ({
        id: '1',
        username: 'testuser',
        password: '$2a$10$test-hashed-password', // bcrypt hash for 'password123'
        role: 'admin',
        displayName: 'Test User',
        permissions: '["dashboard"]',
        mustChangePassword: 0
      })),
      run: vi.fn()
    }))
  }
}));

// Mocking bcrypt (optional if using real hash, but safer for tests)
vi.mock('bcryptjs', () => ({
  default: {
    compareSync: vi.fn((pass) => pass === 'password123'),
    hashSync: vi.fn(() => 'new-hashed-password')
  }
}));

// Mocking logger
vi.mock('../utils/logger', () => ({
  logAction: vi.fn()
}));

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRouter);

describe('Auth Routes', () => {
  it('POST /api/auth/login - should login successfully', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body.username).toBe('testuser');
    expect(res.header['set-cookie']).toBeDefined();
  });

  it('POST /api/auth/login - should fail with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciales inválidas');
  });

  it('POST /api/auth/logout - should clear cookies', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.header['set-cookie'][0]).toContain('token=;');
  });
});
