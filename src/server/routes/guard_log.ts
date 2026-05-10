import { Router } from 'express';
import { db } from '../db';
import { authenticateToken, requirePermission } from '../middleware/auth';
import { logAction } from '../utils/logger';
import { AuthRequest } from '../../types/auth';
import crypto from 'crypto';

const router = Router();

router.get("/", authenticateToken, (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: "Fecha requerida" });

  try {
    const logs = db.prepare(`
      SELECT * FROM guard_log 
      WHERE shiftDate = ? AND hidden = 0
      ORDER BY createdAt ASC
    `).all(date);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener libreta de guardia" });
  }
});

router.post("/", authenticateToken, requirePermission('staff'), (req: AuthRequest, res) => {
  try {
    const { shiftDate, shiftType, content } = req.body;
    if (!shiftDate || !shiftType || !content) return res.status(400).json({ error: "Datos faltantes" });

    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO guard_log (id, shiftDate, shiftType, content, authorId, authorName)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, shiftDate, shiftType, content, req.user!.id, req.user!.displayName);

    logAction(req.user!.id, req.user!.displayName, "CREATE", "staff", `Novedad libreta de guardia: ${shiftType}`);
    res.json({ id, success: true });
  } catch (error) {
    res.status(500).json({ error: "Error al registrar novedad" });
  }
});

router.patch("/:id", authenticateToken, (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const entry = db.prepare("SELECT * FROM guard_log WHERE id = ?").get(id) as any;
    if (!entry) return res.status(404).json({ error: "Entrada no encontrada" });

    // Regla: Solo autor, < 2h, y no bloqueada
    if (entry.lockedAt) return res.status(403).json({ error: "Entrada bloqueada, no se puede editar" });
    if (entry.authorId !== req.user!.id) return res.status(403).json({ error: "Solo el autor puede editar su entrada" });

    const createdAt = new Date(entry.createdAt).getTime();
    const now = new Date().getTime();
    if (now - createdAt > 2 * 60 * 60 * 1000) {
      // Bloquear automáticamente si ya pasó el tiempo
      db.prepare("UPDATE guard_log SET lockedAt = CURRENT_TIMESTAMP WHERE id = ?").run(id);
      return res.status(403).json({ error: "Tiempo de edición expirado (2hs)" });
    }

    db.prepare("UPDATE guard_log SET content = ?, editedAt = CURRENT_TIMESTAMP WHERE id = ?").run(content, id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error al editar entrada" });
  }
});

router.post("/:id/lock", authenticateToken, requirePermission('settings'), (req: AuthRequest, res) => {
  try {
    db.prepare("UPDATE guard_log SET lockedAt = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
    logAction(req.user!.id, req.user!.displayName, "UPDATE", "staff", `Entrada de guardia bloqueada ID: ${req.params.id}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error al bloquear entrada" });
  }
});

export default router;
