import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../components/AuthProvider';
import { 
  ClipboardList, 
  Plus, 
  Send, 
  Clock, 
  AlertCircle,
  FileText,
  User,
  MoreHorizontal
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../lib/utils';

interface GuardiaLog {
  id: string;
  fecha: string;
  turno: string;
  jefeGuardia: string;
  personalPresente: string[];
  novedad: string;
  tipo: string;
  prioridad: string;
  userName: string;
  timestamp: string;
}

export default function Guardia() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<GuardiaLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [tipo, setTipo] = useState('operativa');
  const [prioridad, setPrioridad] = useState('normal');
  const [novedad, setNovedad] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [filters, setFilters] = useState({
    desde: '',
    hasta: '',
    tipo: '',
    prioridad: '',
    turno: ''
  });

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => {
        if (val) params.append(key, val);
      });
      const response = await apiFetch(`/api/guardia?${params.toString()}`);
      setLogs(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiFetch(`/api/guardia/${id}/read`, { method: 'PATCH' });
      setLogs(prev => prev.map(log => log.id === id ? { ...log, isRead: 1 } : log));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiFetch('/api/guardia', {
        method: 'POST',
        body: JSON.stringify({
          fecha: format(new Date(), 'yyyy-MM-dd'),
          turno: getCurrentTurno(),
          jefeGuardia: user?.displayName || 'Desconocido',
          personalPresente: [], // To be implemented with active shifts
          tipo,
          prioridad,
          novedad
        })
      });
      setNovedad('');
      setShowForm(false);
      fetchLogs();
    } catch (err) {
      alert('Error: ' + (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrentTurno = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 14) return 'mañana';
    if (hour >= 14 && hour < 22) return 'tarde';
    return 'noche';
  };

  return (
    <div className="max-w-md mx-auto h-full flex flex-col bg-slate-50 font-sans">
      {/* Header Fijo */}
      <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 flex items-center justify-center rounded-xl text-white">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-slate-800">Libreta de Guardia</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{format(new Date(), "EEEE d 'de' MMMM", { locale: es })}</p>
            </div>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className={cn(
              "w-10 h-10 flex items-center justify-center rounded-xl transition-all",
              showForm ? 'bg-slate-100 text-slate-600' : 'bg-red-600 text-white shadow-lg shadow-red-600/30'
            )}
          >
            {showForm ? <Plus className="w-6 h-6 rotate-45" /> : <Plus className="w-6 h-6" />}
          </button>
        </div>

        {/* Filtros Rápidos */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
           <select 
             value={filters.tipo} 
             onChange={e => setFilters({...filters, tipo: e.target.value})}
             className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-tight text-slate-500 outline-none focus:border-red-500 whitespace-nowrap"
           >
             <option value="">Todos los Tipos</option>
             <option value="operativa">Operativa</option>
             <option value="administrativa">Adm.</option>
             <option value="mantenimiento">Mant.</option>
           </select>
           <select 
             value={filters.prioridad} 
             onChange={e => setFilters({...filters, prioridad: e.target.value})}
             className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-tight text-slate-500 outline-none focus:border-red-500"
           >
             <option value="">Prioridad</option>
             <option value="normal">Normal</option>
             <option value="urgente">Urgente</option>
           </select>
        </div>
      </div>

      {/* Formulario Nueva Novedad */}
      {showForm && (
        <div className="bg-white border-b border-slate-200 p-4 animate-in slide-in-from-top duration-300">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo</label>
                <select 
                  value={tipo} 
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-3 font-bold text-slate-700 outline-none focus:border-red-500"
                >
                  <option value="operativa">Operativa</option>
                  <option value="administrativa">Administrativa</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Prioridad</label>
                <select 
                   value={prioridad} 
                   onChange={(e) => setPrioridad(e.target.value)}
                   className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-3 font-bold text-slate-700 outline-none focus:border-red-500"
                >
                  <option value="normal">Normal</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Descripción de la Novedad</label>
              <textarea 
                value={novedad}
                onChange={(e) => setNovedad(e.target.value)}
                placeholder="Escriba aquí la novedad..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-slate-700 outline-none focus:border-red-500 min-h-[100px]"
                required
              />
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 bg-red-600 text-white rounded-xl font-black uppercase tracking-[.2em] text-xs flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Registrando...' : 'Registrar Novedad'}
            </button>
          </form>
        </div>
      )}

      {/* Listado de Novedades */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center p-12 text-slate-400">
            <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-bold text-xs uppercase tracking-widest">No hay novedades registradas</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className={cn(
               "bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border transition-all space-y-3",
               log.prioridad === 'urgente' && !(log as any).isRead ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 dark:border-gray-800"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest",
                    log.prioridad === 'urgente' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600 dark:bg-gray-800 dark:text-gray-400'
                  )}>
                    {log.prioridad}
                  </span>
                  <span className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest border-l border-slate-200 dark:border-gray-800 pl-2">
                    {log.tipo}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <Clock className="w-3 h-3" />
                  {format(new Date(log.timestamp), 'HH:mm')}
                </div>
              </div>
              
              <p className="text-sm font-medium text-slate-700 dark:text-gray-300 leading-relaxed">
                {log.novedad}
              </p>

              <div className="pt-3 border-t border-slate-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-slate-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-slate-500">
                    <User className="w-3 h-3" />
                  </div>
                  <span className="text-[9px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest">{log.userName}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {log.prioridad === 'urgente' && !(log as any).isRead && (
                    <button 
                      onClick={() => handleMarkAsRead(log.id)}
                      className="px-3 py-1 bg-red-600 text-white text-[9px] font-black uppercase rounded-lg shadow-lg shadow-red-600/20 active:scale-95 transition-all"
                    >
                      Leído
                    </button>
                  )}
                  <button className="text-slate-300 hover:text-slate-600 dark:hover:text-gray-400">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
