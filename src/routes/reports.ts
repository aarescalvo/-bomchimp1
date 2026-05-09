import { Router } from 'express';
import { db } from '../db/schema';
import { authenticateToken, requirePermission } from '../middleware/auth';

const router = Router();

router.get("/summary", authenticateToken, requirePermission('reports'), (req, res) => {
  const { mes, anio } = req.query;
  const period = `${anio}-${mes?.toString().padStart(2, '0')}`;

  // 1. Salidas por tipo
  const salidas = db.prepare(`
    SELECT tipoServicio, COUNT(*) as count 
    FROM salidas 
    WHERE strftime('%Y-%m', horaDespacho) = ?
    GROUP BY tipoServicio
  `).all(period);

  // 2. Ranking presentismo (shifts)
  const ranking = db.prepare(`
    SELECT userName, COUNT(*) as count, SUM(julianday(endTime) - julianday(startTime)) * 24 as totalHours
    FROM shifts 
    WHERE strftime('%Y-%m', startTime) = ? AND endTime IS NOT NULL
    GROUP BY userId
    ORDER BY totalHours DESC
  `).all(period);

  // 3. Habilitaciones resumen (Operational)
  const habilitaciones = db.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM firefighters WHERE status = 'active') as total,
      (SELECT COUNT(DISTINCT firefighterId) FROM cursos_ibnca WHERE nombreCurso = 'Nivel 1') as habilitados
  `).get() as any;

  res.json({
    salidas,
    ranking,
    habilitaciones: {
      total: habilitaciones.total,
      habilitados: habilitaciones.habilitados,
      porcentaje: habilitaciones.total > 0 ? (habilitaciones.habilitados / habilitaciones.total * 100) : 0
    }
  });
});

export default router;
