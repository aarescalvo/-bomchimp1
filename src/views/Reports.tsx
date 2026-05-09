import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  FileText, 
  Download, 
  Filter, 
  Calendar,
  TrendingUp,
  Activity,
  Award
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function Reports() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/reports/summary?mes=${month}&anio=${year}`);
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [month, year]);

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-6xl mx-auto font-sans">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Estadísticas y Reportes</h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[.3em] mt-2 italic">Balance Operativo Mensual de Jefatura</p>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex bg-white p-1 rounded-2xl border border-slate-200">
              <select 
                value={month} 
                onChange={e => setMonth(Number(e.target.value))}
                className="bg-transparent px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none border-r border-slate-100"
              >
                {Array.from({length: 12}).map((_, i) => (
                  <option key={i+1} value={i+1}>{format(new Date(2026, i, 1), 'MMMM', { locale: es })}</option>
                ))}
              </select>
              <select 
                value={year} 
                onChange={e => setYear(Number(e.target.value))}
                className="bg-transparent px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none"
              >
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
           </div>
           <button className="h-11 px-6 bg-slate-900 text-white rounded-2xl flex items-center gap-3 font-black uppercase tracking-widest text-[9px] shadow-lg shadow-slate-900/20 active:scale-95 transition-all">
              <Download className="w-4 h-4" /> Exportar PDF
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* KPI Row */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
              <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-4">
                 <Activity className="w-5 h-5" />
              </div>
              <p className="text-3xl font-black text-slate-900 leading-none">{data.salidas.reduce((a: any, b: any) => a + b.count, 0)}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 italic">Total Salidas Operativas</p>
           </div>
           <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                 <Award className="w-5 h-5" />
              </div>
              <p className="text-3xl font-black text-slate-900 leading-none">{data.habilitaciones.porcentaje.toFixed(1)}%</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 italic">Habilitación Nivel 1 (Dotación)</p>
           </div>
           <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                 <TrendingUp className="w-5 h-5" />
              </div>
              <p className="text-3xl font-black text-slate-900 leading-none">{data.ranking.length}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 italic">Bomberos con Presentismo</p>
           </div>
        </div>

        {/* Multi-charts Area */}
        <div className="lg:col-span-8 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
           <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-[.3em] mb-8 flex items-center gap-3">
              <Activity className="w-4 h-4 text-red-600" /> Distribución de Siniestros
           </h2>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={data.salidas} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="tipoServicio" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} textAnchor="end" height={60} interval={0} angle={-45} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} labelStyle={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '10px' }} />
                    <Bar dataKey="count" fill="#ef4444" radius={[8, 8, 0, 0]} barSize={40} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="lg:col-span-4 bg-slate-900 rounded-[32px] p-8 shadow-xl text-white">
           <h2 className="text-[10px] font-black uppercase tracking-[.3em] mb-8">Ranking Presentismo (Horas)</h2>
           <div className="space-y-6">
              {data.ranking.slice(0, 5).map((rank: any, i: number) => (
                <div key={rank.userName} className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <span className="text-xl font-black italic opacity-20 text-white w-4">{i + 1}</span>
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest">{rank.userName}</p>
                         <div className="w-32 h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                            <div className="h-full bg-red-600" style={{ width: `${(rank.totalHours / data.ranking[0].totalHours) * 100}%` }}></div>
                         </div>
                      </div>
                   </div>
                   <p className="text-lg font-black italic leading-none">{Math.round(rank.totalHours)}h</p>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
