import { z } from 'zod';

export const vehicleSchema = z.object({
  name: z.string().min(1, "Nombre es requerido"),
  plate: z.string().min(1, "Patente es requerida"),
  type: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().optional(),
  status: z.enum(['available', 'busy', 'maintenance', 'out_of_service']).default('available'),
  lastMaintenance: z.string().optional(),
  nextMaintenance: z.string().optional(),
  insuranceExpiration: z.string().optional(),
  vtvExpiration: z.string().optional(),
  assignedStaff: z.string().optional(),
  lat: z.number().optional().default(-39.0664),
  lng: z.number().optional().default(-66.1439)
});

export const vehicleUpdateSchema = vehicleSchema.partial();
