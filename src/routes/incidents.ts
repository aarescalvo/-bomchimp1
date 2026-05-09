import { Router } from 'express';
import { db } from '../db/schema';
import { authenticateToken, requirePermission } from '../middleware/auth';
import { z } from 'zod';
import { AuthRequest } from '../types';
import { getPagination, formatPaginatedResponse } from '../utils/pagination';
import { logAction } from '../utils/logger';
import crypto from 'crypto';

const router = Router();

const incidentSchema = z.object({
  type: z.string().min(1),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  address: z.string().optional(),
  callerName: z.string().optional(),
  phoneNumber: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['open', 'in_progress', 'closed']).default('open'),
  lat: z.number().optional(),
  lng: z.number().optional()
});

router.get("/", authenticateToken, (req, res) => {
  const { page, limit, offset } = getPagination(req);
  
  const total = (db.prepare("SELECT COUNT(*) as count FROM incidents").get() as any).count;
  const incidents = db.prepare("SELECT * FROM incidents ORDER BY timestamp DESC LIMIT ? OFFSET ?").all(limit, offset);
  
  res.json(formatPaginatedResponse(incidents, total, { page, limit, offset }));
});

router.post("/", authenticateToken, requirePermission('incidents'), (req: AuthRequest, res) => {
  const result = incidentSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

  const id = crypto.randomUUID();
  const data = result.data;

  db.prepare(`
    INSERT INTO incidents (id, type, severity, address, callerName, phoneNumber, description, status, lat, lng)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.type, data.severity, data.address, data.callerName, data.phoneNumber, data.description, data.status, data.lat, data.lng);

  logAction(req.user!.id, req.user!.displayName, 'CREATE', 'Incidents', `Nuevo incidente: ${data.type} en ${data.address}`);

  res.json({ id, ...data });
});

router.patch("/:id", authenticateToken, requirePermission('incidents'), (req: AuthRequest, res) => {
  const result = incidentSchema.partial().safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

  const validated = result.data as any;
  const keys = Object.keys(validated);
  if (keys.length === 0) return res.status(400).json({ error: "Nada para actualizar" });

  const setClause = keys.map(k => `${k} = ?`).join(", ");
  const values = keys.map(k => validated[k]);

  db.prepare(`UPDATE incidents SET ${setClause} WHERE id = ?`).run(...values, req.params.id);

  logAction(req.user!.id, req.user!.displayName, 'UPDATE', 'Incidents', `Incidente ID: ${req.params.id} actualizado (${keys.join(", ")})`);

  res.json({ success: true });
});

export default router;
