import { Router } from 'express';
import { db } from '../db';
import { authenticateToken, requirePermission } from '../middleware/auth';
import { logAction } from '../utils/logger';
import { AuthRequest } from '../../types/auth';
import crypto from 'crypto';
import { z } from 'zod';

const router = Router();

const inventorySchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  quantity: z.number().int(),
  unit: z.string().optional(),
  minStock: z.number().int().optional()
});

router.get("/", authenticateToken, (req, res) => {
  const items = db.prepare("SELECT * FROM inventory").all();
  res.json(items);
});

router.post("/", authenticateToken, requirePermission('inventory'), (req: AuthRequest, res) => {
  try {
    const result = inventorySchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

    const item = { id: crypto.randomUUID(), ...result.data };
    db.prepare("INSERT INTO inventory (id, name, category, quantity, unit, minStock) VALUES (?, ?, ?, ?, ?, ?)")
      .run(item.id, item.name, item.category, item.quantity, item.unit, item.minStock);
    
    logAction(req.user!.id, req.user!.displayName, "CREATE", "inventory", `Nuevo item inventario: ${item.name}`);
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: "Error al crear item" });
  }
});

router.patch("/:id", authenticateToken, requirePermission('inventory'), (req: AuthRequest, res) => {
  try {
    const { quantity } = req.body;
    if (typeof quantity !== 'number') return res.status(400).json({ error: "Cantidad inválida" });

    db.prepare("UPDATE inventory SET quantity = ? WHERE id = ?").run(quantity, req.params.id);
    logAction(req.user!.id, req.user!.displayName, "UPDATE", "inventory", `Ajuste stock item ID: ${req.params.id} a ${quantity}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar stock" });
  }
});

router.delete("/:id", authenticateToken, requirePermission('inventory'), (req: AuthRequest, res) => {
  try {
    db.prepare("DELETE FROM inventory WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar item" });
  }
});

export default router;
