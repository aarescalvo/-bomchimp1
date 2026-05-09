import { Router } from 'express';
import { db } from '../db';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get("/", authenticateToken, (req, res) => {
  const users = db.prepare("SELECT id, username, displayName, role, email FROM users").all();
  res.json(users);
});

export default router;
