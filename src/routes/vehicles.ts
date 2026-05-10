import { Router } from 'express';
import { db } from '../db/schema';
import { authenticateToken, requirePermission } from '../middleware/auth';
import { z } from 'zod';
import { AuthRequest } from '../types';
import { getPagination, formatPaginatedResponse } from '../utils/pagination';
import { logAction } from '../utils/logger';
import crypto from 'crypto';

const router = Router();

const vehicleSchema = z.object({
  name: z.string().min(1),
  plate: z.string().min(1),
  type: z.string().optional(),
  model: z.string().optional(),
  year: z.number().optional(),
  status: z.enum(['available', 'busy', 'maintenance', 'out_of_service', 'en_servicio']).default('available'),
  lastMaintenance: z.string().optional(),
  nextMaintenance: z.string().optional(),
  insuranceExpiration: z.string().optional(),
  vtvExpiration: z.string().optional(),
  assignedStaff: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional()
});

const VEHICLE_WHITELIST = [
  'name', 'plate', 'type', 'model', 'year', 'status', 'lastMaintenance', 
  'nextMaintenance', 'insuranceExpiration', 'vtvExpiration', 
  'assignedStaff', 'lat', 'lng'
];

router.get("/", authenticateToken, requirePermission('fleet'), (req, res) => {
  const { page, limit, offset } = getPagination(req);
  const includeDeleted = req.query.includeDeleted === 'true' && req.user?.role === 'admin';
  
  const whereClause = includeDeleted ? "" : "WHERE status != 'deleted'";
  const total = (db.prepare(`SELECT COUNT(*) as count FROM vehicles ${whereClause}`).get() as any).count;
  const vehicles = db.prepare(`SELECT * FROM vehicles ${whereClause} LIMIT ? OFFSET ?`).all(limit, offset);
  
  res.json(formatPaginatedResponse(vehicles, total, { page, limit, offset }));
});

router.post("/", authenticateToken, requirePermission('fleet'), (req: AuthRequest, res) => {
  const result = vehicleSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

  const id = crypto.randomUUID();
  const data = result.data;

  try {
    db.prepare(`
      INSERT INTO vehicles (
        id, name, plate, type, model, year, status, lastMaintenance, 
        nextMaintenance, insuranceExpiration, vtvExpiration, 
        assignedStaff, lat, lng
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, data.name, data.plate, data.type, data.model, data.year, 
      data.status, data.lastMaintenance, data.nextMaintenance, 
      data.insuranceExpiration, data.vtvExpiration, data.assignedStaff, 
      data.lat, data.lng
    );

    logAction(req.user!.id, req.user!.displayName, 'CREATE', 'Fleet', `Vehículo ${data.name} registrado (${data.plate})`);

    res.json({ id, ...data });
  } catch (error: any) {
    if (error.message.includes('UNIQUE')) return res.status(400).json({ error: "Ya existe un vehículo con esa patente" });
    throw error;
  }
});

router.patch("/:id", authenticateToken, requirePermission('fleet'), (req: AuthRequest, res) => {
  const updates = req.body;
  const keys = Object.keys(updates);
  for (const key of keys) {
    if (!VEHICLE_WHITELIST.includes(key)) return res.status(400).json({ error: `Campo no permitido: ${key}` });
  }

  const result = vehicleSchema.partial().safeParse(updates);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

  const validated = result.data as any;
  const validKeys = Object.keys(validated);
  if (validKeys.length === 0) return res.status(400).json({ error: "Nada para actualizar" });

  const setClause = validKeys.map(k => `${k} = ?`).join(", ");
  const values = validKeys.map(k => validated[k]);

  db.prepare(`UPDATE vehicles SET ${setClause} WHERE id = ?`).run(...values, req.params.id);

  logAction(req.user!.id, req.user!.displayName, 'UPDATE', 'Fleet', `Vehículo ID: ${req.params.id} actualizado. Campos: ${validKeys.join(", ")}`);

  res.json({ success: true });
});

router.delete("/:id", authenticateToken, requirePermission('fleet'), (req: AuthRequest, res) => {
  const vehicle = db.prepare("SELECT * FROM vehicles WHERE id = ?").get(req.params.id) as any;
  if (!vehicle) return res.status(404).json({ error: "Vehículo no encontrado" });

  if (vehicle.status === 'en_servicio') {
    return res.status(400).json({ error: "No se puede eliminar un vehículo que está actualmente en servicio" });
  }

  db.prepare("UPDATE vehicles SET status = 'deleted' WHERE id = ?").run(req.params.id);
  
  logAction(req.user!.id, req.user!.displayName, 'DELETE', 'Fleet', `Vehículo eliminado: ${vehicle.name} (${vehicle.plate}) (ID: ${req.params.id})`);

  res.json({ success: true, message: "Vehículo eliminado del sistema" });
});

export default router;
