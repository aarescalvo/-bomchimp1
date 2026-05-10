import { Router } from 'express';
import { db } from '../db/schema';
import { authenticateToken, requirePermission } from '../middleware/auth';
import { z } from 'zod';
import { AuthRequest } from '../types';
import { getPagination, formatPaginatedResponse } from '../utils/pagination';
import { logAction } from '../utils/logger';
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
  const { page, limit, offset } = getPagination(req);
  const includeDeleted = req.query.includeDeleted === 'true' && req.user?.role === 'admin';
  
  const whereClause = includeDeleted ? "" : "WHERE status != 'deleted'";
  const total = (db.prepare(`SELECT COUNT(*) as count FROM inventory ${whereClause}`).get() as any).count;
  const items = db.prepare(`SELECT * FROM inventory ${whereClause} LIMIT ? OFFSET ?`).all(limit, offset);
  
  res.json(formatPaginatedResponse(items, total, { page, limit, offset }));
});

router.post("/", authenticateToken, requirePermission('inventory'), (req: AuthRequest, res) => {
  const result = inventorySchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

  const id = crypto.randomUUID();
  const data = result.data;

  db.prepare(`
    INSERT INTO inventory (id, name, category, quantity, unit, minStock)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, data.name, data.category, data.quantity, data.unit, data.minStock);

  logAction(req.user!.id, req.user!.displayName, 'CREATE', 'Inventory', `Item ${data.name} agregado al stock`);

  res.json({ id, ...data });
});

router.patch("/:id", authenticateToken, requirePermission('inventory'), (req: AuthRequest, res) => {
  const result = inventorySchema.partial().safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

  const validated = result.data as any;
  const keys = Object.keys(validated);
  if (keys.length === 0) return res.status(400).json({ error: "Nada para actualizar" });

  const setClause = keys.map(k => `${k} = ?`).join(", ");
  const values = keys.map(k => validated[k]);

  db.prepare(`UPDATE inventory SET ${setClause} WHERE id = ?`).run(...values, req.params.id);

  logAction(req.user!.id, req.user!.displayName, 'UPDATE', 'Inventory', `Stock ID: ${req.params.id} actualizado (${keys.join(", ")})`);

  res.json({ success: true });
});

router.delete("/:id", authenticateToken, requirePermission('inventory'), (req: AuthRequest, res) => {
  const item = db.prepare("SELECT * FROM inventory WHERE id = ?").get(req.params.id) as any;
  if (!item) return res.status(404).json({ error: "Item no encontrado" });

  db.prepare("UPDATE inventory SET status = 'deleted' WHERE id = ?").run(req.params.id);
  
  logAction(req.user!.id, req.user!.displayName, 'DELETE', 'Inventory', `Item eliminado del stock: ${item.name} (ID: ${req.params.id})`);

  res.json({ success: true, message: "Item eliminado del sistema" });
});

export default router;
