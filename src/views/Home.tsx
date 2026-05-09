import React, { useEffect, useState } from 'react';
import { Incident, ShiftRecord, InventoryItem, AgendaTask } from '../types';
import { 
  Flame, 
  Users, 
  AlertTriangle, 
  Calendar, 
  ArrowRight,
  TrendingUp,
  Clock,
  Truck,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { formatDate, cn } from '../lib/utils';
import { apiFetch } from '../lib/api';
import { useAuth } from '../components/AuthProvider';
import { Vehicle } from '../types';

export default function Home() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activeShifts, setActiveShifts] = useState<ShiftRecord[]>([]);
  const [lowStock, setLowStock] = useState<InventoryItem[]>([]);
  const [todayTasks, setTodayTasks] = useState<AgendaTask[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  const { profile } = useAuth();

  useEffect(() => {
    if (!profile) return;

    async function loadData() {
      try {
        const [inc, shifts, inventory, tasks, fleet, expirationAlerts] = await Promise.all([
          apiFetch('/api/incidents'),
          apiFetch('/api/shifts/active'),
          apiFetch('/api/inventory'),
          apiFetch('/api/agenda'),
          apiFetch('/api/vehicles'),
          apiFetch('/api/alerts/expirations')
        ]);
        
        setIncidents(inc.slice(0, 5));
        setActiveShifts(shifts);
        setLowStock(inventory.filter((i: any) => i.quantity <= i.minStock));
        setTodayTasks(tasks.filter((t: any) => t.status !== 'completed'));
        setVehicles(fleet);
        setAlerts(expirationAlerts.filter((a: any) => {
          const diff = new Date(a.dueDate).getTime() - new Date().getTime();
          return diff < 30 * 24 * 60 * 60 * 1000; // 30 days
        }));
      } catch (err) {
        // Silent fail if unauthorized during logout/session expiry
      }
    }
    
    loadData();
    const interval = setInterval(loadData, 5000); 
    return () => clearInterval(interval);
  }, [profile]);

  const stats = [
    { label: 'Ems. Activas', value: incidents.length, icon: Flame, color: 'text-red-900', bg: 'bg-red-500' },
    { label: 'Dotación', value: activeShifts.length, icon: Users, color: 'text-blue-900', bg: 'bg-blue-500' },
    { label: 'Flota Operativa', value: vehicles.filter(v => v.status === 'available').length, icon: Truck, color: 'text-emerald-900', bg: 'bg-emerald-500' },
    { label: 'Alertas Stock', value: lowStock.length, icon: AlertTriangle, color: 'text-amber-900', bg: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex items-center gap-6">
           <div className="w-20 h-20 bg-white p-1 rounded-full shadow-2xl ring-4 ring-red-600/10 hidden md:block">
              <img 
                src="https://files.aistudio.google.com/ais-dev-efig3ahtdr3uqmljqvdvfs-637731406593.us-east1.run.app/api/artifacts/attached_image_318df857_3840_4639_8673_093952fdfd88" 
                alt="Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
           </div>
           <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Comando Central</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[.3em] mt-3">B.V. CHIMPAY — ESTADO OPERATIVO INTEGRAL</p>
           </div>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl flex items-center gap-3">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Red Local: Conectada</span>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden group"
          >
            <div className={cn("absolute top-0 right-0 p-8 opacity-5 group-hover:scale-150 transition-transform duration-500", stat.color)}>
              <stat.icon className="w-20 h-20" />
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[.25em] mb-3">{stat.label}</p>
            <p className="text-5xl font-black tracking-tighter text-slate-950">{stat.value}</p>
            <div className="mt-6 flex items-center gap-2">
               <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", stat.bg)}></div>
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Estado: Actualizado</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-8">
          {/* Active Incidents */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[.3em] flex items-center gap-3">
                <Flame className="w-4 h-4 text-red-600" /> Emergencias Activas
              </h2>
              <Link to="/incidents" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
            
            <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
              <div className="min-w-full overflow-x-auto">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-slate-50">
                    {incidents.length === 0 ? (
                      <tr>
                        <td className="px-8 py-16 text-center">
                           <ShieldCheck className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sin alertas de emergencia</p>
                        </td>
                      </tr>
                    ) : (
                      incidents.map((incident) => (
                        <tr key={incident.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg",
                                incident.severity === 'critical' || incident.severity === 'high' ? "bg-red-600 shadow-red-600/20" : "bg-slate-900 shadow-slate-900/20"
                              )}>
                                <Activity className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="font-black text-slate-900 uppercase tracking-tight leading-none text-sm">{incident.type}</p>
                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">{incident.address}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex flex-col items-end">
                                <span className={cn(
                                  "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-1.5",
                                  incident.status === 'open' ? "bg-red-50 text-red-600 border border-red-100" : "bg-blue-50 text-blue-600 border border-blue-100"
                                )}>
                                  {incident.status === 'open' ? 'Respuesta Inicial' : 'Despachado'}
                                </span>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">ID: {incident.id.slice(0,6)}</p>
                             </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Fleet Summary */}
          <section className="space-y-4">
             <div className="flex items-center justify-between px-2">
                <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[.3em] flex items-center gap-3">
                  <Truck className="w-4 h-4 text-slate-400" /> Estatus de Flota
                </h2>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {vehicles.slice(0, 4).map(v => (
                  <div key={v.id} className="bg-white p-5 rounded-[24px] border border-slate-200">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{v.name}</p>
                    <div className="flex items-center justify-between">
                       <span className="text-xs font-black uppercase text-slate-950">{v.plate}</span>
                       <div className={cn(
                         "w-2 h-2 rounded-full",
                         v.status === 'available' ? 'bg-emerald-500' : 'bg-red-500'
                       )}></div>
                    </div>
                  </div>
                ))}
             </div>
          </section>
        </div>

        {/* Right Column: Guardias Activas */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[.3em]">Guardia de Turno</h2>
            <Link to="/staff" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>
          <div className="bg-slate-900 rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
               <Users className="w-32 h-32 text-white" />
            </div>
            
            <div className="space-y-6 relative z-10">
               {activeShifts.length === 0 ? (
                 <div className="py-12 flex flex-col items-center">
                    <Users className="w-12 h-12 text-slate-700 mb-4" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Sin guardia<br/>asignada actualmente</p>
                 </div>
               ) : (
                 <div className="space-y-5">
                    {activeShifts.map((shift) => (
                      <div key={shift.id} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                        <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center font-black text-white text-xs shadow-lg shadow-red-600/20">
                          {shift.userName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-black text-white uppercase tracking-tight">{shift.userName}</p>
                          <div className="flex items-center gap-2 mt-1">
                             <Clock className="w-3 h-3 text-white/30" />
                             <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                               Desde: {new Date(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}hs
                             </span>
                          </div>
                        </div>
                      </div>
                    ))}
                 </div>
               )}

               <button className="w-full mt-4 py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-[.2em] text-[9px] hover:bg-slate-50 transition-colors shadow-xl">
                 Registrar Novedades
               </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[32px] border border-slate-200">
             <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[.3em] mb-6 flex items-center gap-2">
               <AlertCircle className="w-4 h-4 text-red-600" /> Control Vencimientos
             </h3>
             <div className="space-y-4">
                {alerts.length === 0 ? (
                  <p className="text-xs text-slate-400 font-bold italic">Todo al día</p>
                ) : (
                  alerts.slice(0, 4).map(alert => (
                    <div key={alert.id} className="flex items-center justify-between p-3 bg-red-50 rounded-2xl border border-red-100">
                      <div>
                        <p className="text-[10px] font-black text-red-900 uppercase leading-none mb-1">{alert.targetName}</p>
                        <p className="text-[8px] font-bold text-red-400 uppercase">{alert.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-red-700">{alert.dueDate}</p>
                      </div>
                    </div>
                  ))
                )}
             </div>
          </div>

          <div className="bg-white p-8 rounded-[32px] border border-slate-200">
             <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[.3em] mb-6 flex items-center gap-2">
               <Calendar className="w-4 h-4 text-emerald-500" /> Próximas Tareas
             </h3>
             <div className="space-y-4">
                {todayTasks.slice(0, 3).map(task => (
                  <div key={task.id} className="group cursor-pointer">
                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight group-hover:text-red-600 transition-colors">{task.title}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Plazo: {new Date(task.dueDate).toLocaleDateString()}</p>
                  </div>
                ))}
                {todayTasks.length === 0 && <p className="text-xs text-slate-400 font-bold italic">Agenda limpia</p>}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
