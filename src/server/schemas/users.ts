import { z } from 'zod';

export const userSchema = z.object({
  username: z.string().min(3, "Username mínimo 3 caracteres"),
  password: z.string().min(8, "Password mínimo 8 caracteres"),
  displayName: z.string().min(1, "Nombre a mostrar requerido"),
  role: z.enum(['admin', 'operator', 'viewer']),
  permissions: z.array(z.string())
});

export const userUpdateSchema = userSchema.partial().extend({
  password: z.string().min(8).optional()
});
