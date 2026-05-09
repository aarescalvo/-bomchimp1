import { Router } from 'express';
import { db } from '../db/schema';
import { authenticateToken, requirePermission, requireAdmin } from '../middleware/auth';
import { z } from 'zod';
import { AuthRequest } from '../types';
import { logAction } from '../utils/logger';
import crypto from 'crypto';

const router = Router();

const turnoSchema = z.object({
  fecha: z.string(),
  horaInicio: z.string(),
  horaFin: z.string(),
  clienteNombre: z.string().min(1),
  clienteTelefono: z.string().optional(),
  clienteDni: z.string().optional(),
  precioTotal: z.number().min(0),
  senia: z.number().optional().default(0),
  medioPagoSenia: z.string().optional(),
  notas: z.string().optional()
});

router.get("/disponibilidad", authenticateToken, (req, res) => {
  const { fecha } = req.query;
  if (!fecha) return res.status(400).json({ error: "Fecha requerida" });

  const turnos = db.prepare("SELECT * FROM turnos_cancha WHERE fecha = ? AND estado != 'cancelado'").all(fecha) as any[];
  const bloqueos = db.prepare("SELECT * FROM bloqueos_cancha WHERE fecha = ?").all(fecha) as any[];

  // Generate slots from 07:00 to 23:00
  const slots = [];
  for (let h = 7; h < 23; h++) {
    const hh = h.toString().padStart(2, '0');
    const time = `${hh}:00`;
    const nextTime = `${(h + 1).toString().padStart(2, '0')}:00`;

    const ocupado = turnos.find(t => t.horaInicio === time);
    const bloqueado = bloqueos.find(b => b.horaInicio === time);

    slots.push({
      time,
      endTime: nextTime,
      status: bloqueado ? 'bloqueado' : (ocupado ? ocupado.estado : 'libre'),
      data: ocupado || bloqueado || null
    });
  }

  res.json(slots);
});

router.get("/turnos", authenticateToken, (req, res) => {
  const { desde, hasta } = req.query;
  let query = "SELECT * FROM turnos_cancha ";
  let params: any[] = [];
  if (desde && hasta) {
    query += "WHERE fecha BETWEEN ? AND ? ";
    params.push(desde, hasta);
  }
  query += "ORDER BY fecha ASC, horaInicio ASC";
  res.json(db.prepare(query).all(...params));
});

router.post("/turnos", authenticateToken, requirePermission('cancha'), (req: AuthRequest, res) => {
  const result = turnoSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

  const data = result.data;
  const id = crypto.randomUUID();
  const saldoPendiente = data.precioTotal - data.senia;

  // Collision check
  const conflict = db.prepare(`
    SELECT id FROM turnos_cancha WHERE fecha = ? AND horaInicio = ? AND estado != 'cancelado'
    UNION
    SELECT id FROM bloqueos_cancha WHERE fecha = ? AND horaInicio = ?
  `).get(data.fecha, data.horaInicio, data.fecha, data.horaInicio);

  if (conflict) return res.status(400).json({ error: "El horario ya está ocupado o bloqueado" });

  try {
    db.transaction(() => {
      db.prepare(`
        INSERT INTO turnos_cancha (
          id, fecha, horaInicio, horaFin, clienteNombre, clienteTelefono, clienteDni, 
          estado, precioTotal, senia, saldoPendiente, medioPagoSenia, notas, creadoPor
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'reservado', ?, ?, ?, ?, ?, ?)
      `).run(
        id, data.fecha, data.horaInicio, data.horaFin, data.clienteNombre, 
        data.clienteTelefono, data.clienteDni, data.precioTotal, data.senia, 
        saldoPendiente, data.medioPagoSenia, data.notas, req.user!.displayName
      );

      if (data.senia > 0) {
        db.prepare(`
          INSERT INTO finances (id, amount, category, description, type, recordedBy)
          VALUES (?, ?, 'alquiler_cancha', ?, 'income', ?)
        `).run(crypto.randomUUID(), data.senia, `Seña cancha: ${data.clienteNombre} (${data.fecha})`, req.user!.displayName);
      }
    })();
    
    logAction(req.user!.id, req.user!.displayName, 'CREATE', 'Cancha', `Nueva reserva para ${data.clienteNombre} el ${data.fecha} ${data.horaInicio}`);

    res.json({ id, ...data, saldoPendiente });
  } catch (error) {
    res.status(500).json({ error: "Error al crear reserva" });
  }
});

router.patch("/turnos/:id/confirmar", authenticateToken, requirePermission('cancha'), (req: AuthRequest, res) => {
  db.prepare("UPDATE turnos_cancha SET estado = 'confirmado' WHERE id = ?").run(req.params.id);
  logAction(req.user!.id, req.user!.displayName, 'UPDATE', 'Cancha', `Confirmada reserva ID: ${req.params.id}`);
  res.json({ success: true });
});

router.patch("/turnos/:id/pagar-saldo", authenticateToken, requirePermission('cancha'), (req: AuthRequest, res) => {
  const schema = z.object({ medioPagoSaldo: z.string() });
  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

  const turno = db.prepare("SELECT * FROM turnos_cancha WHERE id = ?").get(req.params.id) as any;
  if (!turno) return res.status(404).json({ error: "Turno no encontrado" });

  try {
    db.transaction(() => {
      db.prepare("UPDATE turnos_cancha SET estado = 'pagado', saldoPendiente = 0, medioPagoSaldo = ? WHERE id = ?")
        .run(result.data.medioPagoSaldo, req.params.id);

      if (turno.saldoPendiente > 0) {
        db.prepare(`
          INSERT INTO finances (id, amount, category, description, type, recordedBy)
          VALUES (?, ?, 'alquiler_cancha', ?, 'income', ?)
        `).run(crypto.randomUUID(), turno.saldoPendiente, `Saldo cancha: ${turno.clienteNombre} (${turno.fecha})`, req.user!.displayName);
      }
    })();
    logAction(req.user!.id, req.user!.displayName, 'UPDATE', 'Cancha', `Cobrado saldo pendiente reserva ID: ${req.params.id}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error al registrar pago" });
  }
});

router.patch("/turnos/:id/cancelar", authenticateToken, requirePermission('cancha'), (req: AuthRequest, res) => {
  db.prepare("UPDATE turnos_cancha SET estado = 'cancelado' WHERE id = ?").run(req.params.id);
  logAction(req.user!.id, req.user!.displayName, 'DELETE', 'Cancha', `Cancelada reserva ID: ${req.params.id}`);
  res.json({ success: true });
});

router.post("/bloqueos", authenticateToken, requireAdmin, (req: AuthRequest, res) => {
  const schema = z.object({
    fecha: z.string(),
    horaInicio: z.string(),
    horaFin: z.string(),
    motivo: z.string().optional()
  });
  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

  const id = crypto.randomUUID();
  try {
    db.prepare("INSERT INTO bloqueos_cancha (id, fecha, horaInicio, horaFin, motivo) VALUES (?, ?, ?, ?, ?)")
      .run(id, result.data.fecha, result.data.horaInicio, result.data.horaFin, result.data.motivo);
    logAction(req.user!.id, req.user!.displayName, 'CREATE', 'Cancha', `Bloqueo de horario el ${result.data.fecha} ${result.data.horaInicio}`);
    res.json({ id, ...result.data });
  } catch (error) {
    res.status(500).json({ error: "Error al bloquear horario" });
  }
});

router.get("/tarifas", authenticateToken, (req, res) => {
  res.json(db.prepare("SELECT * FROM tarifas_cancha WHERE activo = 1").all());
});

router.post("/tarifas", authenticateToken, requireAdmin, (req: AuthRequest, res) => {
  const schema = z.object({
    nombre: z.string(),
    precio: z.number(),
    diaSemana: z.string().optional(),
    horaDesde: z.string().optional(),
    horaHasta: z.string().optional()
  });
  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

  const id = crypto.randomUUID();
  db.prepare("INSERT INTO tarifas_cancha (id, nombre, precio, diaSemana, horaDesde, horaHasta) VALUES (?, ?, ?, ?, ?, ?)")
    .run(id, result.data.nombre, result.data.precio, result.data.diaSemana, result.data.horaDesde, result.data.horaHasta);
  logAction(req.user!.id, req.user!.displayName, 'CREATE', 'Settings', `Nueva tarifa cancha: ${result.data.nombre}`);
  res.json({ id, ...result.data });
});

export default router;
