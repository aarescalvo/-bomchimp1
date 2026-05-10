import { Router } from 'express';
import { db } from '../db';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get("/counts", authenticateToken, (req, res) => {
  try {
    const alertsCount = db.prepare("SELECT COUNT(*) as count FROM notifications WHERE readAt IS NULL").get() as any;
    const itemsMinRec = db.prepare("SELECT COUNT(*) as count FROM inventory WHERE quantity <= minStock").get() as any;
    const expiredVehicles = db.prepare("SELECT COUNT(*) as count FROM vehicles WHERE vtvExpiration < date('now') OR insuranceExpiration < date('now')").get() as any;
    
    res.json({
      alertas: alertsCount?.count || 0,
      guardia: 0, 
      mantenimiento: (itemsMinRec?.count || 0) + (expiredVehicles?.count || 0)
    });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener conteos" });
  }
});

router.get("/", authenticateToken, (req, res) => {
  try {
    const notifications = db.prepare(`
      SELECT * FROM notifications 
      ORDER BY createdAt DESC
    `).all();
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener notificaciones" });
  }
});

router.patch("/:id/read", authenticateToken, (req, res) => {
  try {
    db.prepare("UPDATE notifications SET readAt = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error al marcar como leída" });
  }
});

export default router;
