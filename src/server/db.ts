import Database from "better-sqlite3";

export const db = new Database("bomberos.db");
export const JWT_SECRET = "bomberos-secret-key-local-123";

export function initDb() {
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
      eppStatus TEXT DEFAULT 'good'
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
      type TEXT,
      description TEXT,
      date DATE,
      cost REAL,
      technician TEXT,
      hours INTEGER,
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
}
