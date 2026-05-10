import { z } from 'zod';

export const agendaSchema = z.object({
  title: z.string().min(1, "Título es requerido"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assignedTo: z.string().optional(),
  status: z.enum(['pending', 'completed', 'cancelled']).default('pending')
});

export const agendaUpdateSchema = agendaSchema.partial();
