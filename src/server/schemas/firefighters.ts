import { z } from 'zod';

export const firefighterSchema = z.object({
  firstName: z.string().min(1, "Nombre es requerido"),
  lastName: z.string().min(1, "Apellido es requerido"),
  dni: z.string().min(7, "DNI inválido"),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato yyyy-mm-dd requerido"),
  rank: z.enum([
    'aspirante', 'bombero', 'cabo', 'cabo_1', 'sargento', 'sargento_1', 
    'sargento_ayudante', 'suboficial_principal', 'suboficial_mayor', 
    'oficial_ayudante', 'oficial_inspector', 'oficial_principal', 
    'subadjutor', 'adjutor', 'adjutor_principal', 'comandante', 
    'comandante_mayor', 'comandante_general'
  ]),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-']),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal('')),
  joinDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato yyyy-mm-dd requerido"),
  status: z.enum(['active', 'inactive', 'retired']).default('active'),
  trainings: z.array(z.string()).optional(),
  licenseExpiration: z.string().optional(),
  medicalExpiration: z.string().optional(),
  eppStatus: z.enum(['good', 'replacement_needed', 'expired']).default('good')
});

export const firefighterUpdateSchema = firefighterSchema.partial();
