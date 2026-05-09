import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  FileText, 
  Download, 
  Share2, 
  Calendar, 
  Filter, 
  TrendingUp, 
  AlertCircle,
  Truck,
  Users,
  Flame,
  Wallet
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { formatDate, cn } from '../lib/utils';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  Cell,
  PieChart,
  Pie
} from 'recharts';

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const [incidents, finances, fleet, personnel] = await Promise.all([
          apiFetch('/api/incidents'),
          apiFetch('/api/finances'),
          apiFetch('/api/vehicles'),
          apiFetch('/api/firefighters')
        ]);

        // Process data for charts
        const incidentsByType = incidents.reduce((acc: any, curr: any) => {
          acc[curr.type] = (acc[curr.type] || 0) + 1;
          return acc;
        }, {});

        const chartData = Object.entries(incidentsByType).map(([name, value]) => ({ name, value }));

        const monthlyCashflow = [
          { month: 'Ene', income: 45000, expense: 32000 },
          { month: 'Feb', income: 52000, expense: 38000 },
          { month: 'Mar', income: 48000, expense: 41000 },
          { month: 'Abr', income: 61000, expense: 35000 },
        ];

        setStats({
          incidentsByType: chartData,
          monthlyCashflow,
          totalIncidents: incidents.length,
          activePersonnel: personnel.filter((p: any) => p.status === 'active').length,
          fleetStatus: fleet.length,
          criticalAlerts: 3 // Mocked for now
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [dateRange]);

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || !data.length) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).join(','));
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 print:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-indigo-600" />
            Análisis y Reportes
          </h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Estadísticas operativas y financieras del cuartel</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest outline-none"
          >
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
            <option value="365">Anual</option>
          </select>
          <button 
            onClick={handlePrint}
            className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-600"
            title="Imprimir Informe"
          >
            <FileText className="w-5 h-5" />
          </button>
          <button 
            onClick={() => exportToCSV(stats?.incidentsByType || [], 'reporte_incidencias')}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-slate-800 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" /> Exportar Datos
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
           <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center">
                <Flame className="w-5 h-5 text-red-600" />
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
           </div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Salidas</p>
           <h3 className="text-3xl font-black text-slate-900">{stats?.totalIncidents || 0}</h3>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
           <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-indigo-600" />
              </div>
              <span className="text-[10px] font-black text-emerald-500">+12%</span>
           </div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Balance de Caja</p>
           <h3 className="text-3xl font-black text-slate-900">$124.5k</h3>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
           <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
                <Truck className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-[10px] font-black text-slate-400">98% OK</span>
           </div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Móviles Activos</p>
           <h3 className="text-3xl font-black text-slate-900">{stats?.fleetStatus || 0}</h3>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm border-l-4 border-l-red-600">
           <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-700" />
              </div>
           </div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Vencimientos Próximos</p>
           <h3 className="text-3xl font-black text-red-700">{stats?.criticalAlerts || 0}</h3>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-600" /> Distribución de Siniestros
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.incidentsByType || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey="value" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40}>
                  {stats?.incidentsByType?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#4f46e5' : '#818cf8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> Evolución Financiera
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.monthlyCashflow || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={4} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={4} dot={{ r: 4, fill: '#ef4444' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 p-12 rounded-[48px] text-white overflow-hidden relative print:hidden">
         <div className="absolute top-0 right-0 p-24 opacity-5 pointer-events-none">
            <Share2 className="w-64 h-64" />
         </div>
         <div className="max-w-2xl relative z-10">
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Módulo de Alerta Inteligente</h2>
            <p className="text-slate-400 font-medium text-lg leading-relaxed mb-8">
              El sistema monitoriza constantemente los niveles de stock crítico, vencimientos de seguros de unidades y licencias de conductores para emitir alertas preventivas vía WhatsApp a la Comisión Directiva.
            </p>
            <div className="flex flex-wrap gap-4">
               <div className="px-6 py-4 bg-white/10 rounded-3xl border border-white/5 backdrop-blur-md">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Alertas WhatsApp</p>
                  <p className="font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Servicio Activo
                  </p>
               </div>
               <div className="px-6 py-4 bg-white/10 rounded-3xl border border-white/5 backdrop-blur-md">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Copia de Seguridad</p>
                  <p className="font-bold">Cada 24hs (Local)</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
