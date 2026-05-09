import { Router } from 'express';
import { db, JWT_SECRET } from '../db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1, "Usuario es requerido"),
  password: z.string().min(1, "Contraseña es requerida")
});

router.post("/login", (req, res) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.issues[0].message });
    }

    const { username, password } = result.data;
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as any;

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const permissions = JSON.parse(user.permissions || '["dashboard"]');
    const token = jwt.sign({ 
      id: user.id, 
      username: user.username, 
      role: user.role, 
      displayName: user.displayName,
      permissions
    }, JWT_SECRET);

    res.cookie("token", token, { 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.json({ 
      id: user.id, 
      username: user.username, 
      role: user.role, 
      displayName: user.displayName,
      permissions
    });
  } catch (error) {
    res.status(500).json({ error: "Error en el servidor" });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ success: true });
});

router.get("/me", (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "No hay sesión activa" });
  try {
    const user = jwt.verify(token, JWT_SECRET);
    res.json(user);
  } catch {
    res.status(401).json({ error: "Sesión expirada" });
  }
});

export default router;
