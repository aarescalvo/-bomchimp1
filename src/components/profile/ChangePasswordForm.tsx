import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiFetch } from '../../lib/api';
import { toast } from '../../utils/toast';
import { Button } from '../ui/Button';
import { Lock, Key } from 'lucide-react';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Clave actual requerida"),
  newPassword: z.string().min(6, "La nueva clave debe tener al menos 6 caracteres"),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"]
});

type ChangePasswordData = z.infer<typeof changePasswordSchema>;

export function ChangePasswordForm() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema)
  });

  const onSubmit = async (data: ChangePasswordData) => {
    try {
      await apiFetch('/api/auth/change-password', {
        method: 'PATCH',
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword
        })
      });
      toast.success("Contraseña actualizada correctamente");
      reset();
    } catch (err: any) {
      toast.error(err.message || "Error al cambiar la contraseña");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest ml-1">Contraseña Actual</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="password"
              {...register('currentPassword')}
              className="w-full pl-11 pr-4 h-12 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl font-bold outline-none focus:border-red-600 transition-all dark:text-white"
              placeholder="••••••••"
            />
          </div>
          {errors.currentPassword && <p className="text-[10px] text-red-600 font-bold ml-1">{errors.currentPassword.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest ml-1">Nueva Contraseña</label>
          <div className="relative">
            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="password"
              {...register('newPassword')}
              className="w-full pl-11 pr-4 h-12 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl font-bold outline-none focus:border-red-600 transition-all dark:text-white"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          {errors.newPassword && <p className="text-[10px] text-red-600 font-bold ml-1">{errors.newPassword.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest ml-1">Confirmar Nueva Contraseña</label>
          <div className="relative">
            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="password"
              {...register('confirmPassword')}
              className="w-full pl-11 pr-4 h-12 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl font-bold outline-none focus:border-red-600 transition-all dark:text-white"
              placeholder="Re-ingrese su nueva clave"
            />
          </div>
          {errors.confirmPassword && <p className="text-[10px] text-red-600 font-bold ml-1">{errors.confirmPassword.message}</p>}
        </div>
      </div>

      <Button type="submit" loading={isSubmitting} className="w-full uppercase tracking-[.2em] text-[10px] font-black py-4">
        Actualizar Seguridad
      </Button>
    </form>
  );
}
