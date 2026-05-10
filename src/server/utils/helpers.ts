import { Request, Response, NextFunction } from 'express';

export function getPaginationParams(req: Request) {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export function formatPaginatedResponse(data: any[], total: number, page: number, limit: number) {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export const FIREFIGHTER_UPDATABLE_FIELDS = [
  'firstName', 'lastName', 'dni', 'birthDate', 'rank', 'bloodType',
  'phone', 'email', 'joinDate', 'status', 'licenseExpiration', 'medicalExpiration', 'eppStatus'
];

export const VEHICLE_UPDATABLE_FIELDS = [
  'name', 'plate', 'type', 'model', 'year', 'status', 'lastMaintenance', 'nextMaintenance', 
  'insuranceExpiration', 'vtvExpiration', 'assignedStaff'
];
