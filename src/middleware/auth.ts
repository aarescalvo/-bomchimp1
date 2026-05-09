import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("FATAL: JWT_SECRET environment variable is not defined.");
  process.exit(1);
}

const PERMISOS_POR_ROL: Record<string, string[]> = {
  admin: ['*'],
  jefe_cuerpo: ['dashboard', 'incidents', 'inventory', 'agenda', 'fleet', 'personnel', 'subsidies', 'reports', 'map', 'guardia', 'salidas', 'habilitaciones', 'cancha'],
  oficial: ['dashboard', 'incidents', 'inventory', 'agenda', 'fleet', 'personnel', 'reports', 'map', 'guardia', 'salidas', 'habilitaciones'],
  tesorero: ['dashboard', 'finances', 'subsidies', 'reports', 'cancha'],
  secretario: ['dashboard', 'agenda', 'personnel', 'reports'],
  operador_guardia: ['dashboard', 'incidents', 'guardia', 'salidas', 'map'],
  bombero: ['dashboard', 'guardia'],
};

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: "No autorizado", code: 'NO_TOKEN' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Sesión expirada', 
        code: 'TOKEN_EXPIRED' 
      });
    }
    res.status(403).json({ error: "Token inválido", code: 'INVALID_TOKEN' });
  }
};

export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "No autorizado" });

    const role = req.user.role;
    const userPermissions = req.user.permissions || [];
    const rolePermissions = PERMISOS_POR_ROL[role] || [];

    // Check if user has explicit permission or role has it, or if it's admin '*'
    const hasPermission = 
      rolePermissions.includes('*') || 
      rolePermissions.includes(permission) || 
      userPermissions.includes(permission);

    if (hasPermission) {
      return next();
    }

    res.status(403).json({ 
      error: `Acceso denegado. Se requiere permiso: ${permission}`,
      code: 'FORBIDDEN'
    });
  };
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: "Acceso restringido a administradores" });
  }
  next();
};
