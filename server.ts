import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import crypto from 'crypto';

// Modular Imports
import { db, initDb } from "./src/server/db";
import authRoutes from "./src/server/routes/auth";
import firefighterRoutes from "./src/server/routes/firefighters";
import vehicleRoutes from "./src/server/routes/vehicles";
import incidentRoutes from "./src/server/routes/incidents";
import inventoryRoutes from "./src/server/routes/inventory";
import alertRoutes from "./src/server/routes/alerts";
import subsidyRoutes from "./src/server/routes/subsidies";
import userRoutes from "./src/server/routes/users";
import auditRoutes from "./src/server/routes/audit";
import agendaRoutes from "./src/server/routes/agenda";
import financeRoutes from "./src/server/routes/finances";
import rentalRoutes from "./src/server/routes/rentals";
import staffRoutes from "./src/server/routes/staff";
import shiftRoutes from "./src/server/routes/shifts";
import settingsRoutes from "./src/server/routes/settings";
import attendanceRoutes from "./src/server/routes/attendance";
import exportRoutes from "./src/server/routes/export";
import guardLogRoutes from "./src/server/routes/guard_log";
import notificationRoutes from "./src/server/routes/notifications";
import { setupCronJobs } from "./src/server/utils/cron";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize DB
  initDb();

  // Initialize Cron Jobs
  setupCronJobs();

  // Seed Admin User
  const adminExists = db.prepare("SELECT * FROM users WHERE username = ?").get("admin");
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync("admin123", 10);
    const allPerms = JSON.stringify([
      "dashboard", "incidents", "inventory", "agenda", "finances", 
      "rentals", "staff", "fleet", "personnel", "settings", 
      "reports", "subsidies", "attendance"
    ]);

    db.prepare("INSERT OR IGNORE INTO ui_settings (key, value) VALUES (?, ?)")
      .run("theme", JSON.stringify({ primaryColor: "#ef4444", borderRadius: "32px", compactMode: false, fontScale: 1.0 }));
    
    db.prepare("INSERT OR IGNORE INTO ui_settings (key, value) VALUES (?, ?)")
      .run("menu_labels", JSON.stringify({
        dashboard: "Resumen", incidents: "Incidencias", inventory: "Inventario", 
        agenda: "Agenda", finances: "Caja", rentals: "Alquileres", 
        staff: "Guardia", fleet: "Parque Automotor", personnel: "Cuerpo Activo", 
        subsidies: "Subsidios", reports: "Informes", attendance: "Presentismo"
      }));

    db.prepare("INSERT INTO users (id, username, password, displayName, role, permissions, mustChangePassword) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(crypto.randomUUID(), "admin", hashedPassword, "Cte. Juan Diaz", "admin", allPerms, 1);
  }

  // Middleware
  app.use(express.json());
  app.use(cookieParser());

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/firefighters", firefighterRoutes);
  app.use("/api/vehicles", vehicleRoutes);
  app.use("/api/incidents", incidentRoutes);
  app.use("/api/inventory", inventoryRoutes);
  app.use("/api/alerts", alertRoutes);
  app.use("/api/subsidies", subsidyRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/audit", auditRoutes);
  app.use("/api/agenda", agendaRoutes);
  app.use("/api/finances", financeRoutes);
  app.use("/api/rentals", rentalRoutes);
  app.use("/api/staff", staffRoutes);
  app.use("/api/shifts", shiftRoutes);
  app.use("/api/ui-settings", settingsRoutes);
  app.use("/api/attendance", attendanceRoutes);
  app.use("/api/export", exportRoutes);
  app.use("/api/guard-log", guardLogRoutes);
  app.use("/api/notifications", notificationRoutes);

  // Global Error Handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${err.message}`);
    res.status(500).json({ 
      error: "Error interno del servidor", 
      detail: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚒 SISTEMA PROFESIONAL DE BOMBEROS LOCAL ACTIVO`);
    console.log(`🌐 Acceso en red: http://LOCAL_IP:3000`);
    console.log(`🛡️ Seguridad: SQL Injection protection, Zod validation, Modular architecture enabled.\n`);
  });
}

startServer();
