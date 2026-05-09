import { Router } from 'express';
import { db } from '../db/schema';
import { authenticateToken, requirePermission } from '../middleware/auth';
import { z } from 'zod';
import crypto from 'crypto';

const router = Router();

const inventorySchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  quantity: z.number().min(0),
  unit: z.string().optional(),
  minStock: z.number().optional().default(0)
});

router.get("/", authenticateToken, requirePermission('inventory'), (req, res) => {
  const items = db.prepare("SELECT * FROM inventory").all();
  res.json(items);
});

router.post("/", authenticateToken, requirePermission('inventory'), (req, res) => {
  const result = inventorySchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

  const id = crypto.randomUUID();
  const data = result.data;

  db.prepare(`
    INSERT INTO inventory (id, name, category, quantity, unit, minStock)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, data.name, data.category, data.quantity, data.unit, data.minStock);

  res.json({ id, ...data });
});

router.patch("/:id", authenticateToken, requirePermission('inventory'), (req, res) => {
  const result = inventorySchema.partial().safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

  const validated = result.data as any;
  const keys = Object.keys(validated);
  if (keys.length === 0) return res.status(400).json({ error: "Nada para actualizar" });

  const setClause = keys.map(k => `${k} = ?`).join(", ");
  const values = keys.map(k => validated[k]);

  db.prepare(`UPDATE inventory SET ${setClause} WHERE id = ?`).run(...values, req.params.id);

  res.json({ success: true });
});

export default router;
