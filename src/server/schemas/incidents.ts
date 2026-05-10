import { z } from 'zod';

export const incidentSchema = z.object({
  type: z.string().min(1, "Tipo es requerido"),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  address: z.string().min(1, "Dirección requerida"),
  description: z.string().optional(),
  callerName: z.string().optional(),
  phoneNumber: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).default('open')
});

export const incidentUpdateSchema = incidentSchema.partial();
