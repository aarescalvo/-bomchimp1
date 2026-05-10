import { Router } from 'express';
import { db } from '../db';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get("/", (req, res) => {
  try {
    const settings = db.prepare("SELECT * FROM ui_settings").all();
    const config: any = {};
    settings.forEach((s: any) => {
      try {
        config[s.key] = JSON.parse(s.value);
      } catch {
        config[s.key] = s.value;
      }
    });
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener configuración" });
  }
});

router.post("/", authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Solo admins" });
  try {
    const { key, value } = req.body;
    db.prepare("INSERT OR REPLACE INTO ui_settings (key, value) VALUES (?, ?)")
      .run(key, JSON.stringify(value));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error al guardar configuración" });
  }
});

export default router;
