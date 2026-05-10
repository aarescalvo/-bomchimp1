import React, { useState, useEffect } from 'react';
import { UserProfile, AuditLog, AppPermission } from '../types';
import { apiFetch } from '../lib/api';
import { UiCustomizer } from '../components/UiCustomizer';
import { 
  Settings as SettingsIcon, 
  Users, 
  Shield, 
  History, 
  Plus, 
  Check, 
  X, 
  Eye, 
  Fingerprint,
  Lock,
  User,
  ChevronRight,
  Database,
  Palette
} from 'lucide-react';
import { formatDate, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

import { ChangePasswordForm } from '../components/profile/ChangePasswordForm';
import { useAuth } from '../components/AuthProvider';

const ALL_PERMISSIONS: { id: AppPermission; name: string; desc: string }[] = [
  { id: 'dashboard', name: 'Dashboard', desc: 'Vista principal y estadísticas' },
  { id: 'incidents', name: 'Emergencias', desc: 'Gestión de incidentes y despachos' },
  { id: 'salidas', name: 'Salidas Op.', desc: 'Registro de salidas operativas' },
  { id: 'fleet', name: 'Flota', desc: 'Vehículos, herramientas y mantenimiento' },
  { id: 'personnel', name: 'Personal', desc: 'Legajos, capacitaciones e IBNCA' },
  { id: 'inventory', name: 'Stock', desc: 'Equipamiento y suministros' },
  { id: 'guardia', name: 'Libreta Guardia', desc: 'Libreta digital de novedades' },
  { id: 'alerts', name: 'Alertas', desc: 'Vencimientos y avisos unificados' },
  { id: 'finances', name: 'Tesorería', desc: 'Libro de caja y gastos' },
  { id: 'rentals', name: 'Cancha', desc: 'Alquileres de turnos de cancha' },
  { id: 'subsidies', name: 'Subsidios', desc: 'Rendición de fondos y facturación' },
  { id: 'reports', name: 'Reportes', desc: 'Estadísticas de jefatura' },
  { id: 'settings', name: 'Sistema', desc: 'Ajustes, usuarios y auditoría' },
];

export default function Settings() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<'users' | 'audit' | 'ui' | 'profile'>('profile');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    displayName: '',
    role: 'operator' as any,
    permissions: ['dashboard'] as AppPermission[]
  });

  const loadData = async () => {
    try {
      const [userData, auditData] = await Promise.all([
        apiFetch('/api/users'),
        apiFetch('/api/audit')
      ]);
      setUsers(userData);
      setAuditLogs(auditData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setShowUserModal(false);
      loadData();
      setFormData({ username: '', password: '', displayName: '', role: 'operator', permissions: ['dashboard'] });
    } catch (err) {
      console.error(err);
    }
  };

  const togglePermission = (perm: AppPermission) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm) 
        ? prev.permissions.filter(p => p !== perm) 
        : [...prev.permissions, perm]
    }));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-slate-400" />
            Configuración del Sistema
          </h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Control de acceso y auditoría técnica</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 p-1.5 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl w-fit">
        <button 
          onClick={() => setTab('profile')}
          className={cn(
            "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            tab === 'profile' ? "bg-slate-900 dark:bg-red-600 text-white shadow-xl" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <User className="w-4 h-4 inline-block mr-2" /> Mi Perfil
        </button>
        <button 
          onClick={() => setTab('users')}
          className={cn(
            "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            tab === 'users' ? "bg-slate-900 text-white shadow-xl" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <Users className="w-4 h-4 inline-block mr-2" /> Operadores
        </button>
        <button 
          onClick={() => setTab('audit')}
          className={cn(
            "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            tab === 'audit' ? "bg-slate-900 text-white shadow-xl" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <History className="w-4 h-4 inline-block mr-2" /> Auditoría
        </button>
        <button 
          onClick={() => setTab('ui')}
          className={cn(
            "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            tab === 'ui' ? "bg-slate-900 text-white shadow-xl" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <Palette className="w-4 h-4 inline-block mr-2" /> Interfaz
        </button>
      </div>

      {tab === 'profile' ? (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-[40px] border border-slate-200 dark:border-gray-800 shadow-sm">
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-2">
              <User className="w-6 h-6 text-red-600" /> Información de Usuario
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-gray-800 rounded-[24px]">
                <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white text-2xl font-black">
                  {profile?.displayName?.[0]}
                </div>
                <div>
                   <p className="text-lg font-black text-slate-900 dark:text-white uppercase leading-none">{profile?.displayName}</p>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{profile?.role}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border border-slate-100 dark:border-gray-800 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ID Usuario</p>
                  <p className="font-bold text-slate-900 dark:text-white">{profile?.username}</p>
                </div>
                <div className="p-4 border border-slate-100 dark:border-gray-800 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Empresa/Cuartel</p>
                  <p className="font-bold text-slate-900 dark:text-white">Chimpay</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-8 rounded-[40px] border border-slate-200 dark:border-gray-800 shadow-sm">
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-2">
              <Lock className="w-6 h-6 text-red-600" /> Seguridad
            </h2>
            <ChangePasswordForm />
          </div>
        </div>
      ) : tab === 'users' ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-600" /> Gestión de Permisos
            </h2>
            <button 
              onClick={() => setShowUserModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg shadow-red-600/10 hover:bg-red-700 transition-all"
            >
              <Plus className="w-4 h-4" /> Nuevo Operador
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => (
              <div key={user.uid} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-red-50 group-hover:border-red-100 transition-colors">
                    <Fingerprint className="w-6 h-6 text-slate-400 group-hover:text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 uppercase tracking-tight leading-tight">{user.displayName}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.role}</p>
                  </div>
                </div>

                <div className="space-y-3">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-[.2em] mb-3">Módulos habilitados:</p>
                   <div className="flex flex-wrap gap-1.5">
                     {user.permissions?.map(p => (
                       <span key={p} className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[8px] font-black uppercase">
                         {p}
                       </span>
                     ))}
                   </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                   <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300 uppercase">
                     <Lock className="w-3 h-3" /> Acceso: {user.uid.slice(0, 8)}
                   </div>
                   <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-300 hover:text-slate-900 transition-colors">
                     <ChevronRight className="w-4 h-4" />
                   </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : tab === 'audit' ? (
        <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Database className="w-5 h-5 text-slate-400" /> Registros de Eventos del Sistema
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Fecha y Hora</th>
                  <th className="px-6 py-4">Operador</th>
                  <th className="px-6 py-4">Módulo</th>
                  <th className="px-6 py-4">Acción</th>
                  <th className="px-6 py-4">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-[10px] font-bold text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[8px] font-black">
                          {log.userName[0]}
                        </div>
                        <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{log.userName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase tracking-widest border border-slate-200">
                        {log.module}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                       <span className={cn(
                         "text-[10px] font-black uppercase tracking-tight",
                         log.action === 'CREATE' ? "text-emerald-600" : log.action === 'DELETE' ? "text-red-600" : "text-blue-600"
                       )}>
                         {log.action}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <UiCustomizer />
      )}

      {/* User Modal */}
      <AnimatePresence>
        {showUserModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div onClick={() => setShowUserModal(false)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-xl bg-white rounded-[40px] shadow-2xl overflow-hidden">
               <form onSubmit={handleCreateUser}>
                 <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Nuevo Operador</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure cuenta y permisos</p>
                    </div>
                    <button type="button" onClick={() => setShowUserModal(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all">
                      <X className="w-6 h-6" />
                    </button>
                 </div>

                 <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre Mostrar</label>
                        <input 
                          required className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl font-bold border border-transparent focus:border-red-600 transition-all outline-none" 
                          value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">ID Usuario (Login)</label>
                        <input 
                          required className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl font-bold border border-transparent focus:border-red-600 transition-all outline-none" 
                          value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Clave</label>
                        <input 
                          type="password"
                          required className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl font-bold border border-transparent focus:border-red-600 transition-all outline-none" 
                          value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Rol Base</label>
                        <select 
                          className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl font-bold border border-transparent focus:border-red-600 transition-all outline-none"
                          value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})}
                        >
                          <option value="operator">Operador</option>
                          <option value="admin">Administrador</option>
                          <option value="firefighter">Bombero</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Eye className="w-4 h-4 text-red-600" /> Permisos de Módulos
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {ALL_PERMISSIONS.map((p) => (
                           <button 
                            key={p.id}
                            type="button"
                            onClick={() => togglePermission(p.id)}
                            className={cn(
                              "flex items-start gap-3 p-3 rounded-2xl border transition-all text-left",
                              formData.permissions.includes(p.id) 
                                ? "bg-red-50 border-red-200 text-red-900 shadow-sm shadow-red-600/5 ring-1 ring-red-200" 
                                : "bg-white border-slate-200 text-slate-400 grayscale hover:grayscale-0 opacity-80"
                            )}
                           >
                             <div className={cn(
                               "mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                               formData.permissions.includes(p.id) ? "bg-red-600 border-red-600 text-white" : "border-slate-300"
                             )}>
                               {formData.permissions.includes(p.id) && <Check className="w-3 h-3 stroke-[4]" />}
                             </div>
                             <div>
                               <p className="text-[10px] font-black uppercase tracking-tight leading-none mb-1">{p.name}</p>
                               <p className="text-[9px] font-bold opacity-60 leading-tight">{p.desc}</p>
                             </div>
                           </button>
                        ))}
                      </div>
                    </div>
                 </div>

                 <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button type="button" onClick={() => setShowUserModal(false)} className="px-6 py-2 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-all">Cancelar</button>
                    <button type="submit" className="px-10 py-3.5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-slate-900/20 hover:bg-slate-800 transition-all">Crear Operador</button>
                 </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
