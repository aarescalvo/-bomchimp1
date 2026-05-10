import { Router } from 'express';
import { db } from '../db';
import { authenticateToken, requirePermission } from '../middleware/auth';
import { logAction } from '../utils/logger';
import { AuthRequest } from '../../types/auth';
import crypto from 'crypto';
import { incidentSchema } from '../schemas/incidents';

const router = Router();

router.get("/", authenticateToken, (req, res) => {
  const incidents = db.prepare("SELECT * FROM incidents ORDER BY timestamp DESC").all();
  res.json(incidents);
});

router.post("/", authenticateToken, requirePermission('incidents'), (req: AuthRequest, res) => {
  try {
    const result = incidentSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

    const incident = { id: crypto.randomUUID(), ...result.data, status: "open" };
    db.prepare(`
      INSERT INTO incidents (id, type, severity, address, callerName, phoneNumber, description, status, lat, lng) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      incident.id, incident.type, incident.severity, incident.address, 
      incident.callerName, incident.phoneNumber, incident.description, incident.status,
      incident.lat, incident.lng
    );

    logAction(req.user!.id, req.user!.displayName, "CREATE", "incidents", `Nuevo incidente: ${incident.type} en ${incident.address}`);
    res.json(incident);
  } catch (error) {
    res.status(500).json({ error: "Error al crear incidente" });
  }
});

router.patch("/:id", authenticateToken, requirePermission('incidents'), (req: AuthRequest, res) => {
  try {
    const { status } = req.body;
    if (!['open', 'closed', 'dispatched'].includes(status)) {
      return res.status(400).json({ error: "Estado inválido" });
    }

    db.prepare("UPDATE incidents SET status = ? WHERE id = ?").run(status, req.params.id);
    logAction(req.user!.id, req.user!.displayName, "UPDATE", "incidents", `Cambio estado incidente ${req.params.id} a ${status}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar incidente" });
  }
});

router.delete("/:id", authenticateToken, requirePermission('incidents'), (req: AuthRequest, res) => {
  try {
    db.prepare("DELETE FROM incidents WHERE id = ?").run(req.params.id);
    logAction(req.user!.id, req.user!.displayName, "DELETE", "incidents", `Eliminación incidente ID: ${req.params.id}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar incidente" });
  }
});

export default router;
