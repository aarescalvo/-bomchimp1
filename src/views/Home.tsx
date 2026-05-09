import React, { useEffect, useState } from 'react';
import { Incident, ShiftRecord, InventoryItem, AgendaTask, Vehicle } from '../types';
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
  Activity,
  AlertCircle,
  GripVertical,
  Layout,
  Save,
  RotateCcw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, Reorder } from 'motion/react';
import { formatDate, cn } from '../lib/utils';
import { apiFetch } from '../lib/api';
import { useAuth } from '../components/AuthProvider';
import { useUiSettings } from '../components/UiSettingsProvider';

type WidgetId = 'stats' | 'incidents' | 'fleet' | 'shifts' | 'alerts' | 'tasks';

export default function Home() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activeShifts, setActiveShifts] = useState<ShiftRecord[]>([]);
  const [lowStock, setLowStock] = useState<InventoryItem[]>([]);
  const [todayTasks, setTodayTasks] = useState<AgendaTask[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  
  const { profile } = useAuth();
  const { theme, labels, updateTheme } = useUiSettings();

  // Load order from settings or use default
  const [widgetOrder, setWidgetOrder] = useState<WidgetId[]>(['stats', 'incidents', 'fleet', 'shifts', 'alerts', 'tasks']);

  useEffect(() => {
    async function loadData() {
      try {
        const [inc, shifts, inventory, tasks, fleet, expirationAlerts, uiConfig] = await Promise.all([
          apiFetch('/api/incidents'),
          apiFetch('/api/shifts/active'),
          apiFetch('/api/inventory'),
          apiFetch('/api/agenda'),
          apiFetch('/api/vehicles'),
          apiFetch('/api/alerts/expirations'),
          apiFetch('/api/ui-settings')
        ]);
        
        setIncidents(inc.slice(0, 5));
        setActiveShifts(shifts);
        setLowStock(inventory.filter((i: any) => i.quantity <= i.minStock));
        setTodayTasks(tasks.filter((t: any) => t.status !== 'completed'));
        setVehicles(fleet);
        setAlerts(expirationAlerts.filter((a: any) => {
          const diff = new Date(a.dueDate).getTime() - new Date().getTime();
          return diff < 30 * 24 * 60 * 60 * 1000;
        }));

        if (uiConfig.dashboard_order) {
          setWidgetOrder(uiConfig.dashboard_order);
        }
      } catch (err) {
        console.error(err);
      }
    }
    
    loadData();
    const interval = setInterval(loadData, 5000); 
    return () => clearInterval(interval);
  }, [profile]);

  const saveLayout = async () => {
    await apiFetch('/api/ui-settings', {
      method: 'POST',
      body: JSON.stringify({ key: 'dashboard_order', value: widgetOrder })
    });
    setIsEditing(false);
  };

  const renderWidget = (id: WidgetId) => {
    switch (id) {
      case 'stats':
        return (
          <div key="stats" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:col-span-12">
            {[
              { label: 'Ems. Activas', value: incidents.length, icon: Flame, color: 'text-red-900', bg: 'bg-red-500' },
              { label: 'Dotación', value: activeShifts.length, icon: Users, color: 'text-blue-900', bg: 'bg-blue-500' },
              { label: 'Flota Operativa', value: vehicles.filter(v => v.status === 'available').length, icon: Truck, color: 'text-emerald-900', bg: 'bg-emerald-500' },
              { label: 'Alertas Stock', value: lowStock.length, icon: AlertTriangle, color: 'text-amber-900', bg: 'bg-amber-500' },
            ].map((stat, i) => (
              <div key={stat.label} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden group">
                {isEditing && <GripVertical className="absolute top-4 left-4 w-4 h-4 text-slate-200" />}
                <div className={cn("absolute top-0 right-0 p-8 opacity-5 group-hover:scale-150 transition-transform duration-500", stat.color)}>
                  <stat.icon className="w-20 h-20" />
                </div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[.25em] mb-3">{stat.label}</p>
                <p className="text-5xl font-black tracking-tighter text-slate-950">{stat.value}</p>
              </div>
            ))}
          </div>
        );
      case 'incidents':
        return (
          <section key="incidents" className="space-y-4 lg:col-span-8 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative">
            {isEditing && <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[2px] rounded-[32px] z-10 flex items-center justify-center"><GripVertical className="w-8 h-8 text-slate-400" /></div>}
            <div className="flex items-center justify-between px-2">
              <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[.3em] flex items-center gap-3">
                <Flame className="w-4 h-4 text-red-600" /> Emergencias Activas
              </h2>
              <Link to="/incidents" className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><ArrowRight className="w-4 h-4 text-slate-400" /></Link>
            </div>
            <div className="overflow-hidden">
               <table className="w-full text-left">
                  <tbody className="divide-y divide-slate-50">
                    {incidents.length === 0 ? (
                      <tr><td className="py-12 text-center text-slate-300 text-[10px] uppercase font-black">Sin alertas activas</td></tr>
                    ) : (
                      incidents.map((incident) => (
                        <tr key={incident.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="py-4 px-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white"><Activity className="w-4 h-4" /></div>
                              <div>
                                <p className="font-black text-slate-900 uppercase text-xs">{incident.type}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase">{incident.address}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
               </table>
            </div>
          </section>
        );
      case 'fleet':
        return (
          <section key="fleet" className="space-y-4 lg:col-span-8 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative">
             {isEditing && <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[2px] rounded-[32px] z-10 flex items-center justify-center"><GripVertical className="w-8 h-8 text-slate-400" /></div>}
             <div className="flex items-center justify-between px-2">
                <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[.3em] flex items-center gap-3">
                  <Truck className="w-4 h-4 text-slate-400" /> Estatus de Flota
                </h2>
             </div>
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {vehicles.slice(0, 4).map(v => (
                  <div key={v.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">{v.name}</p>
                    <div className="flex items-center justify-between">
                       <span className="text-xs font-black uppercase text-slate-950">{v.plate}</span>
                       <div className={cn("w-2 h-2 rounded-full", v.status === 'available' ? 'bg-emerald-500' : 'bg-red-500')}></div>
                    </div>
                  </div>
                ))}
             </div>
          </section>
        );
      case 'shifts':
        return (
          <section key="shifts" className="lg:col-span-4 bg-slate-900 rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
            {isEditing && <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px] z-10 flex items-center justify-center"><GripVertical className="w-8 h-8 text-white/40" /></div>}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[11px] font-black text-white uppercase tracking-[.3em]">Guardia de Turno</h2>
              <Link to="/staff" className="p-2 hover:bg-white/10 rounded-lg transition-colors"><ArrowRight className="w-4 h-4 text-white/40" /></Link>
            </div>
            <div className="space-y-4">
               {activeShifts.slice(0, 3).map(shift => (
                 <div key={shift.id} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-black text-white text-[10px]">{shift.userName[0]}</div>
                    <p className="text-xs font-black text-white uppercase">{shift.userName}</p>
                 </div>
               ))}
               {activeShifts.length === 0 && <p className="text-[10px] font-black text-white/20 uppercase text-center py-8">Sin guardia activa</p>}
            </div>
          </section>
        );
      case 'alerts':
        return (
          <section key="alerts" className="lg:col-span-4 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative">
            {isEditing && <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[2px] rounded-[32px] z-10 flex items-center justify-center"><GripVertical className="w-8 h-8 text-slate-400" /></div>}
            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[.3em] mb-6 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" /> Vencimientos
            </h3>
            <div className="space-y-3">
               {alerts.length === 0 ? (
                 <p className="text-[10px] font-bold text-slate-300 italic uppercase">Todo al día</p>
               ) : (
                 alerts.slice(0, 3).map(alert => (
                   <div key={alert.id} className="p-3 bg-red-50 rounded-xl border border-red-100 flex items-center justify-between">
                     <span className="text-[9px] font-black uppercase text-red-900">{alert.targetName}</span>
                     <span className="text-[9px] font-black text-red-700">{alert.dueDate}</span>
                   </div>
                 ))
               )}
            </div>
          </section>
        );
      case 'tasks':
        return (
          <section key="tasks" className="lg:col-span-4 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative">
            {isEditing && <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[2px] rounded-[32px] z-10 flex items-center justify-center"><GripVertical className="w-8 h-8 text-slate-400" /></div>}
            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[.3em] mb-6 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-500" /> Próximas Tareas
            </h3>
            <div className="space-y-3">
               {todayTasks.slice(0, 3).map(task => (
                 <div key={task.id}>
                   <p className="text-[10px] font-black text-slate-900 uppercase">{task.title}</p>
                   <p className="text-[8px] font-black text-slate-300 uppercase mt-0.5">{task.dueDate}</p>
                 </div>
               ))}
               {todayTasks.length === 0 && <p className="text-[10px] font-bold text-slate-300 italic uppercase">Agenda limpia</p>}
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Comando Central</h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[.3em] mt-3">B.V. CHIMPAY — ESTADO OPERATIVO INTEGRAL</p>
        </div>
        
        {profile?.role === 'admin' && (
          <div className="flex gap-4">
            {isEditing ? (
              <>
                <button onClick={() => setIsEditing(false)} className="px-6 py-2 bg-slate-100 text-slate-500 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" /> Cancelar
                </button>
                <button onClick={saveLayout} className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-[9px] shadow-xl shadow-emerald-600/20 transition-all flex items-center gap-2">
                  <Save className="w-4 h-4" /> Guardar Diseño
                </button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-[9px] shadow-xl transition-all flex items-center gap-2">
                <Layout className="w-4 h-4" /> Editar Pantalla
              </button>
            )}
          </div>
        )}
      </header>

      {isEditing ? (
        <Reorder.Group axis="y" values={widgetOrder} onReorder={setWidgetOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {widgetOrder.map(id => (
            <Reorder.Item 
              key={id} 
              value={id} 
              className={cn(
                id === 'stats' || id === 'incidents' || id === 'fleet' ? "lg:col-span-8" : "lg:col-span-4",
                id === 'stats' && "lg:col-span-12"
              )}
            >
              {renderWidget(id)}
            </Reorder.Item>
          ))}
        </Reorder.Group>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {widgetOrder.map(id => (
            <div 
              key={id} 
              className={cn(
                id === 'stats' || id === 'incidents' || id === 'fleet' ? "lg:col-span-8" : "lg:col-span-4",
                id === 'stats' && "lg:col-span-12"
              )}
            >
              {renderWidget(id)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
