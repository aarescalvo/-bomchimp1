import { Request } from 'express';

export interface JwtPayload {
  id: string;
  username: string;
  role: string;
  displayName: string;
  permissions: string[];
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export type AppPermission = 
  | 'dashboard' 
  | 'incidents' 
  | 'salidas'
  | 'fleet' 
  | 'personnel' 
  | 'inventory' 
  | 'guardia' 
  | 'alerts' 
  | 'finances' 
  | 'rentals' 
  | 'subsidies' 
  | 'reports' 
  | 'settings' 
  | 'logs' 
  | 'users';

export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  role: 'admin' | 'operator' | 'jefe_cuerpo' | 'tesorero' | 'oficial' | 'bombero';
  email: string;
  permissions: AppPermission[];
  status: 'active' | 'inactive';
}

export interface UserRow {
  id: string;
  username: string;
  password?: string;
  displayName: string;
  role: string;
  email: string;
  permissions: string;
  mustChangePassword?: number;
}

export interface Firefighter {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  rank: string;
  phone: string;
  email: string;
  birthDate: string;
  joinDate: string;
  status: 'active' | 'inactive';
  bloodType: string;
  licenseExpiration?: string;
  eppStatus?: 'good' | 'worn' | 'expired';
}

export interface Vehicle {
  id: string;
  name: string;
  plate: string;
  status: 'available' | 'in_service' | 'maintenance';
  lastService?: string;
  nextVtv?: string;
  vtvExpiration?: string;
  insuranceExpiration?: string;
}

export interface Incident {
  id: string;
  type: string;
  address: string;
  status: 'open' | 'closed';
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  description: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  module: string;
  action: string;
  details: string;
}

export interface FinancialTransaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  timestamp: string;
  recordedBy: string;
}
