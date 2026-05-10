import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Flame, 
  Users, 
  AlertTriangle, 
  Calendar, 
  ArrowRight,
  Truck,
  AlertCircle,
  ClipboardList,
  Trophy,
  TrendingUp,
  History,
  Clock,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { apiFetch } from '../lib/api';
import { useAuth } from '../components/AuthProvider';

export default function Home() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [activeShifts, setActiveShifts] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [latestGuardia, setLatestGuardia] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);
  const [canchaSlots, setCanchaSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();

  useEffect(() => {
    async function loadData() {
      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        const month = (new Date().getMonth() + 1);
        const year = new Date().getFullYear();

        const [inc, shifts, fleet, expirationAlerts, guardia, finBalance, slots] = await Promise.all([
          apiFetch('/api/incidents'),
          apiFetch('/api/shifts/active'),
          apiFetch('/api/vehicles'),
          apiFetch('/api/alerts/vencimientos'),
          apiFetch('/api/guardia'),
          apiFetch(`/api/finances/balance?mes=${month}&anio=${year}`),
          apiFetch(`/api/cancha/disponibilidad?fecha=${today}`)
        ]);
        
        setIncidents(inc.filter((i: any) => i.status === 'open').slice(0, 3));
        setActiveShifts(shifts);
        setVehicles(fleet);
        setAlerts(expirationAlerts.filter((a: any) => a.estado === 'vencido' || a.estado === 'critico'));
        setLatestGuardia(guardia.data?.[0]);
        setBalance(finBalance);
        setCanchaSlots(slots.filter((s: any) => s.status !== 'libre'));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
    const interval = setInterval(loadData, 30000); 
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none italic">Comando Central</h1>
        <div className="flex items-center gap-3 mt-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[.3em]">B.V. CHIMPAY — MONITOREO EN TIEMPO REAL</p>
        </div>
      </header>

      {/* Alertas Críticas */}
      {alerts.length > 0 && (
        <section className="bg-red-50 border border-red-100 p-4 rounded-[24px] flex items-center gap-4 overflow-x-auto no-scrollbar">
          <div className="flex-shrink-0 w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex gap-4">
            {alerts.slice(0, 3).map(alert => (
              <div key={alert.id} className="whitespace-nowrap flex flex-col">
                <span className="text-[9px] font-black uppercase text-red-900 tracking-widest">{alert.nombre}</span>
                <span className="text-[10px] font-bold text-red-600 uppercase">Vencimiento: {alert.fechaVencimiento}</span>
              </div>
            ))}
          </div>
          <Link to="/alerts" className="ml-auto flex-shrink-0 text-[10px] font-black uppercase tracking-widest text-red-700 bg-red-200 px-3 py-2 rounded-full">Ver Todas</Link>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Estadísticas Rápidas */}
        <div className="lg:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Servicios Activos', value: incidents.length, icon: Flame, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Bomberos de Guardia', value: activeShifts.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Flota Operativa', value: vehicles.filter(v => v.status === 'available').length, icon: Truck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Turnos Cancha Hoy', value: canchaSlots.length, icon: Trophy, color: 'text-violet-600', bg: 'bg-violet-50' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
              <div className={cn("w-10 h-10 rounded-xl mb-4 flex items-center justify-center", stat.bg)}>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <p className="text-2xl font-black text-slate-900 leading-none">{stat.value}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Emergencias y Salidas */}
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-[.3em] flex items-center gap-2">
                <Activity className="w-4 h-4 text-red-600" /> Emergencias Activas
              </h2>
              <Link to="/incidents" className="text-[9px] font-black text-red-600 uppercase tracking-widest hover:underline">Ver Despacho</Link>
            </div>
            <div className="space-y-4">
              {incidents.length === 0 ? (
                <p className="py-8 text-center text-slate-300 text-[10px] uppercase font-black tracking-widest italic">Sin alertas en este momento</p>
              ) : (
                incidents.map(inc => (
                  <div key={inc.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600 font-bold uppercase text-[10px]">{inc.severity[0]}</div>
                      <div>
                        <p className="text-xs font-black text-slate-900 uppercase">{inc.type}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{inc.address}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-black uppercase text-red-600">{format(new Date(inc.timestamp), 'HH:mm')}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-[.3em] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" /> Resumen Financiero ({format(new Date(), 'MMMM', { locale: es })})
              </h2>
              <Link to="/finances" className="text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:underline">Ver Caja</Link>
            </div>
            {balance && (
               <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-emerald-50 rounded-2xl">
                     <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">Ingresos</p>
                     <p className="text-lg font-black text-emerald-700">${balance.totalIncome.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-2xl">
                     <p className="text-[8px] font-black text-red-600 uppercase tracking-widest mb-1">Egresos</p>
                     <p className="text-lg font-black text-red-700">${balance.totalExpense.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-slate-900 rounded-2xl">
                     <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Caja Neta</p>
                     <p className="text-lg font-black text-white">${balance.balance.toLocaleString()}</p>
                  </div>
               </div>
            )}
          </section>
        </div>

        {/* Guardia y Próximos Eventos */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-slate-900 text-white p-6 rounded-[24px] shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10">
                <History className="w-24 h-24" />
             </div>
             <div className="flex items-center justify-between mb-6 relative">
                <h2 className="text-[10px] font-black uppercase tracking-[.3em]">Última Novedad Guardia</h2>
                <Link to="/guardia" className="text-white/40 hover:text-white transition-colors"><ArrowRight className="w-4 h-4" /></Link>
             </div>
             {latestGuardia ? (
               <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-black text-[10px]">{latestGuardia.userName[0]}</div>
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-widest leading-none">{latestGuardia.userName}</p>
                        <p className="text-[8px] font-bold text-white/40 uppercase mt-1">{format(new Date(latestGuardia.timestamp), 'HH:mm')} — {latestGuardia.turno}</p>
                     </div>
                  </div>
                  <p className="text-xs font-medium text-slate-300 leading-relaxed italic line-clamp-3">
                    "{latestGuardia.novedad}"
                  </p>
               </div>
             ) : (
               <p className="text-center py-8 text-white/20 text-[10px] font-black uppercase tracking-widest">Sin registros recientes</p>
             )}
          </section>

          <section className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
             <div className="flex items-center justify-between mb-6">
                <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-[.3em] flex items-center gap-2">
                   <Trophy className="w-4 h-4 text-violet-600" /> Turnos Cancha Hoy
                </h2>
                <Link to="/rentals" className="text-[9px] font-black text-violet-600 uppercase tracking-widest hover:underline">Ver Agenda</Link>
             </div>
             <div className="space-y-3">
                {canchaSlots.length === 0 ? (
                  <p className="py-4 text-center text-slate-300 text-[10px] uppercase font-black tracking-widest italic">Todo libre</p>
                ) : (
                  canchaSlots.slice(0, 4).map(slot => (
                    <div key={slot.time} className="flex items-center justify-between p-3 bg-violet-50 rounded-xl border border-violet-100">
                       <span className="text-[10px] font-black uppercase text-violet-900">{slot.time}</span>
                       <span className="text-[9px] font-bold uppercase text-violet-700">{slot.data?.clienteNombre}</span>
                    </div>
                  ))
                )}
             </div>
          </section>
        </div>
      </div>
    </div>
  );
}
