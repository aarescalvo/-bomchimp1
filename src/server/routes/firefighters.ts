import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, requirePermission } from '../middleware/auth';
import { logAction } from '../utils/logger';
import { firefighterSchema, firefighterUpdateSchema } from '../schemas/firefighters';
import { AuthRequest } from '../../types/auth';
import crypto from 'crypto';

import { getPaginationParams, formatPaginatedResponse, FIREFIGHTER_UPDATABLE_FIELDS } from '../utils/helpers';

const router = Router();

router.get("/", authenticateToken, requirePermission('personnel'), (req, res) => {
  try {
    const { page, limit, offset } = getPaginationParams(req);
    const search = req.query.search as string;
    const status = req.query.status as string;

    let query = "FROM firefighters WHERE 1=1";
    const params: any[] = [];

    if (search) {
      query += " AND (firstName LIKE ? OR lastName LIKE ? OR dni LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) {
      query += " AND status = ?";
      params.push(status);
    }

    const total = (db.prepare(`SELECT COUNT(*) as count ${query}`).get(...params) as any).count;
    const data = db.prepare(`SELECT * ${query} LIMIT ? OFFSET ?`).all(...params, limit, offset) as any[];

    const formatted = data.map((f: any) => ({ 
      ...f, 
      trainings: JSON.parse(f.trainings || '[]') 
    }));

    res.json(formatPaginatedResponse(formatted, total, page, limit));
  } catch (error) {
    res.status(500).json({ error: "Error al obtener bomberos" });
  }
});

router.post("/", authenticateToken, requirePermission('personnel'), (req: AuthRequest, res) => {
  try {
    const result = firefighterSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.issues[0].message });
    }

    const data = result.data;
    const f = { 
      id: crypto.randomUUID(), 
      ...data, 
      trainings: JSON.stringify(data.trainings || []) 
    };

    db.prepare(`
      INSERT INTO firefighters (
        id, firstName, lastName, dni, birthDate, rank, bloodType, 
        phone, email, joinDate, status, trainings, 
        licenseExpiration, medicalExpiration, eppStatus
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      f.id, f.firstName, f.lastName, f.dni, f.birthDate, f.rank, f.bloodType,
      f.phone, f.email, f.joinDate, f.status, f.trainings,
      f.licenseExpiration, f.medicalExpiration, f.eppStatus
    );

    logAction(req.user!.id, req.user!.displayName, "CREATE", "personnel", `Alta bombero: ${f.firstName} ${f.lastName}`);
    res.json(f);
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: "Ya existe un bombero con ese DNI" });
    }
    res.status(500).json({ error: "Error al crear bombero" });
  }
});

router.patch("/:id", authenticateToken, requirePermission('personnel'), (req: AuthRequest, res) => {
  try {
    const result = firefighterUpdateSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.issues[0].message });
    }

    const updates = result.data as any;
    if (updates.trainings) updates.trainings = JSON.stringify(updates.trainings);
    
    // SQL INJECTION PREVENTION: Validar keys contra whitelist
    const keys = Object.keys(updates).filter(k => FIREFIGHTER_UPDATABLE_FIELDS.includes(k));
    
    if (keys.length === 0) {
      return res.status(400).json({ error: "No se proporcionaron campos válidos para actualizar" });
    }

    const setClause = keys.map(k => `${k} = ?`).join(", ");
    const values = keys.map(k => updates[k]);

    db.prepare(`UPDATE firefighters SET ${setClause} WHERE id = ?`)
      .run(...values, req.params.id);
    
    logAction(req.user!.id, req.user!.displayName, "UPDATE", "personnel", `Modificación bombero ID: ${req.params.id}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar bombero" });
  }
});

router.delete("/:id", authenticateToken, requirePermission('personnel'), (req: AuthRequest, res) => {
  try {
    db.prepare("UPDATE firefighters SET status = 'inactive' WHERE id = ?").run(req.params.id);
    logAction(req.user!.id, req.user!.displayName, "DELETE", "personnel", `Baja lógica bombero ID: ${req.params.id}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar bombero" });
  }
});

export default router;
