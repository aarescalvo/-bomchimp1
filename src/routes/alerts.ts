import { Router } from 'express';
import { db } from '../db/schema';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get("/vencimientos", authenticateToken, (req, res) => {
  const alerts: any[] = [];

  // 1. Licencias de bomberos
  const firefighters = db.prepare("SELECT id, firstName, lastName, licenseExpiration, medicalExpiration FROM firefighters WHERE status = 'active'").all() as any[];
  
  firefighters.forEach(f => {
    if (f.licenseExpiration) {
      alerts.push(calculateAlert(f.id, 'licencia', 'bombero', `${f.firstName} ${f.lastName} — Licencia`, f.licenseExpiration));
    }
    if (f.medicalExpiration) {
      alerts.push(calculateAlert(f.id, 'habilitacion_medica', 'bombero', `${f.firstName} ${f.lastName} — Médica`, f.medicalExpiration));
    }
  });

  // 2. VTV y Seguros de vehículos
  const vehicles = db.prepare("SELECT id, name, nextMaintenance, insuranceExpiration, vtvExpiration FROM vehicles WHERE status != 'out_of_service'").all() as any[];
  
  vehicles.forEach(v => {
    if (v.vtvExpiration) {
      alerts.push(calculateAlert(v.id, 'vtv', 'vehiculo', `${v.name} — VTV`, v.vtvExpiration));
    }
    if (v.insuranceExpiration) {
      alerts.push(calculateAlert(v.id, 'seguro', 'vehiculo', `${v.name} — Seguro`, v.insuranceExpiration));
    }
    if (v.nextMaintenance) {
      alerts.push(calculateAlert(v.id, 'mantenimiento', 'vehiculo', `${v.name} — Mantenimiento`, v.nextMaintenance));
    }
  });

  // 3. Cilindros (Hydrostatic)
  const tanks = db.prepare("SELECT id, serialNumber, nextHydrostatic FROM scuba_tanks").all() as any[];
  tanks.forEach(t => {
    if (t.nextHydrostatic) {
      alerts.push(calculateAlert(t.id, 'hidrostática', 'cilindro', `Tubo ${t.serialNumber}`, t.nextHydrostatic));
    }
  });

  // 4. Cursos IBNCA
  const cursos = db.prepare(`
    SELECT c.id, c.nombreCurso, c.fechaVencimiento, f.firstName, f.lastName, f.id as fId
    FROM cursos_ibnca c
    JOIN firefighters f ON c.firefighterId = f.id
    WHERE c.fechaVencimiento IS NOT NULL
  `).all() as any[];
  
  cursos.forEach(c => {
    alerts.push(calculateAlert(c.id, 'curso_ibnca', 'bombero', `${c.firstName} ${c.lastName} — ${c.nombreCurso}`, c.fechaVencimiento));
  });

  // Sort by daysRestantes ASC
  alerts.sort((a, b) => a.diasRestantes - b.diasRestantes);

  res.json(alerts);
});

function calculateAlert(entidadId: string, tipo: string, entidad: string, nombre: string, fechaVencimiento: string) {
  const diffTime = new Date(fechaVencimiento).getTime() - new Date().getTime();
  const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let estado: 'vencido' | 'critico' | 'proximo' | 'vigente' = 'vigente';
  if (diasRestantes < 0) estado = 'vencido';
  else if (diasRestantes <= 30) estado = 'critico';
  else if (diasRestantes <= 90) estado = 'proximo';

  return {
    id: `${entidadId}-${tipo}`,
    tipo,
    entidad,
    entidadId,
    nombre,
    fechaVencimiento,
    diasRestantes,
    estado
  };
}

router.get("/counts", authenticateToken, (req, res) => {
  // 1. Alertas Críticas (Vencidas o < 30 días)
  // Reusing calculateAlert logic for counts
  const allAlerts: any[] = [];
  
  // Reuse code from /vencimientos to get allAlerts (I should refactor but for simplicity...)
  const firefighters = db.prepare("SELECT licenseExpiration, medicalExpiration FROM firefighters WHERE status = 'active'").all() as any[];
  firefighters.forEach(f => {
    if (f.licenseExpiration) allAlerts.push(calculateAlert('', 'licencia', '', '', f.licenseExpiration));
    if (f.medicalExpiration) allAlerts.push(calculateAlert('', 'médica', '', '', f.medicalExpiration));
  });
  const vehicles = db.prepare("SELECT insuranceExpiration, vtvExpiration, nextMaintenance FROM vehicles WHERE status != 'out_of_service'").all() as any[];
  vehicles.forEach(v => {
    if (v.vtvExpiration) allAlerts.push(calculateAlert('', 'vtv', '', '', v.vtvExpiration));
    if (v.insuranceExpiration) allAlerts.push(calculateAlert('', 'seguro', '', '', v.insuranceExpiration));
    if (v.nextMaintenance) allAlerts.push(calculateAlert('', 'mantenimiento', '', '', v.nextMaintenance));
  });

  const alertsCount = allAlerts.filter(a => a.estado === 'vencido' || a.estado === 'critico').length;

  // 2. Guardia (Urgentes últimas 24h no leídas)
  const guardiaCount = (db.prepare(`
    SELECT COUNT(*) as count FROM guardia_logs 
    WHERE prioridad = 'urgente' 
    AND isRead = 0 
    AND timestamp >= datetime('now', '-24 hours')
  `).get() as any).count;

  // 3. Mantenimiento (Vehículos con mantenimiento vencido)
  const maintenanceCount = (db.prepare(`
    SELECT COUNT(*) as count FROM vehicles 
    WHERE nextMaintenance < date('now') 
    AND status != 'out_of_service'
  `).get() as any).count;

  res.json({
    alertas: alertsCount,
    guardia: guardiaCount,
    mantenimiento: maintenanceCount
  });
});

export default router;
