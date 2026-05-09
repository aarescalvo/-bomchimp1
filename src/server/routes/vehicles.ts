import { Router } from 'express';
import { db } from '../db';
import { authenticateToken, requirePermission } from '../middleware/auth';
import { logAction } from '../utils/logger';
import { vehicleSchema, vehicleUpdateSchema } from '../schemas/vehicles';
import { AuthRequest } from '../../types/auth';
import crypto from 'crypto';

const router = Router();

const VEHICLE_FIELDS = [
  'name', 'plate', 'type', 'model', 'year', 'status', 
  'lastMaintenance', 'nextMaintenance', 'insuranceExpiration', 
  'vtvExpiration', 'assignedStaff', 'lat', 'lng'
];

router.get("/", authenticateToken, requirePermission('fleet'), (req, res) => {
  try {
    const vehicles = db.prepare("SELECT * FROM vehicles").all();
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener flota" });
  }
});

router.post("/", authenticateToken, requirePermission('fleet'), (req: AuthRequest, res) => {
  try {
    const result = vehicleSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.issues[0].message });
    }

    const v = { id: crypto.randomUUID(), ...result.data };
    db.prepare(`
      INSERT INTO vehicles (
        id, name, plate, type, model, year, status, 
        lastMaintenance, nextMaintenance, insuranceExpiration, 
        vtvExpiration, assignedStaff, lat, lng
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      v.id, v.name, v.plate, v.type, v.model, v.year, v.status,
      v.lastMaintenance, v.nextMaintenance, v.insuranceExpiration,
      v.vtvExpiration, v.assignedStaff, v.lat, v.lng
    );

    logAction(req.user!.id, req.user!.displayName, "CREATE", "fleet", `Alta móvil: ${v.name} (${v.plate})`);
    res.json(v);
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: "Ya existe un vehículo con esa patente" });
    }
    res.status(500).json({ error: "Error al crear vehículo" });
  }
});

router.patch("/:id", authenticateToken, requirePermission('fleet'), (req: AuthRequest, res) => {
  try {
    const result = vehicleUpdateSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.issues[0].message });
    }

    const updates = result.data as any;
    const keys = Object.keys(updates).filter(k => VEHICLE_FIELDS.includes(k));
    
    if (keys.length === 0) return res.status(400).json({ error: "Sin campos válidos" });

    const setClause = keys.map(k => `${k} = ?`).join(", ");
    db.prepare(`UPDATE vehicles SET ${setClause} WHERE id = ?`)
      .run(...keys.map(k => updates[k]), req.params.id);

    logAction(req.user!.id, req.user!.displayName, "UPDATE", "fleet", `Modificación móvil ID: ${req.params.id}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar vehículo" });
  }
});

router.delete("/:id", authenticateToken, requirePermission('fleet'), (req: AuthRequest, res) => {
  try {
    db.prepare("UPDATE vehicles SET status = 'out_of_service' WHERE id = ?").run(req.params.id);
    logAction(req.user!.id, req.user!.displayName, "DELETE", "fleet", `Baja lógica móvil ID: ${req.params.id}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar vehículo" });
  }
});

// Maintenance Logs within vehicle context
router.get("/:id/maintenance", authenticateToken, requirePermission('fleet'), (req, res) => {
  const logs = db.prepare("SELECT * FROM maintenance_logs WHERE vehicleId = ? ORDER BY date DESC").all(req.params.id);
  res.json(logs);
});

router.post("/:id/maintenance", authenticateToken, requirePermission('fleet'), (req: AuthRequest, res) => {
  try {
    const log = { id: crypto.randomUUID(), vehicleId: req.params.id, ...req.body };
    db.prepare(`
      INSERT INTO maintenance_logs (id, vehicleId, type, description, date, cost, technician, hours) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(log.id, log.vehicleId, log.type, log.description, log.date, log.cost, log.technician, log.hours);

    db.prepare("UPDATE vehicles SET lastMaintenance = ? WHERE id = ?").run(log.date, req.params.id);
    logAction(req.user!.id, req.user!.displayName, "CREATE", "fleet", `Mantenimiento registrado para móvil ID: ${req.params.id}`);
    res.json(log);
  } catch (error) {
    res.status(500).json({ error: "Error al registrar mantenimiento" });
  }
});

export default router;
