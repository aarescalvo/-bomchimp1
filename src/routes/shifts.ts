import { Router } from 'express';
import { db } from '../db/schema';
import { authenticateToken } from '../middleware/auth';
import { AuthRequest } from '../types';
import crypto from 'crypto';

const router = Router();

router.get("/active", authenticateToken, (req, res) => {
  const shifts = db.prepare("SELECT * FROM shifts WHERE endTime IS NULL").all();
  res.json(shifts);
});

router.post("/", authenticateToken, (req: AuthRequest, res) => {
  try {
    const shift = {
      id: crypto.randomUUID(),
      userId: req.user!.id,
      userName: req.user!.displayName,
      startTime: new Date().toISOString(),
    };
    db.prepare("INSERT INTO shifts (id, userId, userName, startTime) VALUES (?, ?, ?, ?)")
      .run(shift.id, shift.userId, shift.userName, shift.startTime);
    res.json(shift);
  } catch (error) {
    res.status(500).json({ error: "Error al iniciar guardia" });
  }
});

router.patch("/:id", authenticateToken, (req: AuthRequest, res) => {
  try {
    const endTime = new Date().toISOString();
    db.prepare("UPDATE shifts SET endTime = ? WHERE id = ?").run(endTime, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error al finalizar guardia" });
  }
});

export default router;
