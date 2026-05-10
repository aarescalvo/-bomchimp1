import Database from "better-sqlite3";

export const db = new Database("bomberos.db");

export function initDb() {
  db.exec(`
    -- Usuarios y Autenticación
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      password TEXT,
      displayName TEXT,
      role TEXT,
      email TEXT,
      permissions TEXT,
      mustChangePassword INTEGER DEFAULT 0
    );

    -- Cuerpo Activo
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
      trainings TEXT DEFAULT '[]', -- legacy general field
      licenseExpiration DATE,
      medicalExpiration DATE,
      eppStatus TEXT DEFAULT 'good'
    );

    -- Cursos IBNCA
    CREATE TABLE IF NOT EXISTS cursos_ibnca (
      id TEXT PRIMARY KEY,
      firefighterId TEXT NOT NULL,
      nombreCurso TEXT NOT NULL,
      organismo TEXT DEFAULT 'IBNCA',
      fechaAprobacion DATE,
      fechaVencimiento DATE,
      certificadoUrl TEXT,
      FOREIGN KEY (firefighterId) REFERENCES firefighters(id)
    );

    -- Flota
    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY,
      name TEXT,
      plate TEXT UNIQUE,
      type TEXT,
      model TEXT,
      year INTEGER,
      status TEXT DEFAULT 'available', -- 'available' | 'busy' | 'maintenance' | 'out_of_service' | 'en_servicio'
      lastMaintenance DATE,
      nextMaintenance DATE,
      insuranceExpiration DATE,
      vtvExpiration DATE,
      assignedStaff TEXT,
      lat REAL,
      lng REAL
    );

    -- Herramientas por vehículo
    CREATE TABLE IF NOT EXISTS vehicle_tools (
      id TEXT PRIMARY KEY,
      vehicleId TEXT,
      name TEXT,
      quantity INTEGER,
      status TEXT DEFAULT 'operational',
      FOREIGN KEY (vehicleId) REFERENCES vehicles(id)
    );

    -- Scuba Tanks
    CREATE TABLE IF NOT EXISTS scuba_tanks (
      id TEXT PRIMARY KEY,
      serialNumber TEXT UNIQUE,
      capacity REAL,
      lastHydrostatic DATE,
      nextHydrostatic DATE,
      pressure INTEGER,
      status TEXT DEFAULT 'ready'
    );

    -- Salidas Operativas
    CREATE TABLE IF NOT EXISTS salidas (
      id TEXT PRIMARY KEY,
      incidenteId TEXT,
      tipoServicio TEXT NOT NULL,
      vehiculoId TEXT,
      tripulacion TEXT NOT NULL, -- JSON array
      jefeServicio TEXT NOT NULL,
      direccion TEXT,
      horaDespacho DATETIME NOT NULL,
      horaRegreso DATETIME,
      kmSalida INTEGER,
      kmRegreso INTEGER,
      combustibleCargado REAL DEFAULT 0,
      observaciones TEXT,
      estado TEXT DEFAULT 'en_curso',
      FOREIGN KEY (vehiculoId) REFERENCES vehicles(id),
      FOREIGN KEY (incidenteId) REFERENCES incidents(id)
    );

    -- Incidencias (Pre-salida)
    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      type TEXT,
      severity TEXT,
      address TEXT,
      callerName TEXT,
      phoneNumber TEXT,
      description TEXT,
      status TEXT DEFAULT 'open',
      lat REAL,
      lng REAL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Libreta de guardia digital
    CREATE TABLE IF NOT EXISTS guardia_logs (
      id TEXT PRIMARY KEY,
      fecha DATE NOT NULL,
      turno TEXT NOT NULL,
      jefeGuardia TEXT NOT NULL,
      personalPresente TEXT, -- JSON array
      novedad TEXT,
      tipo TEXT,
      prioridad TEXT DEFAULT 'normal',
      userId TEXT,
      userName TEXT,
      isRead INTEGER DEFAULT 0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Guardias Activas (Shifts)
    CREATE TABLE IF NOT EXISTS shifts (
      id TEXT PRIMARY KEY,
      userId TEXT,
      userName TEXT,
      startTime DATETIME DEFAULT CURRENT_TIMESTAMP,
      endTime DATETIME
    );

    -- Inventario
    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      name TEXT,
      category TEXT,
      quantity INTEGER,
      unit TEXT,
      minStock INTEGER,
      status TEXT DEFAULT 'active'
    );

    -- Finanzas
    CREATE TABLE IF NOT EXISTS finances (
      id TEXT PRIMARY KEY,
      amount REAL,
      category TEXT,
      description TEXT,
      type TEXT, -- 'income' | 'expense'
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      recordedBy TEXT
    );

    -- Alquileres de Cancha (v2)
    CREATE TABLE IF NOT EXISTS turnos_cancha (
      id TEXT PRIMARY KEY,
      fecha DATE NOT NULL,
      horaInicio TEXT NOT NULL,
      horaFin TEXT NOT NULL,
      clienteNombre TEXT NOT NULL,
      clienteTelefono TEXT,
      clienteDni TEXT,
      estado TEXT DEFAULT 'reservado',
      precioTotal REAL NOT NULL,
      senia REAL DEFAULT 0,
      saldoPendiente REAL,
      medioPagoSenia TEXT,
      medioPagoSaldo TEXT,
      notas TEXT,
      creadoPor TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bloqueos_cancha (
      id TEXT PRIMARY KEY,
      fecha DATE NOT NULL,
      horaInicio TEXT NOT NULL,
      horaFin TEXT NOT NULL,
      motivo TEXT
    );

    CREATE TABLE IF NOT EXISTS tarifas_cancha (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      precio REAL NOT NULL,
      diaSemana TEXT,
      horaDesde TEXT,
      horaHasta TEXT,
      activo INTEGER DEFAULT 1
    );

    -- Subsidios
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

    -- Agenda / Tareas
    CREATE TABLE IF NOT EXISTS agenda (
      id TEXT PRIMARY KEY,
      title TEXT,
      description TEXT,
      dueDate DATETIME,
      priority TEXT,
      assignedTo TEXT,
      status TEXT DEFAULT 'pending'
    );

    -- Auditoría
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      userId TEXT,
      userName TEXT,
      action TEXT,
      module TEXT,
      details TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Configuración UI
    CREATE TABLE IF NOT EXISTS ui_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}
