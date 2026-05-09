import { Router } from 'express';
import { db } from '../db/schema';
import { authenticateToken, requirePermission } from '../middleware/auth';
import { z } from 'zod';
import { AuthRequest } from '../types';
import { logAction } from '../utils/logger';
import crypto from 'crypto';

const router = Router();

const subsidySchema = z.object({
  name: z.string().min(1),
  origin: z.string().min(1),
  resolutionNumber: z.string().optional(),
  amount: z.number().min(0),
  receivedDate: z.string().optional(),
  expirationDate: z.string().optional(),
  status: z.enum(['active', 'expired', 'exhausted']).default('active')
});

router.get("/", authenticateToken, requirePermission('subsidies'), (req, res) => {
  res.json(db.prepare("SELECT * FROM subsidies").all());
});

router.post("/", authenticateToken, requirePermission('subsidies'), (req: AuthRequest, res) => {
  const result = subsidySchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

  const id = crypto.randomUUID();
  const data = result.data;

  db.prepare(`
    INSERT INTO subsidies (id, name, origin, resolutionNumber, amount, receivedDate, expirationDate, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.name, data.origin, data.resolutionNumber, data.amount, data.receivedDate, data.expirationDate, data.status);

  logAction(req.user!.id, req.user!.displayName, 'CREATE', 'Subsidies', `Nuevo subsidio registrado: ${data.name} ($${data.amount})`);

  res.json({ id, ...data });
});

router.get("/:id/expenses", authenticateToken, requirePermission('subsidies'), (req, res) => {
  const expenses = db.prepare("SELECT * FROM subsidy_expenses WHERE subsidyId = ?").all(req.params.id);
  res.json(expenses);
});

router.post("/:id/expenses", authenticateToken, requirePermission('subsidies'), (req: AuthRequest, res) => {
  const schema = z.object({
    category: z.string().min(1),
    description: z.string().min(1),
    amount: z.number().min(0.01),
    invoiceNumber: z.string().optional(),
    vendor: z.string().optional(),
    date: z.string().optional()
  });

  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

  const id = crypto.randomUUID();
  const data = result.data;

  db.prepare(`
    INSERT INTO subsidy_expenses (id, subsidyId, category, description, amount, invoiceNumber, vendor, date, userId, userName)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.params.id, data.category, data.description, data.amount, data.invoiceNumber, data.vendor, data.date, req.user!.id, req.user!.displayName);

  logAction(req.user!.id, req.user!.displayName, 'CREATE', 'Subsidies', `Comprobante ${data.invoiceNumber || 'S/N'} rendido en subsidio ID: ${req.params.id}`);

  res.json({ id, ...data });
});

export default router;
