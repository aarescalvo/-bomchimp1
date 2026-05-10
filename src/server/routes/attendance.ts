import { Router } from 'express';
import { db } from '../db';
import { authenticateToken } from '../middleware/auth';
import { logAction } from '../utils/logger';
import { AuthRequest } from '../../types/auth';
import crypto from 'crypto';

const router = Router();

// Check-in
router.post("/", authenticateToken, (req: AuthRequest, res) => {
  try {
    const { firefighterId, activityType, notes } = req.body;
    if (!firefighterId || !activityType) return res.status(400).json({ error: "Datos incompletos" });

    // Check if already checked in
    const active = db.prepare("SELECT * FROM attendance WHERE firefighterId = ? AND checkOut IS NULL").get(firefighterId);
    if (active) return res.status(400).json({ error: "El bombero ya tiene una guardia activa" });

    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO attendance (id, firefighterId, checkIn, activityType, notes, registeredBy, registeredByName)
      VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?)
    `).run(id, firefighterId, activityType, notes || '', req.user!.id, req.user!.displayName);

    logAction(req.user!.id, req.user!.displayName, "CREATE", "attendance", `Entrada bombero ID: ${firefighterId}`);
    res.json({ id, success: true });
  } catch (error) {
    res.status(500).json({ error: "Error al registrar entrada" });
  }
});

// Check-out
router.patch("/:id/checkout", authenticateToken, (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const session = db.prepare("SELECT * FROM attendance WHERE id = ?").get(id) as any;
    if (!session) return res.status(404).json({ error: "Sesión no encontrada" });
    if (session.checkOut) return res.status(400).json({ error: "La sesión ya está cerrada" });

    db.prepare(`
      UPDATE attendance SET checkOut = CURRENT_TIMESTAMP, notes = COALESCE(?, notes)
      WHERE id = ?
    `).run(notes || null, id);

    logAction(req.user!.id, req.user!.displayName, "UPDATE", "attendance", `Salida bombero ID: ${session.firefighterId}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error al registrar salida" });
  }
});

// Summary
router.get("/summary", authenticateToken, (req, res) => {
  const { month } = req.query; // YYYY-MM
  if (!month) return res.status(400).json({ error: "Mes requerido" });

  try {
    const firefighters = db.prepare("SELECT id, firstName, lastName, rank FROM firefighters WHERE status = 'active'").all() as any[];
    
    const summary = firefighters.map(f => {
      const records = db.prepare(`
        SELECT attendance.*, 
        (julianday(checkOut) - julianday(checkIn)) * 24 as hours
        FROM attendance 
        WHERE firefighterId = ? AND strftime('%Y-%m', checkIn) = ? AND checkOut IS NOT NULL
      `).all(f.id, month) as any[];

      const totalHours = records.reduce((acc, curr) => acc + curr.hours, 0);
      
      // Get requirements
      const reqConfig = db.prepare(`
        SELECT requiredHours FROM monthly_hour_requirements 
        WHERE (firefighterId = ? OR firefighterId IS NULL)
        AND (month = ? OR month IS NULL)
        ORDER BY firefighterId DESC, month DESC LIMIT 1
      `).get(f.id, month) as any;

      const requiredHours = reqConfig ? reqConfig.requiredHours : 40;
      
      let complianceStatus: 'ok' | 'at_risk' | 'non_compliant' = 'ok';
      const percent = (totalHours / requiredHours) * 100;
      
      const isEndMonth = new Date().toISOString().split('T')[0].startsWith(month as string) === false; // Check if it's a past month
      
      if (percent >= 100) complianceStatus = 'ok';
      else if (isEndMonth) complianceStatus = 'non_compliant';
      else if (percent < 50) complianceStatus = 'non_compliant'; // Or logic based on day of month
      else complianceStatus = 'at_risk';

      const byActivityType: any = { guard: 0, training: 0, drill: 0, maintenance: 0, special: 0 };
      records.forEach(r => {
        if (byActivityType[r.activityType] !== undefined) {
          byActivityType[r.activityType] += r.hours;
        }
      });

      return {
        firefighterId: f.id,
        name: `${f.firstName} ${f.lastName}`,
        rank: f.rank,
        totalHours: Math.round(totalHours * 10) / 10,
        requiredHours,
        hoursRemaining: Math.max(0, requiredHours - totalHours),
        complianceStatus,
        sessions: records.length,
        byActivityType
      };
    });

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: "Error al generar resumen" });
  }
});

export default router;
