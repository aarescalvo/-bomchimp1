import { Router } from 'express';
import { db } from '../db/schema';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { z } from 'zod';
import { AuthRequest, UserRow } from '../types';
import { logAction } from '../utils/logger';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const router = Router();

const userSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6).optional(),
  displayName: z.string().min(1),
  role: z.enum(['admin', 'jefe_cuerpo', 'oficial', 'tesorero', 'secretario', 'operador_guardia', 'bombero']),
  email: z.string().email().optional().or(z.literal('')),
  permissions: z.array(z.string()).optional().default([])
});

router.get("/", authenticateToken, requireAdmin, (req, res) => {
  const users = db.prepare("SELECT id, username, displayName, role, email, permissions FROM users").all();
  res.json(users.map((u: any) => ({ ...u, permissions: JSON.parse(u.permissions || '[]') })));
});

router.post("/", authenticateToken, requireAdmin, (req: AuthRequest, res) => {
  const result = userSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

  const { username, password, displayName, role, email, permissions } = result.data;
  if (!password) return res.status(400).json({ error: "Contraseña requerida" });

  const id = crypto.randomUUID();
  const hashedPassword = bcrypt.hashSync(password, 10);

  try {
    db.prepare(`
      INSERT INTO users (id, username, password, displayName, role, email, permissions)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, username, hashedPassword, displayName, role, email, JSON.stringify(permissions));

    logAction(req.user!.id, req.user!.displayName, 'CREATE', 'Users', `Creado usuario: ${username} (${role})`);

    res.json({ id, username, displayName, role, email, permissions });
  } catch (error: any) {
    if (error.message.includes('UNIQUE')) return res.status(400).json({ error: "El usuario ya existe" });
    throw error;
  }
});

router.patch("/:id", authenticateToken, requireAdmin, (req: AuthRequest, res) => {
  const updates = req.body;
  const WHITELIST = ['displayName', 'role', 'email', 'permissions', 'password'];
  
  for (const key of Object.keys(updates)) {
    if (!WHITELIST.includes(key)) return res.status(400).json({ error: `Campo no permitido: ${key}` });
  }

  const result = userSchema.partial().safeParse(updates);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

  const validated = result.data as any;
  const keys = Object.keys(validated).filter(k => k !== 'password');
  
  if (validated.password) {
    const hp = bcrypt.hashSync(validated.password, 10);
    db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hp, req.params.id);
  }

  if (keys.length > 0) {
    const setClause = keys.map(k => `${k} = ?`).join(", ");
    const values = keys.map(k => k === 'permissions' ? JSON.stringify(validated[k]) : validated[k]);
    db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`).run(...values, req.params.id);
  }
  
  logAction(req.user!.id, req.user!.displayName, 'UPDATE', 'Users', `Actualizado usuario ID: ${req.params.id} (${Object.keys(updates).join(", ")})`);

  res.json({ success: true });
});

export default router;
