import { Router } from 'express';
import { db } from '../db/schema';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { UserRow, AuthRequest } from '../types';
import { authenticateToken } from '../middleware/auth';
import { logAction } from '../utils/logger';
import rateLimit from 'express-rate-limit';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'default-refresh-secret';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per window
  message: { 
    error: "Demasiados intentos de inicio de sesión. Intentá de nuevo en 15 minutos.", 
    code: "TOO_MANY_REQUESTS" 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginSchema = z.object({
  username: z.string().min(1, "Usuario es requerido"),
  password: z.string().min(1, "Contraseña es requerida")
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres")
});

router.post("/login", loginLimiter, (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message });
  }

  const { username, password } = result.data;
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as UserRow;

  if (!user || !bcrypt.compareSync(password, user.password || '')) {
    logAction('system', 'System', 'LOGIN_FAILED', 'Auth', `Intento fallido para usuario: ${username} (IP: ${req.ip})`);
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  // Pre-check for forced password change
  if (user.mustChangePassword) {
    return res.json({ mustChangePassword: true, userId: user.id });
  }

  const permissions = JSON.parse(user.permissions || '[]');
  const payload = { 
    id: user.id, 
    username: user.username, 
    role: user.role, 
    displayName: user.displayName,
    permissions
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
  const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: '7d' });

  res.cookie("token", token, { 
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 8 * 60 * 60 * 1000 // 8 hours
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.json(payload);
});

router.post("/refresh", (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ error: "No refresh token", code: 'NO_REFRESH' });

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as { id: string };
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(decoded.id) as UserRow;
    
    if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

    const permissions = JSON.parse(user.permissions || '[]');
    const payload = { 
      id: user.id, 
      username: user.username, 
      role: user.role, 
      displayName: user.displayName,
      permissions
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    res.cookie("token", token, { 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000 // 8 hours
    });

    res.json(payload);
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Refresh token expirado', code: 'REFRESH_EXPIRED' });
    }
    res.status(401).json({ error: "Refresh token inválido" });
  }
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

router.patch("/change-password", authenticateToken, (req: AuthRequest, res) => {
  const result = changePasswordSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

  const { currentPassword, newPassword } = result.data;
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user!.id) as UserRow;

  if (!user || !bcrypt.compareSync(currentPassword, user.password || '')) {
    return res.status(400).json({ error: "La contraseña actual es incorrecta" });
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedPassword, user.id);

  logAction(req.user!.id, req.user!.displayName, 'UPDATE_PASSWORD', 'Auth', 'Usuario cambió su propia contraseña');

  res.json({ success: true, message: "Contraseña actualizada correctamente" });
});

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.clearCookie("refreshToken");
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
