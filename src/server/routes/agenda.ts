import { Router } from 'express';
import { db } from '../db';
import { authenticateToken, requirePermission } from '../middleware/auth';
import { AuthRequest } from '../../types/auth';
import crypto from 'crypto';
import { agendaSchema } from '../schemas/agenda';

const router = Router();

router.get("/", authenticateToken, (req, res) => {
  const tasks = db.prepare("SELECT * FROM agenda ORDER BY dueDate ASC").all();
  res.json(tasks);
});

router.post("/", authenticateToken, requirePermission('agenda'), (req: AuthRequest, res) => {
  try {
    const result = agendaSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

    const task = { id: crypto.randomUUID(), ...result.data, status: "pending" };
    db.prepare(`
      INSERT INTO agenda (id, title, description, dueDate, priority, assignedTo, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(task.id, task.title, task.description, task.dueDate, task.priority, task.assignedTo, task.status);
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: "Error al crear tarea" });
  }
});

router.patch("/:id", authenticateToken, requirePermission('agenda'), (req: AuthRequest, res) => {
  const { status } = req.body;
  db.prepare("UPDATE agenda SET status = ? WHERE id = ?").run(status, req.params.id);
  res.json({ success: true });
});

router.delete("/:id", authenticateToken, requirePermission('agenda'), (req: AuthRequest, res) => {
  db.prepare("DELETE FROM agenda WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

export default router;
