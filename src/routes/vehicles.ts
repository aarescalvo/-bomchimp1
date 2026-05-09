import { Router } from 'express';
import { db } from '../db/schema';
import { authenticateToken, requirePermission } from '../middleware/auth';
import { z } from 'zod';
import { AuthRequest } from '../types';
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
  const vehicles = db.prepare("SELECT * FROM vehicles").all();
  res.json(vehicles);
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

    res.json({ id, ...data });
  } catch (error: any) {
    if (error.message.includes('UNIQUE')) return res.status(400).json({ error: "Ya existe un vehículo con esa patente" });
    throw error;
  }
});

router.patch("/:id", authenticateToken, requirePermission('fleet'), (req: AuthRequest, res) => {
  const updates = req.body;
  for (const key of Object.keys(updates)) {
    if (!VEHICLE_WHITELIST.includes(key)) return res.status(400).json({ error: `Campo no permitido: ${key}` });
  }

  const result = vehicleSchema.partial().safeParse(updates);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

  const validated = result.data as any;
  const keys = Object.keys(validated);
  if (keys.length === 0) return res.status(400).json({ error: "Nada para actualizar" });

  const setClause = keys.map(k => `${k} = ?`).join(", ");
  const values = keys.map(k => validated[k]);

  db.prepare(`UPDATE vehicles SET ${setClause} WHERE id = ?`).run(...values, req.params.id);

  res.json({ success: true });
});

export default router;
