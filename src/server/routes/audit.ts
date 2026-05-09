import { Router } from 'express';
import { db } from '../db';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get("/", authenticateToken, (req, res) => {
  try {
    const logs = db.prepare("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 200").all();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener auditoría" });
  }
});

export default router;
