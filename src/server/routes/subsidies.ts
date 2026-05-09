import { Router } from 'express';
import { db } from '../db';
import { authenticateToken, requirePermission } from '../middleware/auth';
import { logAction } from '../utils/logger';
import { AuthRequest } from '../../types/auth';
import crypto from 'crypto';
import { z } from 'zod';

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

const expenseSchema = z.object({
  category: z.string().min(1),
  description: z.string().min(1),
  amount: z.number().min(0.01),
  invoiceNumber: z.string().optional(),
  vendor: z.string().optional(),
  date: z.string().optional(),
  attachmentUrl: z.string().optional()
});

router.get("/", authenticateToken, (req, res) => {
  const subsidies = db.prepare("SELECT * FROM subsidies ORDER BY receivedDate DESC").all();
  res.json(subsidies);
});

router.get("/summary", authenticateToken, (req, res) => {
  const totalReceived = db.prepare("SELECT SUM(amount) as total FROM subsidies").get() as any;
  const totalSpent = db.prepare("SELECT SUM(amount) as total FROM subsidy_expenses").get() as any;
  res.json({
    totalReceived: totalReceived.total || 0,
    totalSpent: totalSpent.total || 0,
  });
});

router.post("/", authenticateToken, requirePermission('subsidies'), (req: AuthRequest, res) => {
  try {
    const result = subsidySchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

    const subsidy = { id: crypto.randomUUID(), ...result.data };
    db.prepare(`
      INSERT INTO subsidies (id, name, origin, resolutionNumber, amount, receivedDate, expirationDate, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      subsidy.id, subsidy.name, subsidy.origin, subsidy.resolutionNumber, 
      subsidy.amount, subsidy.receivedDate, subsidy.expirationDate, subsidy.status
    );

    logAction(req.user!.id, req.user!.displayName, "CREATE", "subsidies", `Nuevo subsidio: ${subsidy.name}`);
    res.json(subsidy);
  } catch (error) {
    res.status(500).json({ error: "Error al crear subsidio" });
  }
});

router.get("/:id/expenses", authenticateToken, requirePermission('subsidies'), (req, res) => {
  const expenses = db.prepare("SELECT * FROM subsidy_expenses WHERE subsidyId = ? ORDER BY date DESC").all(req.params.id);
  res.json(expenses);
});

router.post("/:id/expenses", authenticateToken, requirePermission('subsidies'), (req: AuthRequest, res) => {
  try {
    const result = expenseSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

    const expense = { 
      id: crypto.randomUUID(), 
      subsidyId: req.params.id, 
      userId: req.user!.id, 
      userName: req.user!.displayName, 
      ...result.data 
    };

    db.prepare(`
      INSERT INTO subsidy_expenses (id, subsidyId, category, description, amount, invoiceNumber, vendor, date, userId, userName, attachmentUrl) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      expense.id, expense.subsidyId, expense.category, expense.description, 
      expense.amount, expense.invoiceNumber, expense.vendor, expense.date, 
      expense.userId, expense.userName, expense.attachmentUrl
    );

    logAction(req.user!.id, req.user!.displayName, "CREATE", "subsidies", `Gasto de subsidio: ${expense.description} ($${expense.amount})`);
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: "Error al registrar gasto" });
  }
});

router.delete("/:id", authenticateToken, requirePermission('subsidies'), (req: AuthRequest, res) => {
  try {
    db.prepare("DELETE FROM subsidies WHERE id = ?").run(req.params.id);
    db.prepare("DELETE FROM subsidy_expenses WHERE subsidyId = ?").run(req.params.id);
    logAction(req.user!.id, req.user!.displayName, "DELETE", "subsidies", `Eliminación subsidio ID: ${req.params.id}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar subsidio" });
  }
});

export default router;
