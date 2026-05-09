import { Router } from 'express';
import { db } from '../db';
import { authenticateToken } from '../middleware/auth';
import { differenceInDays, parseISO, isBefore } from 'date-fns';

const router = Router();

router.get("/expirations", authenticateToken, (req, res) => {
  try {
    const today = new Date();
    
    // Helper to calculate status
    const getStatus = (dueDateStr: string | null) => {
      if (!dueDateStr) return 'ok';
      const dueDate = parseISO(dueDateStr);
      if (isBefore(dueDate, today)) return 'expired';
      const daysLeft = differenceInDays(dueDate, today);
      if (daysLeft <= 30) return 'warning';
      return 'ok';
    };

    const firefighters = db.prepare(`
      SELECT id, firstName || ' ' || lastName as targetName, 'Licencia' as type, licenseExpiration as dueDate 
      FROM firefighters WHERE licenseExpiration IS NOT NULL AND status = 'active'
    `).all() as any[];

    const vehicleVtv = db.prepare(`
      SELECT id, name as targetName, 'VTV' as type, vtvExpiration as dueDate 
      FROM vehicles WHERE vtvExpiration IS NOT NULL AND status != 'out_of_service'
    `).all() as any[];

    const vehicleIns = db.prepare(`
      SELECT id, name as targetName, 'Seguro' as type, insuranceExpiration as dueDate 
      FROM vehicles WHERE insuranceExpiration IS NOT NULL AND status != 'out_of_service'
    `).all() as any[];

    const tanksHyd = db.prepare(`
      SELECT id, serialNumber as targetName, 'Prueba Hidrostática' as type, nextHydrostatic as dueDate 
      FROM scuba_tanks WHERE nextHydrostatic IS NOT NULL
    `).all() as any[];

    const allExpirations = [...firefighters, ...vehicleVtv, ...vehicleIns, ...tanksHyd].map(exp => ({
      ...exp,
      status: getStatus(exp.dueDate),
      daysLeft: exp.dueDate ? differenceInDays(parseISO(exp.dueDate), today) : null
    }));

    // Filter to show only warnings or expired by default or sort them
    res.json(allExpirations.sort((a, b) => {
      if (a.status === 'expired' && b.status !== 'expired') return -1;
      if (a.status !== 'expired' && b.status === 'expired') return 1;
      if (a.status === 'warning' && b.status === 'ok') return -1;
      if (a.status === 'ok' && b.status === 'warning') return 1;
      return 0;
    }));
  } catch (error) {
    res.status(500).json({ error: "Error al calcular vencimientos" });
  }
});

export default router;
