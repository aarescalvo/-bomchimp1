import { z } from 'zod';

export const financeSchema = z.object({
  amount: z.number().positive("Monto debe ser positivo"),
  category: z.enum([
    'sueldos', 'servicios', 'equipamiento', 'mantenimiento', 
    'vehiculos', 'administrativo', 'subsidios', 'donaciones', 'otro'
  ]),
  description: z.string().min(1, "Descripción requerida"),
  type: z.enum(['income', 'expense']),
  timestamp: z.string().optional()
});

export const financeUpdateSchema = financeSchema.partial();
