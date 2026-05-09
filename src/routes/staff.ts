import { Router } from 'express';
import { db } from '../db/schema';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get("/", authenticateToken, (req, res) => {
  // Return active firefighters as staff
  const staff = db.prepare("SELECT id, firstName, lastName, rank FROM firefighters WHERE status = 'active'").all();
  res.json(staff);
});

export default router;
