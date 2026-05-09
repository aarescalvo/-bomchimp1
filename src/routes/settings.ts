import { Router } from 'express';
import { db } from '../db/schema';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

router.get("/", authenticateToken, (req, res) => {
  const settings = db.prepare("SELECT * FROM ui_settings").all();
  const obj: Record<string, any> = {};
  settings.forEach((s: any) => {
    try {
      obj[s.key] = JSON.parse(s.value);
    } catch {
      obj[s.key] = s.value;
    }
  });
  res.json(obj);
});

router.post("/", authenticateToken, requireAdmin, (req, res) => {
  const { key, value } = req.body;
  const val = typeof value === 'object' ? JSON.stringify(value) : value;
  db.prepare("INSERT OR REPLACE INTO ui_settings (key, value) VALUES (?, ?)")
    .run(key, val);
  res.json({ success: true });
});

router.get("/audit", authenticateToken, requireAdmin, (req, res) => {
  const logs = db.prepare("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100").all();
  res.json(logs);
});

export default router;
