import { z } from 'zod';

export const inventorySchema = z.object({
  name: z.string().min(1, "Nombre es requerido"),
  category: z.string().optional(),
  quantity: z.number().int("Cantidad debe ser un número entero"),
  unit: z.string().optional(),
  minStock: z.number().int().optional(),
  location: z.string().optional()
});

export const inventoryUpdateSchema = inventorySchema.partial();
