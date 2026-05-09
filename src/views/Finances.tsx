import React, { useState, useEffect } from 'react';
import { FinancialTransaction } from '../types';
import { Wallet, Plus, ArrowUpRight, ArrowDownRight, Search, TrendingUp, Landmark, X, Clock } from 'lucide-react';
import { formatDate } from '../lib/utils';
import { useAuth } from '../components/AuthProvider';
import { apiFetch } from '../lib/api';

export default function Finances() {
  const [txs, setTxs] = useState<FinancialTransaction[]>([]);
  const [showModal, setShowModal] = useState(false);
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    amount: 0,
    category: 'Varios',
    description: '',
    type: 'income' as 'income' | 'expense'
  });

  const loadFinances = async () => {
    try {
      const data = await apiFetch('/api/finances');
      setTxs(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!profile) return;
    loadFinances();
    const interval = setInterval(loadFinances, 5000);
    return () => clearInterval(interval);
  }, [profile]);

  const totalBalance = txs.reduce((acc, curr) => curr.type === 'income' ? acc + curr.amount : acc - curr.amount, 0);
  const incomes = txs.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
  const expenses = txs.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/finances', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          recordedBy: profile?.displayName || 'Administrador'
        })
      });
      setShowModal(false);
      setFormData({ amount: 0, category: 'Varios', description: '', type: 'income' });
      loadFinances();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gestión Financiera</h1>
          <p className="text-slate-500 font-medium">Control de caja chica, ingresos de alquileres y gastos operativos.</p>
        </div>
        {profile?.role === 'admin' && (
          <button 
            onClick={() => setShowModal(true)}
            className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl active:scale-95"
          >
            <Plus className="w-6 h-6" />
            Nuevo Movimiento
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Card */}
          <div className="bg-slate-900 text-white p-10 rounded-[3rem] space-y-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-64 h-64 bg-red-600 rounded-full translate-x-32 -translate-y-32 blur-3xl opacity-20 group-hover:opacity-30 transition-opacity" />
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10">
              <div>
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                  <Landmark className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[.3em]">Balance de Tesorería</span>
                </div>
                <h2 className="text-6xl font-black tracking-tighter leading-none">${totalBalance.toLocaleString()}</h2>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                 <div className="flex-1 md:flex-none py-3 px-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 leading-none">Ingresos</p>
                    <p className="text-xl font-black text-emerald-400">${incomes.toLocaleString()}</p>
                 </div>
                 <div className="flex-1 md:flex-none py-3 px-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 leading-none">Egresos</p>
                    <p className="text-xl font-black text-red-400">${expenses.toLocaleString()}</p>
                 </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-white/5 relative z-10">
               <div className="flex items-center gap-2 text-xs font-bold text-slate-500 tracking-wide">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  Actualizado en tiempo real
               </div>
               <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white/50" />
               </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-black text-slate-900 tracking-tight flex items-center gap-2 uppercase text-xs">
                 <Clock className="w-4 h-4 text-slate-400" />
                 Historial de Transacciones
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                <input className="bg-white border-0 text-xs font-bold rounded-full pl-9 pr-4 py-2 w-48 shadow-sm focus:ring-0 outline-none" placeholder="Buscar..." />
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              {txs.map(tx => (
                <div key={tx.id} className="p-6 flex items-center gap-6 hover:bg-slate-50 transition-all group">
                  <div className={`p-4 rounded-[1.25rem] transition-transform group-hover:scale-110 ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {tx.type === 'income' ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-lg tracking-tight truncate">{tx.description || 'Movimiento de Caja'}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[.2em] flex items-center gap-2">
                       <span className={tx.type === 'income' ? 'text-emerald-500' : 'text-red-500'}>{tx.category}</span>
                       <span className="text-slate-200">|</span>
                       {tx.timestamp ? formatDate(tx.timestamp) : '...'}
                    </p>
                  </div>
                  <div className={`text-2xl font-black tracking-tighter ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
                  </div>
                </div>
              ))}
              {txs.length === 0 && (
                 <div className="py-20 text-center text-slate-400 font-medium">No hay movimientos registrados.</div>
              )}
            </div>
          </div>
        </div>

        {/* Categories Analysis */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-8">
            <h4 className="font-black text-slate-900 tracking-tight text-lg">Distribución por Categoría</h4>
            <div className="space-y-6">
              {Array.from(new Set(txs.map(t => t.category))).map(cat => {
                const amount = txs.filter(t => t.category === cat).reduce((a, b) => b.type === 'income' ? a + b.amount : a - b.amount, 0);
                const percentage = Math.min(100, Math.max(0, (Math.abs(amount) / Math.max(1, incomes)) * 100));
                return (
                  <div key={cat} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cat}</span>
                      <span className={`text-sm font-black ${amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        ${Math.abs(amount).toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${amount >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl space-y-8 animate-in fade-in zoom-in duration-200">
             <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Nuevo Movimiento</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
              >
                <X className="text-slate-400 w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAdd} className="space-y-6">
              <div className="flex p-1.5 bg-slate-100 rounded-2xl">
                <button type="button" onClick={() => setFormData({...formData, type: 'income'})} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${formData.type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>Ingreso</button>
                <button type="button" onClick={() => setFormData({...formData, type: 'expense'})} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${formData.type === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}>Egreso</button>
              </div>
              <div className="space-y-2 text-center py-4 bg-slate-50 rounded-3xl border border-slate-100 border-dashed">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Monto en Pesos</label>
                <div className="flex items-center justify-center gap-2">
                   <span className="text-4xl font-black text-slate-200">$</span>
                   <input 
                    type="number" 
                    required 
                    className="bg-transparent border-0 font-black text-5xl text-slate-900 focus:ring-0 outline-none w-full text-center p-0" 
                    value={formData.amount} 
                    onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</label>
                <select className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-sm focus:ring-4 ring-slate-900/5 outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <optgroup label="Ingresos">
                    <option value="alquiler_cancha">Alquiler Cancha</option>
                    <option value="ingreso_subsidio_nacional">Subsidio Nacional</option>
                    <option value="ingreso_subsidio_provincial">Subsidio Provincial</option>
                    <option value="ingreso_donacion">Donación</option>
                    <option value="otros_ingresos">Otros Ingresos</option>
                  </optgroup>
                  <optgroup label="Egresos">
                    <option value="combustible">Combustible</option>
                    <option value="mantenimiento_unidades">Mantenimiento Unidades</option>
                    <option value="mantenimiento_edilicio">Mantenimiento Edilicio</option>
                    <option value="seguros">Seguros</option>
                    <option value="servicios">Servicios (Luz/Gas/Tel)</option>
                    <option value="materiales_operativos">Materiales Operativos</option>
                    <option value="sueldos_viaticos">Sueldos/Viáticos</option>
                    <option value="otros_egresos">Otros Egresos</option>
                  </optgroup>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</label>
                <input 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-sm focus:ring-4 ring-slate-900/5 outline-none" 
                  placeholder="Ej: Pago luz mes Mayo"
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black text-lg hover:bg-slate-800 transition-all shadow-xl active:scale-95"
              >
                REGISTRAR MOVIMIENTO
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
