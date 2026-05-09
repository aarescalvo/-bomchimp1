import { z } from 'zod';

export const firefighterSchema = z.object({
  firstName: z.string().min(1, "Nombre es requerido"),
  lastName: z.string().min(1, "Apellido es requerido"),
  dni: z.string().min(7, "DNI inválido"),
  birthDate: z.string().optional(),
  rank: z.string().optional(),
  bloodType: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal('')),
  joinDate: z.string().optional(),
  status: z.enum(['active', 'inactive', 'retired']).default('active'),
  trainings: z.array(z.string()).optional(),
  licenseExpiration: z.string().optional(),
  medicalExpiration: z.string().optional(),
  eppStatus: z.enum(['good', 'replacement_needed', 'expired']).default('good')
});

export const firefighterUpdateSchema = firefighterSchema.partial();
