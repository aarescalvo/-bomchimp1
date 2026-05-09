import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import { initDb } from "./db/schema";
import { seedDb } from "./db/seed";

// Import modules
import authRoutes from "./routes/auth";
import firefighterRoutes from "./routes/firefighters";
import vehicleRoutes from "./routes/vehicles";
import incidentRoutes from "./routes/incidents";
import inventoryRoutes from "./routes/inventory";
import financeRoutes from "./routes/finances";
import rentalRoutes from "./routes/rentals";
import shiftRoutes from "./routes/shifts";
import guardiaRoutes from "./routes/guardia";
import salidaRoutes from "./routes/salidas";
import alertRoutes from "./routes/alerts";
import subsidyRoutes from "./routes/subsidies";
import userRoutes from "./routes/users";
import uiSettingsRoutes from "./routes/settings";
import reportRoutes from "./routes/reports";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

// Initialize Database
initDb();
seedDb();

// Middlewares
app.use(express.json());
app.use(cookieParser());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/firefighters", firefighterRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/finances", financeRoutes);
app.use("/api/cancha", rentalRoutes);
app.use("/api/shifts", shiftRoutes);
app.use("/api/guardia", guardiaRoutes);
app.use("/api/salidas", salidaRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/subsidies", subsidyRoutes);
app.use("/api/users", userRoutes);
app.use("/api/ui-settings", uiSettingsRoutes);
app.use("/api/reports", reportRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  
  if (err.message?.includes('UNIQUE constraint failed')) {
    return res.status(400).json({ error: "El registro ya existe (duplicado)" });
  }

  res.status(err.status || 500).json({ 
    error: err.message || "Error interno del servidor",
    code: err.code || 'INTERNAL_ERROR'
  });
});

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(__dirname, "../../dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`BomChimpay v2 backend running on http://0.0.0.0:${PORT}`);
});
