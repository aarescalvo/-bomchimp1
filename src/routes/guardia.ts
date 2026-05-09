import { Router } from 'express';
import { db } from '../db/schema';
import { authenticateToken, requirePermission } from '../middleware/auth';
import { z } from 'zod';
import { AuthRequest } from '../types';
import { getPagination, formatPaginatedResponse } from '../utils/pagination';
import crypto from 'crypto';

const router = Router();

const guardiaLogSchema = z.object({
  fecha: z.string(),
  turno: z.enum(['mañana', 'tarde', 'noche']),
  jefeGuardia: z.string().min(1),
  personalPresente: z.array(z.string()).optional(),
  novedad: z.string().min(1),
  tipo: z.enum(['operativa', 'administrativa', 'mantenimiento', 'otro']),
  prioridad: z.enum(['normal', 'urgente']).default('normal')
});

router.get("/", authenticateToken, requirePermission('guardia'), (req, res) => {
  const { page, limit, offset } = getPagination(req);
  const { fecha } = req.query;

  let query = "SELECT * FROM guardia_logs ";
  let countQuery = "SELECT COUNT(*) as count FROM guardia_logs ";
  const params: any[] = [];

  if (fecha) {
    query += "WHERE fecha = ? ";
    countQuery += "WHERE fecha = ? ";
    params.push(fecha);
  } else {
    // Default last 30 days
    query += "WHERE fecha >= date('now', '-30 days') ";
    countQuery += "WHERE fecha >= date('now', '-30 days') ";
  }

  query += "ORDER BY timestamp DESC LIMIT ? OFFSET ?";
  
  const total = (db.prepare(countQuery).get(...params) as any).count;
  const logs = db.prepare(query).all(...params, limit, offset);

  res.json(formatPaginatedResponse(logs, total, { page, limit, offset }));
});

router.post("/", authenticateToken, requirePermission('guardia'), (req: AuthRequest, res) => {
  const result = guardiaLogSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

  const id = crypto.randomUUID();
  const data = result.data;
  const userId = req.user!.id;
  const userName = req.user!.displayName;

  db.prepare(`
    INSERT INTO guardia_logs (id, fecha, turno, jefeGuardia, personalPresente, novedad, tipo, prioridad, userId, userName)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, data.fecha, data.turno, data.jefeGuardia, 
    JSON.stringify(data.personalPresente || []), 
    data.novedad, data.tipo, data.prioridad, userId, userName
  );

  // Requirement 3.1: Log urgent operative novità to audit_logs
  if (data.tipo === 'operativa' && data.prioridad === 'urgente') {
    db.prepare("INSERT INTO audit_logs (id, userId, userName, action, module, details) VALUES (?, ?, ?, ?, ?, ?)")
      .run(crypto.randomUUID(), userId, userName, "URGENTE", "guardia", `Novedad urgente: ${data.novedad.substring(0, 100)}...`);
  }

  res.json({ id, ...data, userId, userName });
});

router.patch("/:id", authenticateToken, requirePermission('guardia'), (req: AuthRequest, res) => {
  const existing = db.prepare("SELECT * FROM guardia_logs WHERE id = ?").get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: "Novedad no encontrada" });

  const isAdmin = req.user!.role === 'admin';
  const isAuthor = existing.userId === req.user!.id;
  
  // 3.1: Edit only author or admin, up to 15 min after creation
  if (!isAdmin && !isAuthor) return res.status(403).json({ error: "No tienes permiso para editar esta novedad" });

  if (!isAdmin) {
    const elapsedMinutes = (Date.now() - new Date(existing.timestamp).getTime()) / 60000;
    if (elapsedMinutes > 15) {
      return res.status(403).json({ error: "El tiempo límite para editar (15 min) ha expirado" });
    }
  }

  const result = guardiaLogSchema.partial().safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

  const validated = result.data as any;
  const keys = Object.keys(validated);
  if (keys.length === 0) return res.status(400).json({ error: "Nada para actualizar" });

  const setClause = keys.map(k => `${k} = ?`).join(", ");
  const values = keys.map(k => k === 'personalPresente' ? JSON.stringify(validated[k]) : validated[k]);

  db.prepare(`UPDATE guardia_logs SET ${setClause} WHERE id = ?`)
    .run(...values, req.params.id);

  res.json({ success: true });
});

export default router;
