import { Router } from 'express';
import { db } from '../db/schema';
import { authenticateToken, requirePermission } from '../middleware/auth';
import { z } from 'zod';
import { AuthRequest } from '../types';
import { getPagination, formatPaginatedResponse } from '../utils/pagination';
import { logAction } from '../utils/logger';
import crypto from 'crypto';

const router = Router();

const financeSchema = z.object({
  amount: z.number().min(0.01),
  category: z.string(),
  description: z.string(),
  type: z.enum(['income', 'expense'])
});

router.get("/", authenticateToken, requirePermission('finances'), (req, res) => {
  const { page, limit, offset } = getPagination(req);
  const total = (db.prepare("SELECT COUNT(*) as count FROM finances").get() as any).count;
  const data = db.prepare("SELECT * FROM finances ORDER BY timestamp DESC LIMIT ? OFFSET ?").all(limit, offset);
  res.json(formatPaginatedResponse(data, total, { page, limit, offset }));
});

router.post("/", authenticateToken, requirePermission('finances'), (req: AuthRequest, res) => {
  const result = financeSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

  const id = crypto.randomUUID();
  const data = result.data;

  db.prepare(`
    INSERT INTO finances (id, amount, category, description, type, recordedBy)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, data.amount, data.category, data.description, data.type, req.user!.displayName);

  logAction(req.user!.id, req.user!.displayName, 'CREATE', 'Treasury', `Nueva transacción (${data.type}): $${data.amount} - ${data.category}`);

  res.json({ id, ...data });
});

router.get("/balance", authenticateToken, requirePermission('finances'), (req, res) => {
  const { mes, anio } = req.query;
  if (!mes || !anio) return res.status(400).json({ error: "Mes y año requeridos" });

  const monthStr = `${anio}-${mes.toString().padStart(2, '0')}`;

  const summary = db.prepare(`
    SELECT 
      type, 
      category, 
      SUM(amount) as total 
    FROM finances 
    WHERE strftime('%Y-%m', timestamp) = ?
    GROUP BY type, category
  `).all(monthStr) as any[];

  const income = summary.filter(s => s.type === 'income');
  const expense = summary.filter(s => s.type === 'expense');

  const totalIncome = income.reduce((acc, curr) => acc + curr.total, 0);
  const totalExpense = expense.reduce((acc, curr) => acc + curr.total, 0);

  res.json({
    period: monthStr,
    income,
    expense,
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense
  });
});

export default router;
