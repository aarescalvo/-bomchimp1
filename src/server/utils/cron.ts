import cron from 'node-cron';
import { db } from '../db';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Job de Vencimientos (Diario 8:00 AM)
export function setupCronJobs() {
  cron.schedule('0 8 * * *', async () => {
    console.log('[CRON] Iniciando verificación de vencimientos...');
    await checkExpirations();
  });

  // Job de Backup (Diario 3:00 AM)
  cron.schedule('0 3 * * *', async () => {
    console.log('[CRON] Realizando backup de base de datos...');
    await performBackup();
  });
}

async function checkExpirations() {
  const alerts: { type: string, msg: string, target: string, date: string }[] = [];
  
  // 1. Vehículos (VTV e Seguros)
  const vehicles = db.prepare("SELECT id, name, plate, vtvExpiration, insuranceExpiration FROM vehicles WHERE status != 'deleted'").all() as any[];
  vehicles.forEach(v => {
    if (isSoon(v.vtvExpiration)) alerts.push({ type: 'vtv', msg: `VTV por vencer: ${v.name} (${v.plate})`, target: v.id, date: v.vtvExpiration });
    if (isSoon(v.insuranceExpiration)) alerts.push({ type: 'insurance', msg: `Seguro por vencer: ${v.name} (${v.plate})`, target: v.id, date: v.insuranceExpiration });
  });

  // 2. Personal (Licencias y Médicos)
  const firefighters = db.prepare("SELECT id, firstName, lastName, licenseExpiration, medicalExpiration FROM firefighters WHERE status = 'active'").all() as any[];
  firefighters.forEach(f => {
    if (isSoon(f.licenseExpiration)) alerts.push({ type: 'license', msg: `Licencia por vencer: ${f.firstName} ${f.lastName}`, target: f.id, date: f.licenseExpiration });
    if (isSoon(f.medicalExpiration)) alerts.push({ type: 'medical', msg: `Habilitación médica por vencer: ${f.firstName} ${f.lastName}`, target: f.id, date: f.medicalExpiration });
  });

  // Guardar en tabla de notificaciones
  for (const alert of alerts) {
    db.prepare(`
      INSERT OR IGNORE INTO notifications (id, type, message, dueDate, targetId)
      VALUES (?, ?, ?, ?, ?)
    `).run(crypto.randomUUID(), alert.type, alert.msg, alert.date, alert.target);
  }

  // Enviar Email si está configurado
  if (process.env.SMTP_HOST && alerts.length > 0) {
    await sendAlertEmail(alerts);
  }
}

function isSoon(dateStr: string) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const diff = d.getTime() - new Date().getTime();
  const days = diff / (1000 * 60 * 60 * 24);
  return days > 0 && days <= 30; // Alerta si vence en menos de 30 días
}

async function sendAlertEmail(alerts: any[]) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const body = alerts.map(a => `- ${a.msg} (Vence: ${a.date})`).join('\n');

    await transporter.sendMail({
      from: `"SGB Bomberos" <${process.env.SMTP_USER}>`,
      to: process.env.ALERT_EMAIL_TO,
      subject: `Alerta de Vencimientos - ${new Date().toLocaleDateString()}`,
      text: `Se han detectado los siguientes vencimientos próximos:\n\n${body}\n\nPor favor revise el sistema para más detalles.`,
    });
    console.log('[CRON] Emails de alerta enviados.');
  } catch (err) {
    console.error('[CRON] Error enviando email:', err);
  }
}

export async function performBackup() {
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `bomberos_${timestamp}.db`);

  try {
    fs.copyFileSync('bomberos.db', backupFile);
    console.log(`[BACKUP] Creado: ${backupFile}`);

    // Limpiar antiguos (mantener últimos 30)
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('bomberos_'))
      .map(f => ({ name: f, time: fs.statSync(path.join(backupDir, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time);

    if (files.length > 30) {
      files.slice(30).forEach(f => {
        fs.unlinkSync(path.join(backupDir, f.name));
        console.log(`[BACKUP] Eliminado backup antiguo: ${f.name}`);
      });
    }
  } catch (err) {
    console.error('[BACKUP] Error:', err);
  }
}
