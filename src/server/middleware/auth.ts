import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../db';
import { AuthRequest, UserPayload } from '../../types/auth';

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "No autorizado" });

  try {
    const user = jwt.verify(token, JWT_SECRET) as UserPayload;
    req.user = user;
    next();
  } catch {
    res.status(403).json({ error: "Token inválido" });
  }
};

export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "No autorizado" });
    
    // Admin always has access
    if (req.user.role === 'admin') return next();
    
    if (req.user.permissions && req.user.permissions.includes(permission)) {
      return next();
    }
    res.status(403).json({ error: `Acceso denegado. Se requiere permiso: ${permission}` });
  };
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: "Acceso restringido a administradores" });
  }
  next();
};
