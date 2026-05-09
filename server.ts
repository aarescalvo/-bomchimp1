import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("bomberos.db");
const JWT_SECRET = "bomberos-secret-key-local-123";

// Inicializar Base de Datos
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT,
    displayName TEXT,
    role TEXT,
    email TEXT,
    permissions TEXT DEFAULT '["dashboard"]'
  );

  CREATE TABLE IF NOT EXISTS firefighters (
    id TEXT PRIMARY KEY,
    firstName TEXT,
    lastName TEXT,
    dni TEXT UNIQUE,
    birthDate DATE,
    rank TEXT,
    bloodType TEXT,
    phone TEXT,
    email TEXT,
    joinDate DATE,
    status TEXT DEFAULT 'active',
    trainings TEXT DEFAULT '[]',
    licenseExpiration DATE,
    medicalExpiration DATE,
    eppStatus TEXT DEFAULT 'good' -- status of the fire suit
  );

  CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    name TEXT,
    plate TEXT UNIQUE,
    type TEXT,
    model TEXT,
    year INTEGER,
    status TEXT DEFAULT 'available',
    lastMaintenance DATE,
    nextMaintenance DATE,
    insuranceExpiration DATE,
    vtvExpiration DATE,
    assignedStaff TEXT,
    lat REAL,
    lng REAL
  );

  CREATE TABLE IF NOT EXISTS scuba_tanks (
    id TEXT PRIMARY KEY,
    serialNumber TEXT UNIQUE,
    capacity REAL,
    lastHydrostatic DATE,
    nextHydrostatic DATE,
    pressure INTEGER,
    status TEXT DEFAULT 'ready'
  );

  CREATE TABLE IF NOT EXISTS expirations (
    id TEXT PRIMARY KEY,
    type TEXT, -- 'license', 'vtv', 'insurance', 'hydrostatic'
    targetName TEXT,
    dueDate DATE,
    status TEXT DEFAULT 'pending',
    linkId TEXT -- reference to vehicle or firefighter
  );

  CREATE TABLE IF NOT EXISTS vehicle_tools (
    id TEXT PRIMARY KEY,
    vehicleId TEXT,
    name TEXT,
    quantity INTEGER,
    status TEXT DEFAULT 'operational',
    FOREIGN KEY (vehicleId) REFERENCES vehicles(id)
  );

  CREATE TABLE IF NOT EXISTS maintenance_logs (
    id TEXT PRIMARY KEY,
    vehicleId TEXT,
    type TEXT, -- 'preventive' or 'corrective'
    description TEXT,
    date DATE,
    cost REAL,
    technician TEXT,
    hours INTEGER, -- use hours or mileage? Let's say generic hours/km
    FOREIGN KEY (vehicleId) REFERENCES vehicles(id)
  );

  CREATE TABLE IF NOT EXISTS ui_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS subsidies (
    id TEXT PRIMARY KEY,
    name TEXT,
    origin TEXT,
    resolutionNumber TEXT,
    amount REAL,
    receivedDate DATE,
    expirationDate DATE,
    status TEXT DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS subsidy_expenses (
    id TEXT PRIMARY KEY,
    subsidyId TEXT,
    category TEXT,
    description TEXT,
    amount REAL,
    invoiceNumber TEXT,
    vendor TEXT,
    date DATE,
    userId TEXT,
    userName TEXT,
    attachmentUrl TEXT,
    FOREIGN KEY (subsidyId) REFERENCES subsidies(id)
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    userId TEXT,
    userName TEXT,
    action TEXT,
    module TEXT,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS incidents (
    id TEXT PRIMARY KEY,
    type TEXT,
    severity TEXT,
    address TEXT,
    callerName TEXT,
    phoneNumber TEXT,
    description TEXT,
    status TEXT,
    lat REAL,
    lng REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY,
    name TEXT,
    category TEXT,
    quantity INTEGER,
    unit TEXT,
    minStock INTEGER
  );

  CREATE TABLE IF NOT EXISTS shifts (
    id TEXT PRIMARY KEY,
    userId TEXT,
    userName TEXT,
    startTime DATETIME DEFAULT CURRENT_TIMESTAMP,
    endTime DATETIME
  );

  CREATE TABLE IF NOT EXISTS agenda (
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    dueDate DATETIME,
    priority TEXT,
    assignedTo TEXT,
    status TEXT DEFAULT 'pending'
  );

  CREATE TABLE IF NOT EXISTS finances (
    id TEXT PRIMARY KEY,
    amount REAL,
    category TEXT,
    description TEXT,
    type TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    recordedBy TEXT
  );

  CREATE TABLE IF NOT EXISTS rentals (
    id TEXT PRIMARY KEY,
    customerName TEXT,
    customerPhone TEXT,
    startTime DATETIME,
    endTime DATETIME,
    price REAL,
    paymentStatus TEXT DEFAULT 'pending'
  );
`);

// Insertar usuario administrador por defecto si no existe
const adminExists = db.prepare("SELECT * FROM users WHERE username = ?").get("admin");
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync("admin123", 10);
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
      reports: "Informes",
      map: "Mapa Táctico"
    }));

  const allPerms = JSON.stringify(["dashboard", "incidents", "inventory", "agenda", "finances", "rentals", "staff", "fleet", "personnel", "settings", "reports", "subsidies", "map"]);
  db.prepare("INSERT INTO users (id, username, password, displayName, role, permissions) VALUES (?, ?, ?, ?, ?, ?)")
    .run(crypto.randomUUID(), "admin", hashedPassword, "Cte. Juan Diaz", "admin", allPerms);
}

function logAction(userId: string, userName: string, action: string, module: string, details: string) {
  db.prepare("INSERT INTO audit_logs (id, userId, userName, action, module, details) VALUES (?, ?, ?, ?, ?, ?)")
    .run(crypto.randomUUID(), userId, userName, action, module, details);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // Middleware de Autenticación
  const authenticateToken = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "No autorizado" });

    try {
      const user = jwt.verify(token, JWT_SECRET) as any;
      req.user = user;
      next();
    } catch {
      res.status(403).json({ error: "Token inválido" });
    }
  };

  const requirePermission = (permission: string) => {
    return (req: any, res: any, next: any) => {
      // El administrador siempre tiene acceso total
      if (req.user && req.user.role === 'admin') return next();
      
      if (req.user && req.user.permissions && req.user.permissions.includes(permission)) {
        return next();
      }
      res.status(403).json({ error: `Acceso denegado. Se requiere permiso: ${permission}` });
    };
  };

  // --- API ROUTES ---

  // Auth
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as any;

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = jwt.sign({ 
      id: user.id, 
      username: user.username, 
      role: user.role, 
      displayName: user.displayName,
      permissions: JSON.parse(user.permissions || '["dashboard"]')
    }, JWT_SECRET);
    res.cookie("token", token, { httpOnly: true });
    res.json({ 
      id: user.id, 
      username: user.username, 
      role: user.role, 
      displayName: user.displayName,
      permissions: JSON.parse(user.permissions || '["dashboard"]')
    });
  });

  // --- NEW MODULES ---

  // Firefighters (Personal)
  app.get("/api/firefighters", authenticateToken, requirePermission('personnel'), (req, res) => {
    const firefighters = db.prepare("SELECT * FROM firefighters").all();
    res.json(firefighters.map((f: any) => ({ ...f, trainings: JSON.parse(f.trainings || '[]') })));
  });

  app.post("/api/firefighters", authenticateToken, requirePermission('personnel'), (req: any, res) => {
    const f = { id: crypto.randomUUID(), ...req.body, trainings: JSON.stringify(req.body.trainings || []) };
    db.prepare(`INSERT INTO firefighters (id, firstName, lastName, dni, birthDate, rank, bloodType, phone, email, joinDate, status, trainings) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(f.id, f.firstName, f.lastName, f.dni, f.birthDate, f.rank, f.bloodType, f.phone, f.email, f.joinDate, f.status, f.trainings);
    logAction(req.user.id, req.user.displayName, "CREATE", "personnel", `Alta bombero: ${f.firstName} ${f.lastName}`);
    res.json(f);
  });

  app.patch("/api/firefighters/:id", authenticateToken, requirePermission('personnel'), (req: any, res) => {
    const updates = req.body;
    if (updates.trainings) updates.trainings = JSON.stringify(updates.trainings);
    
    const keys = Object.keys(updates);
    const setClause = keys.map(k => `${k} = ?`).join(", ");
    db.prepare(`UPDATE firefighters SET ${setClause} WHERE id = ?`).run(...Object.values(updates), req.params.id);
    
    logAction(req.user.id, req.user.displayName, "UPDATE", "personnel", `Modificación bombero ID: ${req.params.id}`);
    res.json({ success: true });
  });

  // Fleet (Vehicles)
  app.get("/api/vehicles", authenticateToken, requirePermission('fleet'), (req, res) => {
    const vehicles = db.prepare("SELECT * FROM vehicles").all();
    res.json(vehicles);
  });

  app.post("/api/vehicles", authenticateToken, requirePermission('fleet'), (req: any, res) => {
    const v = { id: crypto.randomUUID(), lat: -39.0664, lng: -66.1439, ...req.body };
    db.prepare(`INSERT INTO vehicles (id, name, plate, type, model, year, status, lastMaintenance, nextMaintenance, assignedStaff, lat, lng) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(v.id, v.name, v.plate, v.type, v.model, v.year, v.status, v.lastMaintenance, v.nextMaintenance, v.assignedStaff, v.lat, v.lng);
    logAction(req.user.id, req.user.displayName, "CREATE", "fleet", `Alta móvil: ${v.name} (${v.plate})`);
    res.json(v);
  });

  app.get("/api/vehicles/:id/tools", authenticateToken, requirePermission('fleet'), (req, res) => {
    const tools = db.prepare("SELECT * FROM vehicle_tools WHERE vehicleId = ?").all(req.params.id);
    res.json(tools);
  });

  app.post("/api/vehicles/:id/tools", authenticateToken, requirePermission('fleet'), (req: any, res) => {
    const tool = { id: crypto.randomUUID(), vehicleId: req.params.id, ...req.body };
    db.prepare("INSERT INTO vehicle_tools (id, vehicleId, name, quantity, status) VALUES (?, ?, ?, ?, ?)")
      .run(tool.id, tool.vehicleId, tool.name, tool.quantity, tool.status);
    res.json(tool);
  });

  app.get("/api/vehicles/:id/maintenance", authenticateToken, requirePermission('fleet'), (req, res) => {
    const logs = db.prepare("SELECT * FROM maintenance_logs WHERE vehicleId = ?").all(req.params.id);
    res.json(logs);
  });

  app.post("/api/vehicles/:id/maintenance", authenticateToken, requirePermission('fleet'), (req: any, res) => {
    const log = { id: crypto.randomUUID(), vehicleId: req.params.id, ...req.body };
    db.prepare("INSERT INTO maintenance_logs (id, vehicleId, type, description, date, cost, technician, hours) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(log.id, log.vehicleId, log.type, log.description, log.date, log.cost, log.technician, log.hours);
    
    // Auto-update lastMaintenance in vehicle
    db.prepare("UPDATE vehicles SET lastMaintenance = ? WHERE id = ?").run(log.date, req.params.id);
    
    logAction(req.user.id, req.user.displayName, "CREATE", "fleet", `Mantenimiento ${log.type} registrado para móvil ID: ${req.params.id}`);
    res.json(log);
  });

  // Users Management (Operadores)
  app.get("/api/users", authenticateToken, (req, res) => {
    const users = db.prepare("SELECT id, username, displayName, role, email, permissions FROM users").all();
    res.json(users.map((u: any) => ({ ...u, permissions: JSON.parse(u.permissions || '[]') })));
  });

  // SCUBA Tanks
  app.get("/api/scuba", authenticateToken, requirePermission('fleet'), (req, res) => {
    const tanks = db.prepare("SELECT * FROM scuba_tanks").all();
    res.json(tanks);
  });

  app.post("/api/scuba", authenticateToken, requirePermission('fleet'), (req: any, res) => {
    const tank = { id: crypto.randomUUID(), ...req.body };
    db.prepare("INSERT INTO scuba_tanks (id, serialNumber, capacity, lastHydrostatic, nextHydrostatic, pressure, status) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(tank.id, tank.serialNumber, tank.capacity, tank.lastHydrostatic, tank.nextHydrostatic, tank.pressure, tank.status);
    logAction(req.user.id, req.user.displayName, "CREATE", "fleet", `Nuevo cilindro ERA: ${tank.serialNumber}`);
    res.json(tank);
  });

  // Expirations Unified View
  app.get("/api/alerts/expirations", authenticateToken, (req, res) => {
    // Generate dynamic expirations from other tables for real-time monitoring
    const firefighterExpirations = db.prepare("SELECT id, firstName || ' ' || lastName as targetName, 'Licencia' as type, licenseExpiration as dueDate FROM firefighters WHERE licenseExpiration IS NOT NULL").all();
    const vehicleVtv = db.prepare("SELECT id, name as targetName, 'VTV' as type, vtvExpiration as dueDate FROM vehicles WHERE vtvExpiration IS NOT NULL").all();
    const vehicleIns = db.prepare("SELECT id, name as targetName, 'Seguro' as type, insuranceExpiration as dueDate FROM vehicles WHERE insuranceExpiration IS NOT NULL").all();
    const tanksHyd = db.prepare("SELECT id, serialNumber as targetName, 'Prueba Hidrostática' as type, nextHydrostatic as dueDate FROM scuba_tanks WHERE nextHydrostatic IS NOT NULL").all();
    
    res.json([...firefighterExpirations, ...vehicleVtv, ...vehicleIns, ...tanksHyd]);
  });

  // Subsidies
  app.get("/api/subsidies", authenticateToken, (req, res) => {
    const subsidies = db.prepare("SELECT * FROM subsidies ORDER BY receivedDate DESC").all();
    res.json(subsidies);
  });

  app.get("/api/subsidies/summary", authenticateToken, (req, res) => {
    const totalReceived = db.prepare("SELECT SUM(amount) as total FROM subsidies").get() as any;
    const totalSpent = db.prepare("SELECT SUM(amount) as total FROM subsidy_expenses").get() as any;
    res.json({
      totalReceived: totalReceived.total || 0,
      totalSpent: totalSpent.total || 0,
    });
  });

  app.post("/api/subsidies", authenticateToken, requirePermission('subsidies'), (req: any, res) => {
    const subsidy = { id: crypto.randomUUID(), ...req.body };
    db.prepare("INSERT INTO subsidies (id, name, origin, resolutionNumber, amount, receivedDate, expirationDate, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(subsidy.id, subsidy.name, subsidy.origin, subsidy.resolutionNumber, subsidy.amount, subsidy.receivedDate, subsidy.expirationDate, subsidy.status);
    logAction(req.user.id, req.user.displayName, "CREATE", "finances", `Nuevo subsidio: ${subsidy.name}`);
    res.json(subsidy);
  });

  app.get("/api/subsidies/:id/expenses", authenticateToken, requirePermission('subsidies'), (req, res) => {
    const expenses = db.prepare("SELECT * FROM subsidy_expenses WHERE subsidyId = ? ORDER BY date DESC").all(req.params.id);
    res.json(expenses);
  });

  app.post("/api/subsidies/:id/expenses", authenticateToken, requirePermission('subsidies'), (req: any, res) => {
    const expense = { id: crypto.randomUUID(), subsidyId: req.params.id, userId: req.user.id, userName: req.user.displayName, ...req.body };
    db.prepare("INSERT INTO subsidy_expenses (id, subsidyId, category, description, amount, invoiceNumber, vendor, date, userId, userName, attachmentUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(expense.id, expense.subsidyId, expense.category, expense.description, expense.amount, expense.invoiceNumber, expense.vendor, expense.date, expense.userId, expense.userName, expense.attachmentUrl);
    logAction(req.user.id, req.user.displayName, "CREATE", "finances", `Gasto de subsidio: ${expense.description} ($${expense.amount})`);
    res.json(expense);
  });

  app.patch("/api/subsidies/:id", authenticateToken, requirePermission('subsidies'), (req: any, res) => {
    const { status } = req.body;
    db.prepare("UPDATE subsidies SET status = ? WHERE id = ?").run(status, req.params.id);
    res.json({ success: true });
  });

  // UI Settings
  app.get("/api/ui-settings", (req, res) => {
    const settings = db.prepare("SELECT * FROM ui_settings").all();
    const config: any = {};
    settings.forEach((s: any) => { config[s.key] = JSON.parse(s.value); });
    res.json(config);
  });

  app.post("/api/ui-settings", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Solo admins" });
    const { key, value } = req.body;
    db.prepare("INSERT OR REPLACE INTO ui_settings (key, value) VALUES (?, ?)")
      .run(key, JSON.stringify(value));
    res.json({ success: true });
  });

  app.post("/api/users", authenticateToken, (req: any, res) => {
    const { username, password, displayName, role, email, permissions } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = { id: crypto.randomUUID(), username, displayName, role, email, permissions: JSON.stringify(permissions || []) };
    db.prepare("INSERT INTO users (id, username, password, displayName, role, email, permissions) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(user.id, user.username, hashedPassword, user.displayName, user.role, user.email, user.permissions);
    
    logAction(req.user.id, req.user.displayName, "CREATE", "settings", `Creación operador: ${username}`);
    res.json(user);
  });

  app.patch("/api/users/:id", authenticateToken, (req: any, res) => {
    const { permissions, role, displayName, password } = req.body;
    if (password) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedPassword, req.params.id);
    }
    if (permissions) {
      db.prepare("UPDATE users SET permissions = ? WHERE id = ?").run(JSON.stringify(permissions), req.params.id);
    }
    if (role) db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, req.params.id);
    if (displayName) db.prepare("UPDATE users SET displayName = ? WHERE id = ?").run(displayName, req.params.id);
    
    logAction(req.user.id, req.user.displayName, "UPDATE", "settings", `Modificación operador ID: ${req.params.id}`);
    res.json({ success: true });
  });

  // Audit Logs
  app.get("/api/audit", authenticateToken, (req, res) => {
    const logs = db.prepare("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 200").all();
    res.json(logs);
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ success: true });
  });

  app.get("/api/auth/me", (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "No sesión" });
    try {
      const user = jwt.verify(token, JWT_SECRET);
      res.json(user);
    } catch {
      res.status(401).json({ error: "Sesión expirada" });
    }
  });

  // Incidents
  app.get("/api/incidents", authenticateToken, (req, res) => {
    const incidents = db.prepare("SELECT * FROM incidents ORDER BY timestamp DESC").all();
    res.json(incidents);
  });

  app.post("/api/incidents", authenticateToken, requirePermission('incidents'), (req, res) => {
    const incident = {
      id: crypto.randomUUID(),
      ...req.body,
      status: "open"
    };
    db.prepare("INSERT INTO incidents (id, type, severity, address, callerName, phoneNumber, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(incident.id, incident.type, incident.severity, incident.address, incident.callerName, incident.phoneNumber, incident.description, incident.status);
    logAction((req as any).user.id, (req as any).user.displayName, "CREATE", "incidents", `Nuevo incidente: ${incident.type} en ${incident.address}`);
    res.json(incident);
  });

  app.patch("/api/incidents/:id", authenticateToken, requirePermission('incidents'), (req, res) => {
    const { status } = req.body;
    db.prepare("UPDATE incidents SET status = ? WHERE id = ?").run(status, req.params.id);
    logAction((req as any).user.id, (req as any).user.displayName, "UPDATE", "incidents", `Cambio estado incidente ${req.params.id} a ${status}`);
    res.json({ success: true });
  });

  // Inventory
  app.get("/api/inventory", authenticateToken, (req, res) => {
    const items = db.prepare("SELECT * FROM inventory").all();
    res.json(items);
  });

  app.patch("/api/inventory/:id", authenticateToken, requirePermission('inventory'), (req, res) => {
    const { quantity } = req.body;
    db.prepare("UPDATE inventory SET quantity = ? WHERE id = ?").run(quantity, req.params.id);
    logAction((req as any).user.id, (req as any).user.displayName, "UPDATE", "inventory", `Ajuste stock item ID: ${req.params.id} a ${quantity}`);
    res.json({ success: true });
  });

  app.post("/api/inventory", authenticateToken, requirePermission('inventory'), (req, res) => {
    const item = { id: crypto.randomUUID(), ...req.body };
    db.prepare("INSERT INTO inventory (id, name, category, quantity, unit, minStock) VALUES (?, ?, ?, ?, ?, ?)")
      .run(item.id, item.name, item.category, item.quantity, item.unit, item.minStock);
    res.json(item);
  });

  // Agenda
  app.get("/api/agenda", authenticateToken, (req, res) => {
    const tasks = db.prepare("SELECT * FROM agenda ORDER BY dueDate ASC").all();
    res.json(tasks.map((t: any) => ({ ...t, dueDate: t.dueDate })));
  });

  app.post("/api/agenda", authenticateToken, requirePermission('agenda'), (req, res) => {
    const task = { id: crypto.randomUUID(), ...req.body, status: "pending" };
    db.prepare("INSERT INTO agenda (id, title, description, dueDate, priority, assignedTo, status) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(task.id, task.title, task.description, task.dueDate, task.priority, task.assignedTo, task.status);
    res.json(task);
  });

  app.patch("/api/agenda/:id", authenticateToken, requirePermission('agenda'), (req, res) => {
    const { status } = req.body;
    db.prepare("UPDATE agenda SET status = ? WHERE id = ?").run(status, req.params.id);
    res.json({ success: true });
  });

  // Finances
  app.get("/api/finances", authenticateToken, (req, res) => {
    const txs = db.prepare("SELECT * FROM finances ORDER BY timestamp DESC").all();
    res.json(txs);
  });

  app.post("/api/finances", authenticateToken, requirePermission('finances'), (req, res) => {
    const tx = { id: crypto.randomUUID(), ...req.body, timestamp: new Date().toISOString() };
    db.prepare("INSERT INTO finances (id, amount, category, description, type, timestamp, recordedBy) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(tx.id, tx.amount, tx.category, tx.description, tx.type, tx.timestamp, tx.recordedBy);
    res.json(tx);
  });

  // Rentals
  app.get("/api/rentals", authenticateToken, (req, res) => {
    const rentals = db.prepare("SELECT * FROM rentals ORDER BY startTime ASC").all();
    res.json(rentals);
  });

  app.post("/api/rentals", authenticateToken, requirePermission('rentals'), (req, res) => {
    const rental = { id: crypto.randomUUID(), ...req.body };
    db.prepare("INSERT INTO rentals (id, customerName, customerPhone, startTime, endTime, price, paymentStatus) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(rental.id, rental.customerName, rental.customerPhone, rental.startTime, rental.endTime, rental.price, rental.paymentStatus);
    res.json(rental);
  });

  app.patch("/api/rentals/:id", authenticateToken, requirePermission('rentals'), (req, res) => {
    const { paymentStatus } = req.body;
    db.prepare("UPDATE rentals SET paymentStatus = ? WHERE id = ?").run(paymentStatus, req.params.id);
    res.json({ success: true });
  });

  // Staff
  app.get("/api/staff", authenticateToken, (req, res) => {
    const users = db.prepare("SELECT id, username, displayName, role, email FROM users").all();
    res.json(users);
  });

  // Shifts
  app.get("/api/shifts/active", authenticateToken, (req, res) => {
    const shifts = db.prepare("SELECT * FROM shifts WHERE endTime IS NULL").all();
    res.json(shifts);
  });

  app.post("/api/shifts", authenticateToken, (req: any, res) => {
    const shift = {
      id: crypto.randomUUID(),
      userId: req.user.id,
      userName: req.user.displayName,
      startTime: new Date().toISOString(),
    };
    db.prepare("INSERT INTO shifts (id, userId, userName, startTime) VALUES (?, ?, ?, ?)")
      .run(shift.id, shift.userId, shift.userName, shift.startTime);
    res.json(shift);
  });

  app.patch("/api/shifts/:id", authenticateToken, requirePermission('staff'), (req, res) => {
    const endTime = new Date().toISOString();
    db.prepare("UPDATE shifts SET endTime = ? WHERE id = ?").run(endTime, req.params.id);
    res.json({ success: true });
  });

  // --- VITE MIDDLEWARE ---
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
    console.log(`\n🚒 SISTEMA DE BOMBEROS LOCAL ACTIVO`);
    console.log(`🌐 Acceso en red: http://0.0.0.0:${PORT}`);
    console.log(`🔑 Usuario: admin / Clave: admin123\n`);
  });
}

startServer();
