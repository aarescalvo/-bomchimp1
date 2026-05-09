export type UserRole = 'admin' | 'operator' | 'firefighter';

export type AppPermission = 
  | 'dashboard' 
  | 'incidents' 
  | 'inventory' 
  | 'agenda' 
  | 'finances' 
  | 'rentals' 
  | 'staff' 
  | 'fleet' 
  | 'personnel' 
  | 'settings'
  | 'reports'
  | 'subsidies';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  lastActive?: any;
  permissions?: AppPermission[];
}

export interface Firefighter {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: string;
  rank: string;
  bloodType: string;
  phone: string;
  email: string;
  joinDate: string;
  status: string;
  trainings: TrainingRecord[];
  licenseExpiration?: string;
  medicalExpiration?: string;
  eppStatus?: 'good' | 'worn' | 'expired';
}

export interface TrainingRecord {
  id: string;
  title: string;
  date: string;
  institution: string;
  hours: number;
}

export interface Vehicle {
  id: string;
  name: string;
  plate: string;
  type: string;
  model: string;
  year: number;
  status: 'available' | 'maintenance' | 'busy' | 'out_of_service';
  lastMaintenance?: string;
  nextMaintenance?: string;
  assignedStaff?: string;
  insuranceExpiration?: string;
  vtvExpiration?: string;
  lat?: number;
  lng?: number;
}

export interface VehicleTool {
  id: string;
  vehicleId: string;
  name: string;
  quantity: number;
  status: string;
}

export interface Subsidy {
  id: string;
  name: string;
  origin: string;
  resolutionNumber: string;
  amount: number;
  receivedDate: string;
  expirationDate: string;
  status: 'active' | 'rendered' | 'expired';
}

export interface SubsidyExpense {
  id: string;
  subsidyId: string;
  category: 'Equipamiento' | 'Vehículos' | 'Infraestructura' | 'Operatividad' | 'Capacitación';
  description: string;
  amount: number;
  invoiceNumber: string;
  vendor: string;
  date: string;
  userId: string;
  userName: string;
  attachmentUrl?: string;
}

export interface Hydrant {
  id: string;
  lat: number;
  lng: number;
  address: string;
  type: string;
  status: 'operational' | 'broken' | 'maintenance';
  observations?: string;
  lastInspection?: string;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  type: 'preventive' | 'corrective';
  description: string;
  date: string;
  cost: number;
  technician: string;
  hours?: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  details: string;
  timestamp: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minStock: number;
  updatedAt: any;
}

export interface Incident {
  id: string;
  timestamp: any;
  callerName: string;
  phoneNumber: string;
  address: string;
  lat?: number;
  lng?: number;
  description: string;
  type: string;
  status: 'open' | 'dispatched' | 'closed';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ShiftRecord {
  id: string;
  userId: string;
  userName: string;
  startTime: any;
  endTime?: any;
  type: string;
  status: 'active' | 'completed';
}

export interface AgendaTask {
  id: string;
  title: string;
  description: string;
  dueDate: any;
  assignedTo: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

export interface RentalReservation {
  id: string;
  customerName: string;
  customerPhone: string;
  startTime: any;
  endTime: any;
  price: number;
  paymentStatus: 'pending' | 'paid';
  notes?: string;
}

export interface FinancialTransaction {
  id: string;
  timestamp: any;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  recordedBy: string;
}
