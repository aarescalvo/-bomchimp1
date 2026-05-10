import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import rentalsRouter from '../routes/rentals';

// Mock DB
vi.mock('../db/schema', () => ({
  db: {
    prepare: vi.fn(() => ({
      all: vi.fn(() => []),
      get: vi.fn(() => ({ id: '1', estado: 'reservado' })),
      run: vi.fn(),
      transaction: (cb: any) => cb()
    }))
  }
}));

// Mock Middleware
vi.mock('../middleware/auth', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { id: 'admin-id', role: 'admin', displayName: 'Admin' };
    next();
  },
  requirePermission: () => (req: any, res: any, next: any) => next(),
  requireAdmin: (req: any, res: any, next: any) => next()
}));

// Mock Logger
vi.mock('../utils/logger', () => ({
  logAction: vi.fn()
}));

const app = express();
app.use(express.json());
app.use('/api/rentals', rentalsRouter);

describe('Rentals Routes', () => {
  it('GET /api/rentals/turnos - should return turnos', async () => {
    const res = await request(app).get('/api/rentals/turnos');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('DELETE /api/rentals/turnos/:id - should soft delete reserved turno', async () => {
    const res = await request(app).delete('/api/rentals/turnos/1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
