import { Router } from 'express';
import { db } from '../db';
import { authenticateToken, requirePermission } from '../middleware/auth';
import { AuthRequest } from '../../types/auth';
import crypto from 'crypto';
import { rentalSchema } from '../schemas/rentals';

const router = Router();

router.get("/", authenticateToken, (req, res) => {
  const rentals = db.prepare("SELECT * FROM rentals ORDER BY startTime ASC").all();
  res.json(rentals);
});

router.post("/", authenticateToken, requirePermission('rentals'), (req: AuthRequest, res) => {
  try {
    const result = rentalSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

    const rental = { id: crypto.randomUUID(), ...result.data };
    db.prepare(`
      INSERT INTO rentals (id, customerName, customerPhone, startTime, endTime, price, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(rental.id, rental.customerName, rental.customerPhone, rental.startTime, rental.endTime, rental.price, rental.status);
    res.json(rental);
  } catch (error) {
    res.status(500).json({ error: "Error al crear alquiler" });
  }
});

router.patch("/:id", authenticateToken, requirePermission('rentals'), (req: AuthRequest, res) => {
  const { paymentStatus } = req.body;
  db.prepare("UPDATE rentals SET paymentStatus = ? WHERE id = ?").run(paymentStatus, req.params.id);
  res.json({ success: true });
});

router.delete("/:id", authenticateToken, requirePermission('rentals'), (req: AuthRequest, res) => {
  db.prepare("DELETE FROM rentals WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

export default router;
