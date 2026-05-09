import { Router } from 'express';
import { db } from '../db/schema';
import { authenticateToken, requirePermission } from '../middleware/auth';
import { z } from 'zod';
import { AuthRequest } from '../types';
import { getPagination, formatPaginatedResponse } from '../utils/pagination';
import { logAction } from '../utils/logger';
import crypto from 'crypto';

const router = Router();

const salidaSchema = z.object({
  incidenteId: z.string().optional(),
  tipoServicio: z.enum(['incendio', 'rescate', 'accidente_transito', 'alarma', 'apoyo', 'otro']),
  vehiculoId: z.string().optional(),
  tripulacion: z.array(z.object({
    firefighterId: z.string(),
    nombre: z.string(),
    rol: z.string()
  })),
  jefeServicio: z.string().min(1),
  direccion: z.string().optional(),
  horaDespacho: z.string(),
  kmSalida: z.number().optional()
});

router.get("/", authenticateToken, requirePermission('salidas'), (req, res) => {
  const { page, limit, offset } = getPagination(req);
  const { estado, fecha } = req.query;

  let query = "SELECT * FROM salidas ";
  let countQuery = "SELECT COUNT(*) as count FROM salidas ";
  const params: any[] = [];
  const filters: string[] = [];

  if (estado) {
    filters.push("estado = ?");
    params.push(estado);
  }
  if (fecha) {
    filters.push("date(horaDespacho) = ?");
    params.push(fecha);
  }

  if (filters.length > 0) {
    query += "WHERE " + filters.join(" AND ") + " ";
    countQuery += "WHERE " + filters.join(" AND ") + " ";
  }

  query += "ORDER BY horaDespacho DESC LIMIT ? OFFSET ?";
  
  const total = (db.prepare(countQuery).get(...params) as any).count;
  const data = db.prepare(query).all(...params, limit, offset);

  res.json(formatPaginatedResponse(data, total, { page, limit, offset }));
});

router.post("/", authenticateToken, requirePermission('salidas'), (req: AuthRequest, res) => {
  const result = salidaSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

  const id = crypto.randomUUID();
  const data = result.data;

  try {
    db.transaction(() => {
      db.prepare(`
        INSERT INTO salidas (
          id, incidenteId, tipoServicio, vehiculoId, tripulacion, 
          jefeServicio, direccion, horaDespacho, kmSalida, estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'en_curso')
      `).run(
        id, data.incidenteId, data.tipoServicio, data.vehiculoId, 
        JSON.stringify(data.tripulacion), data.jefeServicio, 
        data.direccion, data.horaDespacho, data.kmSalida
      );

      if (data.vehiculoId) {
        // Change vehicle status to busy/en_servicio
        db.prepare("UPDATE vehicles SET status = 'en_servicio' WHERE id = ?").run(data.vehiculoId);
      }
    })();
    
    logAction(req.user!.id, req.user!.displayName, 'CREATE', 'Salidas', `Salida operativa registrada: ${data.tipoServicio} - Jefe: ${data.jefeServicio}`);

    res.json({ id, ...data, estado: 'en_curso' });
  } catch (error) {
    res.status(500).json({ error: "Error al registrar salida" });
  }
});

router.patch("/:id/finalizar", authenticateToken, requirePermission('salidas'), (req: AuthRequest, res) => {
  const schema = z.object({
    horaRegreso: z.string(),
    kmRegreso: z.number(),
    combustibleCargado: z.number().optional().default(0),
    observaciones: z.string().optional()
  });

  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

  const data = result.data;
  const salida = db.prepare("SELECT * FROM salidas WHERE id = ?").get(req.params.id) as any;
  if (!salida) return res.status(404).json({ error: "Salida no encontrada" });

  try {
    db.transaction(() => {
      db.prepare(`
        UPDATE salidas SET 
          horaRegreso = ?, kmRegreso = ?, combustibleCargado = ?, 
          observaciones = ?, estado = 'finalizado' 
        WHERE id = ?
      `).run(data.horaRegreso, data.kmRegreso, data.combustibleCargado, data.observaciones, req.params.id);

      if (salida.vehiculoId) {
        db.prepare("UPDATE vehicles SET status = 'available', lastMaintenance = date('now') WHERE id = ?").run(salida.vehiculoId);
      }
    })();
    
    logAction(req.user!.id, req.user!.displayName, 'UPDATE', 'Salidas', `Salida operativa finalizada ID: ${req.params.id}`);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error al finalizar salida" });
  }
});

export default router;
