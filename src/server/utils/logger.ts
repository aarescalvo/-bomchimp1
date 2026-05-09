import { db } from '../db';
import crypto from 'crypto';

export function logAction(userId: string, userName: string, action: string, module: string, details: string) {
  db.prepare("INSERT INTO audit_logs (id, userId, userName, action, module, details) VALUES (?, ?, ?, ?, ?, ?)")
    .run(crypto.randomUUID(), userId, userName, action, module, details);
}
