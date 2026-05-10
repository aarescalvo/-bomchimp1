import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import firefightersRouter from '../server/routes/firefighters';

// Mock DB
vi.mock('../db/schema', () => ({
  db: {
    prepare: vi.fn((sql) => ({
      all: vi.fn(() => [
        { id: '1', firstName: 'John', lastName: 'Doe', status: 'active' }
      ]),
      get: vi.fn(() => {
        if (sql.includes('FROM firefighters')) return { id: '1', firstName: 'John', status: 'active', count: 1 };
        if (sql.includes('FROM salidas')) return null; // No active mission
        return { count: 1 };
      }),
      run: vi.fn()
    }))
  }
}));

// Mock Middleware
vi.mock('../middleware/auth', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { id: 'admin-id', role: 'admin' };
    next();
  },
  requirePermission: () => (req: any, res: any, next: any) => next(),
  requireAdmin: (req: any, res: any, next: any) => next()
}));

const app = express();
app.use(express.json());
app.use('/api/firefighters', firefightersRouter);

describe('Firefighters Routes', () => {
  it('GET /api/firefighters - should return list of firefighters', async () => {
    const res = await request(app).get('/api/firefighters');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].firstName).toBe('John');
  });

  it('DELETE /api/firefighters/:id - should soft delete', async () => {
    const res = await request(app).delete('/api/firefighters/1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
