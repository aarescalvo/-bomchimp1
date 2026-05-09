import { Router } from 'express';
import { db } from '../db/schema';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { UserRow } from '../types';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;

const loginSchema = z.object({
  username: z.string().min(1, "Usuario es requerido"),
  password: z.string().min(1, "Contraseña es requerida")
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres")
});

router.post("/login", (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message });
  }

  const { username, password } = result.data;
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as UserRow;

  if (!user || !bcrypt.compareSync(password, user.password || '')) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  // Pre-check for forced password change
  if (user.mustChangePassword) {
    return res.json({ mustChangePassword: true, userId: user.id });
  }

  const permissions = JSON.parse(user.permissions || '[]');
  const token = jwt.sign({ 
    id: user.id, 
    username: user.username, 
    role: user.role, 
    displayName: user.displayName,
    permissions
  }, JWT_SECRET, { expiresIn: '8h' });

  res.cookie("token", token, { 
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 8 * 60 * 60 * 1000 // 8 hours
  });

  res.json({ 
    id: user.id, 
    username: user.username, 
    role: user.role, 
    displayName: user.displayName,
    permissions
  });
});

router.post("/change-password-forced", (req, res) => {
  const schema = z.object({
    userId: z.string(),
    newPassword: z.string().min(6)
  });
  
  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

  const { userId, newPassword } = result.data;
  const hashedPassword = bcrypt.hashSync(newPassword, 10);

  db.prepare("UPDATE users SET password = ?, mustChangePassword = 0 WHERE id = ?")
    .run(hashedPassword, userId);

  res.json({ success: true, message: "Contraseña actualizada. Inicie sesión nuevamente." });
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
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sesión expirada', code: 'TOKEN_EXPIRED' });
    }
    res.status(401).json({ error: "Sesión inválida" });
  }
});

export default router;
