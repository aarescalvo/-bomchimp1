import { z } from 'zod';

export const subsidySchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  origin: z.string().min(1, "Origen requerido"),
  resolutionNumber: z.string().optional(),
  amount: z.number().positive(),
  receivedDate: z.string(),
  expirationDate: z.string(),
  status: z.enum(['pending', 'invested', 'expired']).default('pending')
});

export const subsidyUpdateSchema = subsidySchema.partial();

export const subsidyExpenseSchema = z.object({
  category: z.string().min(1, "Categoría requerida"),
  description: z.string().min(1, "Descripción requerida"),
  amount: z.number().min(0.01, "Monto debe ser mayor a 0"),
  invoiceNumber: z.string().optional(),
  vendor: z.string().optional(),
  date: z.string().optional(),
  attachmentUrl: z.string().optional()
});
