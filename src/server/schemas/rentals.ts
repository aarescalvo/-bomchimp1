import { z } from 'zod';

export const rentalSchema = z.object({
  customerName: z.string().min(1, "Nombre del cliente requerido"),
  customerPhone: z.string().optional(),
  startTime: z.string(),
  endTime: z.string(),
  price: z.number().positive("Precio debe ser positivo"),
  status: z.enum(['pending', 'active', 'finished', 'cancelled']).default('pending')
});

export const rentalUpdateSchema = rentalSchema.partial();
