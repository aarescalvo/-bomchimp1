import { Router } from 'express';
import { db } from '../db';
import { authenticateToken, requirePermission } from '../middleware/auth';
import { AuthRequest } from '../../types/auth';
import crypto from 'crypto';
import { z } from 'zod';

const router = Router();

const transactionSchema = z.object({
  amount: z.number(),
  category: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['income', 'expense'])
});

router.get("/", authenticateToken, (req, res) => {
  const txs = db.prepare("SELECT * FROM finances ORDER BY timestamp DESC").all();
  res.json(txs);
});

router.post("/", authenticateToken, requirePermission('finances'), (req: AuthRequest, res) => {
  try {
    const result = transactionSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

    const tx = { 
      id: crypto.randomUUID(), 
      ...result.data, 
      timestamp: new Date().toISOString(),
      recordedBy: req.user!.displayName
    };

    db.prepare(`
      INSERT INTO finances (id, amount, category, description, type, timestamp, recordedBy) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(tx.id, tx.amount, tx.category, tx.description, tx.type, tx.timestamp, tx.recordedBy);
    res.json(tx);
  } catch (error) {
    res.status(500).json({ error: "Error al registrar transacción" });
  }
});

export default router;
