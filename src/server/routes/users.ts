import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { logAction } from '../utils/logger';
import { AuthRequest } from '../../types/auth';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { userSchema, userUpdateSchema } from '../schemas/users';

const router = Router();

router.get("/", authenticateToken, requireAdmin, (req, res) => {
  const users = db.prepare("SELECT id, username, displayName, role, email, permissions FROM users").all();
  res.json(users.map((u: any) => ({ ...u, permissions: JSON.parse(u.permissions || '[]') })));
});

router.post("/", authenticateToken, requireAdmin, (req: AuthRequest, res) => {
  try {
    const result = userSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

    const { username, password, displayName, role, permissions } = result.data;
    const email = (result.data as any).email || '';

    const hashedPassword = bcrypt.hashSync(password, 10);
    const id = crypto.randomUUID();
    
    db.prepare(`
      INSERT INTO users (id, username, password, displayName, role, email, permissions) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, username, hashedPassword, displayName, role, email, JSON.stringify(permissions));
    
    logAction(req.user!.id, req.user!.displayName, "CREATE", "settings", `Creación operador: ${username}`);
    res.json({ id, username, displayName, role, email, permissions });
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed')) return res.status(400).json({ error: "El usuario ya existe" });
    res.status(500).json({ error: "Error al crear usuario" });
  }
});

router.patch("/:id", authenticateToken, requireAdmin, (req: AuthRequest, res) => {
  try {
    const result = userUpdateSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

    const updates = result.data as any;
    const fields = ['displayName', 'role', 'email', 'permissions'];
    const keys = Object.keys(updates).filter(k => fields.includes(k));
    
    if (updates.password) {
      const hashedPassword = bcrypt.hashSync(updates.password, 10);
      db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedPassword, req.params.id);
    }

    if (keys.length > 0) {
      const setClause = keys.map(k => `${k} = ?`).join(", ");
      const values = keys.map(k => k === 'permissions' ? JSON.stringify(updates[k]) : updates[k]);
      db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`).run(...values, req.params.id);
    }

    logAction(req.user!.id, req.user!.displayName, "UPDATE", "settings", `Modificación operador ID: ${req.params.id}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
});

router.delete("/:id", authenticateToken, requireAdmin, (req: AuthRequest, res) => {
  try {
    if (req.params.id === req.user!.id) return res.status(400).json({ error: "No puedes eliminar tu propio usuario" });
    db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
    logAction(req.user!.id, req.user!.displayName, "DELETE", "settings", `Eliminación operador ID: ${req.params.id}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
});

export default router;
