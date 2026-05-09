import { db } from './schema';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export function seedDb() {
  const adminExists = db.prepare("SELECT * FROM users WHERE username = ?").get("admin");
  
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync("admin123", 10);
    
    // UI Settings default
    db.prepare("INSERT OR IGNORE INTO ui_settings (key, value) VALUES (?, ?)")
      .run("theme", JSON.stringify({ 
        primaryColor: "#ef4444", 
        borderRadius: "32px", 
        compactMode: false, 
        fontScale: 1.0 
      }));
    
    db.prepare("INSERT OR IGNORE INTO ui_settings (key, value) VALUES (?, ?)")
      .run("menu_labels", JSON.stringify({
        dashboard: "Resumen", 
        incidents: "Incidencias", 
        inventory: "Inventario", 
        agenda: "Agenda", 
        finances: "Caja", 
        rentals: "Alquileres", 
        staff: "Guardia", 
        fleet: "Parque Automotor", 
        personnel: "Cuerpo Activo", 
        subsidies: "Subsidios", 
        reports: "Informes"
      }));

    // Admin User with all permissions (using the stringified array as requested)
    // mustChangePassword: 1 (true) for first login shift as per 1.4
    db.prepare(`
      INSERT INTO users (id, username, password, displayName, role, permissions, mustChangePassword) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(), 
      "admin", 
      hashedPassword, 
      "Administrador Sistema", 
      "admin", 
      JSON.stringify(['*']), 
      1
    );

    console.log("Seed: Admin user created (mustChangePassword enabled)");
  }
}
