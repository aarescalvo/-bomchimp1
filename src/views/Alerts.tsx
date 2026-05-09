import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { 
  AlertTriangle, 
  Bell, 
  Calendar, 
  Truck, 
  User, 
  Search,
  Filter
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Alerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const data = await apiFetch('/api/alerts/vencimientos');
        setAlerts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAlerts();
  }, []);

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'all') return true;
    return a.estado === filter;
  });

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'vencido': return 'bg-red-600 text-white border-red-600';
      case 'critico': return 'bg-amber-500 text-white border-amber-500';
      case 'proximo': return 'bg-blue-500 text-white border-blue-500';
      default: return 'bg-slate-100 text-slate-500 border-slate-100';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto font-sans">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Panel de Vencimientos</h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[.3em] mt-2">Monitoreo Preventivo de Recursos y Personal</p>
        </div>

        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
           {['all', 'vencido', 'critico', 'proximo'].map((f) => (
             <button
               key={f}
               onClick={() => setFilter(f)}
               className={cn(
                 "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                 filter === f ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
               )}
             >
               {f === 'all' ? 'Ver Todos' : f}
             </button>
           ))}
        </div>
      </header>

      {loading ? (
         <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {filteredAlerts.length === 0 ? (
             <div className="col-span-full py-20 text-center bg-white rounded-[32px] border border-dashed border-slate-200">
                <Bell className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Sin alertas en esta categoría</p>
             </div>
           ) : (
             filteredAlerts.map((alert) => (
               <div key={alert.id} className="bg-white rounded-[32px] p-6 border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-slate-300 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                       <div className="w-10 h-10 bg-slate-50 flex items-center justify-center rounded-xl text-slate-400">
                          {alert.entidad === 'bombero' ? <User className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
                       </div>
                       <div className={cn("px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest", getStatusColor(alert.estado))}>
                          {alert.estado}
                       </div>
                    </div>
                    
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-tight mb-2 italic">
                       {alert.nombre}
                    </h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo: {alert.tipo}</p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                     <div>
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Fecha Límite</p>
                        <p className="text-sm font-black text-slate-700">{alert.fechaVencimiento}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Días</p>
                        <p className={cn("text-xl font-black", alert.diasRestantes < 0 ? "text-red-600" : "text-slate-900")}>
                           {alert.diasRestantes}
                        </p>
                     </div>
                  </div>
               </div>
             ))
           )}
        </div>
      )}
    </div>
  );
}
