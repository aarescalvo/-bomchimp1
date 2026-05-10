import { Router } from 'express';
import { db, JWT_SECRET } from '../db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Demasiados intentos de login. Esperá 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1, "Usuario es requerido"),
  password: z.string().min(1, "Contraseña es requerida")
});

router.post("/login", loginLimiter, (req, res) => {
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
      permissions,
      mustChangePassword: user.mustChangePassword === 1
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

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres")
});

router.patch("/change-password", (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "No autenticado" });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const result = changePasswordSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

    const { currentPassword, newPassword } = result.data;
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(payload.id) as any;

    if (!user || !bcrypt.compareSync(currentPassword, user.password)) {
      return res.status(401).json({ error: "Contraseña actual incorrecta" });
    }

    const hashedNewPassword = bcrypt.hashSync(newPassword, 10);
    db.prepare("UPDATE users SET password = ?, mustChangePassword = 0 WHERE id = ?").run(hashedNewPassword, user.id);

    res.json({ success: true, message: "Contraseña actualizada recientemente" });
  } catch (error) {
    res.status(401).json({ error: "Sesión inválida" });
  }
});

export default router;
