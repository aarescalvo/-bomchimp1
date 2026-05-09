import { Router } from 'express';
import { db } from '../db/schema';
import { authenticateToken, requirePermission } from '../middleware/auth';
import { z } from 'zod';
import { AuthRequest } from '../types';
import { getPagination, formatPaginatedResponse } from '../utils/pagination';
import crypto from 'crypto';

const router = Router();

const firefighterSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dni: z.string().min(7),
  birthDate: z.string().optional(),
  rank: z.string().optional(),
  bloodType: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  joinDate: z.string().optional(),
  status: z.enum(['active', 'inactive', 'retired']).default('active'),
  licenseExpiration: z.string().optional(),
  medicalExpiration: z.string().optional(),
  eppStatus: z.enum(['good', 'replacement_needed', 'expired']).default('good')
});

const FIREFIGHTER_WHITELIST = [
  'firstName', 'lastName', 'dni', 'birthDate', 'rank', 'bloodType', 
  'phone', 'email', 'joinDate', 'status', 'licenseExpiration', 
  'medicalExpiration', 'eppStatus'
];

router.get("/", authenticateToken, requirePermission('personnel'), (req, res) => {
  const { page, limit, offset } = getPagination(req);
  
  const total = (db.prepare("SELECT COUNT(*) as count FROM firefighters").get() as any).count;
  const firefighters = db.prepare("SELECT * FROM firefighters LIMIT ? OFFSET ?").all(limit, offset);
  
  res.json(formatPaginatedResponse(firefighters, total, { page, limit, offset }));
});

router.post("/", authenticateToken, requirePermission('personnel'), (req: AuthRequest, res) => {
  const result = firefighterSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

  const id = crypto.randomUUID();
  const data = result.data;

  try {
    db.prepare(`
      INSERT INTO firefighters (
        id, firstName, lastName, dni, birthDate, rank, bloodType, 
        phone, email, joinDate, status, licenseExpiration, 
        medicalExpiration, eppStatus
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, data.firstName, data.lastName, data.dni, data.birthDate, data.rank,
      data.bloodType, data.phone, data.email, data.joinDate, data.status,
      data.licenseExpiration, data.medicalExpiration, data.eppStatus
    );

    res.json({ id, ...data });
  } catch (error: any) {
    if (error.message.includes('UNIQUE')) return res.status(400).json({ error: "Ya existe un bombero con ese DNI" });
    throw error;
  }
});

router.patch("/:id", authenticateToken, requirePermission('personnel'), (req: AuthRequest, res) => {
  const updates = req.body;
  const keys = Object.keys(updates);
  
  // Whitelist check
  for (const key of keys) {
    if (!FIREFIGHTER_WHITELIST.includes(key)) {
      return res.status(400).json({ error: `Campo no permitido: ${key}` });
    }
  }

  const result = firefighterSchema.partial().safeParse(updates);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

  const validated = result.data as any;
  const setClause = keys.map(k => `${k} = ?`).join(", ");
  const values = keys.map(k => validated[k]);

  db.prepare(`UPDATE firefighters SET ${setClause} WHERE id = ?`)
    .run(...values, req.params.id);

  res.json({ success: true });
});

// Cursos IBNCA
router.get("/:id/cursos", authenticateToken, requirePermission('habilitaciones'), (req, res) => {
  const cursos = db.prepare(`
    SELECT *, 
    CASE 
      WHEN fechaVencimiento IS NULL THEN 'vigente'
      WHEN fechaVencimiento < date('now') THEN 'vencido'
      WHEN fechaVencimiento < date('now', '+30 days') THEN 'por_vencer'
      ELSE 'vigente'
    END as estadoCalculado
    FROM cursos_ibnca WHERE firefighterId = ?
  `).all(req.params.id);
  res.json(cursos);
});

router.post("/:id/cursos", authenticateToken, requirePermission('habilitaciones'), (req, res) => {
  const schema = z.object({
    nombreCurso: z.string().min(1),
    organismo: z.string().optional(),
    fechaAprobacion: z.string().optional(),
    fechaVencimiento: z.string().optional(),
    certificadoUrl: z.string().optional()
  });

  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

  const id = crypto.randomUUID();
  const data = result.data;

  db.prepare(`
    INSERT INTO cursos_ibnca (id, firefighterId, nombreCurso, organismo, fechaAprobacion, fechaVencimiento, certificadoUrl)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.params.id, data.nombreCurso, data.organismo, data.fechaAprobacion, data.fechaVencimiento, data.certificadoUrl);

  res.json({ id, ...data });
});

export default router;
