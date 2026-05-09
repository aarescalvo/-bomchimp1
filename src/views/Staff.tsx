import React, { useState, useEffect } from 'react';
import { ShiftRecord, UserProfile } from '../types';
import { Users, Clock, LogIn, LogOut, Shield, ChevronRight } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import { formatDate } from '../lib/utils';
import { apiFetch } from '../lib/api';

export default function Staff() {
  const { profile } = useAuth();
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [activeShifts, setActiveShifts] = useState<ShiftRecord[]>([]);
  const [userShift, setUserShift] = useState<ShiftRecord | null>(null);

  const loadStaffData = async () => {
    try {
      const [staffData, shiftsData] = await Promise.all([
        apiFetch('/api/staff'),
        apiFetch('/api/shifts/active')
      ]);
      setStaff(staffData.map((u: any) => ({ ...u, uid: u.id })));
      setActiveShifts(shiftsData);
      if (profile) {
        setUserShift(shiftsData.find((s: any) => s.userId === profile.uid) || null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!profile) return;
    loadStaffData();
    const interval = setInterval(loadStaffData, 5000);
    return () => clearInterval(interval);
  }, [profile]);

  const handleClockIn = async () => {
    if (!profile) return;
    try {
      await apiFetch('/api/shifts', { method: 'POST' });
      loadStaffData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClockOut = async () => {
    if (!userShift) return;
    try {
      await apiFetch(`/api/shifts/${userShift.id}`, { method: 'PATCH' });
      loadStaffData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Attendance Widget */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-32 h-32 bg-slate-50 rounded-full translate-x-16 -translate-y-16 group-hover:scale-110 transition-transform" />
            
            <div className="flex items-center gap-5 relative z-10">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${userShift ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {userShift ? <Clock className="w-8 h-8" /> : <Shield className="w-8 h-8" />}
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Control de Guardia</h2>
                <p className="text-slate-500 font-medium">Registra tu actividad activa en el cuartel.</p>
              </div>
            </div>
            
            <div className="relative z-10 w-full md:w-auto">
              {userShift ? (
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="text-right pr-4 border-r border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">En guardia desde</p>
                    <p className="text-xl font-black text-emerald-600 font-mono">
                      {userShift.startTime ? formatDate(userShift.startTime).split(' ')[1] : '--:--'}
                    </p>
                  </div>
                  <button 
                    onClick={handleClockOut}
                    className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-600/20"
                  >
                    <LogOut className="w-5 h-5" />
                    Finalizar
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleClockIn}
                  className="w-full md:w-auto bg-emerald-600 text-white px-10 py-4 rounded-xl font-black text-lg flex items-center justify-center gap-3 hover:bg-emerald-700 active:scale-95 transition-all shadow-lg shadow-emerald-600/20"
                >
                  <LogIn className="w-6 h-6" />
                  Iniciar Guardia
                </button>
              )}
            </div>
          </div>

          {/* Staff List */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-500" />
                Nómina de Personal
              </h3>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
                {staff.length} Miembros
              </span>
            </div>
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-5">Bombero / Oficial</th>
                      <th className="px-8 py-5">Rango / Rol</th>
                      <th className="px-8 py-5">Estado</th>
                      <th className="px-8 py-5 text-right">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {staff.map(member => (
                      <tr key={member.uid} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500 group-hover:scale-110 transition-transform">
                              {member.displayName[0]}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{member.displayName}</p>
                              <p className="text-xs text-slate-400">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider ${
                            member.role === 'admin' ? 'bg-red-50 text-red-600' :
                            member.role === 'operator' ? 'bg-blue-50 text-blue-600' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {member.role === 'admin' ? 'Oficial Superior' : member.role === 'operator' ? 'Operador' : 'Bombero'}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${activeShifts.some(s => s.userId === member.uid) ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-slate-200'}`} />
                            <span className={`text-sm font-semibold ${activeShifts.some(s => s.userId === member.uid) ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {activeShifts.some(s => s.userId === member.uid) ? 'En Guardia' : 'Disponible'}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button className="text-slate-300 hover:text-slate-600 transition-colors">
                            <ChevronRight className="w-6 h-6" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Shield className="w-32 h-32" />
            </div>
            
            <h4 className="font-black text-xl tracking-tight relative z-10">Disponibilidad Operativa</h4>
            
            <div className="space-y-4 relative z-10">
              <div className="p-5 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Activos Ahora</p>
                  <p className="text-3xl font-black text-white">{activeShifts.length}</p>
                </div>
                <Users className="w-8 h-8 text-red-500" />
              </div>
              
              <div className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Capacidad Teórica</span>
                  <span className="font-bold">100%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[85%] rounded-full" />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 relative z-10">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[.2em] leading-relaxed">
                ESTA INFORMACIÓN SE ACTUALIZA EN TIEMPO REAL SEGÚN EL REGISTRO DE ASISTENCIA.
              </p>
            </div>
          </div>

          <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 border-dashed space-y-3">
            <h5 className="font-bold text-amber-800 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Recordatorios de Guardia
            </h5>
            <p className="text-xs text-amber-600 leading-relaxed">
              Recuerde que al finalizar su turno debe realizar el chequeo de inventario de las unidades a su cargo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
