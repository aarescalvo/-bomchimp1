import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../components/AuthProvider';
import { 
  Users, 
  Calendar, 
  Clock, 
  Download, 
  Activity,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AttendanceSummary {
  firefighterId: string;
  name: string;
  rank: string;
  totalHours: number;
  requiredHours: number;
  hoursRemaining: number;
  complianceStatus: 'ok' | 'at_risk' | 'non_compliant';
  sessions: number;
  byActivityType: {
    guard: number;
    training: number;
    drill: number;
    maintenance: number;
    special: number;
  };
}

export default function Attendance() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [summary, setSummary] = useState<AttendanceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'ok' | 'at_risk' | 'non_compliant'>('all');
  const { profile } = useAuth();

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/attendance/summary?month=${month}`);
      setSummary(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [month]);

  const filtered = summary.filter(s => filterStatus === 'all' || s.complianceStatus === filterStatus);

  const exportExcel = () => {
    window.open(`/api/export/attendance?month=${month}`, '_blank');
  };

  const exportPdf = () => {
    window.open(`/api/export/attendance/pdf?month=${month}`, '_blank');
  };

  const changeMonth = (offset: number) => {
    const d = new Date(month + '-01');
    d.setMonth(d.getMonth() + offset);
    setMonth(format(d, 'yyyy-MM'));
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Presentismo</h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-[.2em] mt-1 italic">Control de horas y cumplimiento del cuerpo activo</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-1 shadow-sm">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-xl transition-all">
              <ChevronLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div className="px-4 text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white w-40 text-center">
              {format(new Date(month + '-01'), 'MMMM yyyy', { locale: es })}
            </div>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-xl transition-all">
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          
          <button 
            onClick={exportExcel}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
          >
            <Download className="w-4 h-4" /> Excel
          </button>
          <button 
            onClick={exportPdf}
            className="flex items-center gap-2 px-5 py-3 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
          >
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Todos', value: 'all', color: 'slate' },
          { label: 'Cumplen', value: 'ok', color: 'emerald' },
          { label: 'En Riesgo', value: 'at_risk', color: 'amber' },
          { label: 'Incumplen', value: 'non_compliant', color: 'red' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilterStatus(f.value as any)}
            className={cn(
              "p-6 rounded-[32px] border transition-all text-left group relative overflow-hidden",
              filterStatus === f.value 
                ? "bg-slate-900 dark:bg-red-600 border-transparent text-white shadow-xl" 
                : "bg-white dark:bg-gray-900 border-slate-100 dark:border-gray-800 text-slate-900 dark:text-white hover:border-slate-300"
            )}
          >
            <p className={cn(
              "text-[9px] font-black uppercase tracking-widest mb-1",
              filterStatus === f.value ? "text-white/60" : "text-slate-400"
            )}>Estado</p>
            <h3 className="text-xl font-black uppercase italic">{f.label}</h3>
            <div className={cn(
              "absolute -right-4 -bottom-4 opacity-5 transition-transform group-hover:scale-110",
              filterStatus === f.value ? "text-white" : "text-slate-900"
            )}>
              <Activity className="w-24 h-24" />
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[40px] border border-slate-100 dark:border-gray-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50 dark:border-gray-800">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[.2em]">Bombero / Rango</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[.2em] text-center">Sesiones</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[.2em] text-center">Horas Realizadas</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[.2em] text-center">Requeridas</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[.2em] text-center">% Cumplimiento</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[.2em] text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-gray-800">
              {filtered.map((s) => {
                const percent = Math.min(100, Math.round((s.totalHours / s.requiredHours) * 100));
                return (
                  <tr key={s.firefighterId} className="group hover:bg-slate-50/50 dark:hover:bg-gray-800/30 transition-all cursor-pointer">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-red-50 dark:group-hover:bg-red-900/20 group-hover:text-red-500 transition-all">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{s.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.rank}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center text-sm font-bold text-slate-400">{s.sessions}</td>
                    <td className="px-8 py-6 text-center">
                      <span className="text-sm font-black text-slate-900 dark:text-white uppercase italic">{s.totalHours}h</span>
                    </td>
                    <td className="px-8 py-6 text-center text-sm font-bold text-slate-400">{s.requiredHours}h</td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-24 h-1.5 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-1000",
                              s.complianceStatus === 'ok' ? "bg-emerald-500" : s.complianceStatus === 'at_risk' ? "bg-amber-500" : "bg-red-500"
                            )}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{percent}%</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center">
                        <span className={cn(
                          "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2",
                          s.complianceStatus === 'ok' ? "bg-emerald-100 text-emerald-600" : s.complianceStatus === 'at_risk' ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"
                        )}>
                          {s.complianceStatus === 'ok' ? (
                            <><CheckCircle2 className="w-3 h-3" /> Al Día</>
                          ) : s.complianceStatus === 'at_risk' ? (
                            <><TrendingUp className="w-3 h-3" /> En Riesgo</>
                          ) : (
                            <><AlertTriangle className="w-3 h-3" /> Incumple</>
                          )}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
