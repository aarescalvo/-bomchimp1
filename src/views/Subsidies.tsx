import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  ArrowUpRight,
  ChevronRight,
  TrendingDown,
  Download,
  Building,
  Receipt
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { formatDate, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Subsidy, SubsidyExpense } from '../types';

export default function Subsidies() {
  const [subsidies, setSubsidies] = useState<Subsidy[]>([]);
  const [selectedSubsidy, setSelectedSubsidy] = useState<Subsidy | null>(null);
  const [expenses, setExpenses] = useState<SubsidyExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'subsidy' | 'expense'>('subsidy');

  const [subsidyForm, setSubsidyForm] = useState({
    name: '',
    origin: 'Nacional',
    resolutionNumber: '',
    amount: '',
    receivedDate: new Date().toISOString().split('T')[0],
    expirationDate: '',
  });

  const [expenseForm, setExpenseForm] = useState({
    category: 'Equipamiento',
    description: '',
    amount: '',
    invoiceNumber: '',
    vendor: '',
    date: new Date().toISOString().split('T')[0],
  });

  const loadSubsidies = async () => {
    try {
      const data = await apiFetch('/api/subsidies');
      setSubsidies(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadExpenses = async (subsidyId: string) => {
    try {
      const data = await apiFetch(`/api/subsidies/${subsidyId}/expenses`);
      setExpenses(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSubsidies();
  }, []);

  useEffect(() => {
    if (selectedSubsidy) {
      loadExpenses(selectedSubsidy.id);
    }
  }, [selectedSubsidy]);

  const handleCreateSubsidy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/subsidies', {
        method: 'POST',
        body: JSON.stringify({
          ...subsidyForm,
          amount: parseFloat(subsidyForm.amount),
          status: 'active'
        })
      });
      setShowModal(false);
      loadSubsidies();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubsidy) return;
    try {
      await apiFetch(`/api/subsidies/${selectedSubsidy.id}/expenses`, {
        method: 'POST',
        body: JSON.stringify({
          ...expenseForm,
          amount: parseFloat(expenseForm.amount)
        })
      });
      setShowModal(false);
      loadExpenses(selectedSubsidy.id);
      loadSubsidies(); // Refresh to update balances
    } catch (err) {
      console.error(err);
    }
  };

  const calculateRemaining = (subsidy: Subsidy) => {
    // In a real app, the server would probably provide this, 
    // but we can calculate it from the expenses we have or fetch all
    const spent = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    return subsidy.amount - spent;
  };

  const getExpensesTotal = () => expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
            <Wallet className="w-10 h-10 text-emerald-600" />
            Rendición de Subsidios
          </h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Gestión administrativa bajo leyes nacionales y provinciales</p>
        </div>
        <button 
          onClick={() => { setModalType('subsidy'); setShowModal(true); }}
          className="flex items-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:bg-slate-800 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Registrar Nuevo Subsidio
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: List of Subsidies */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm mb-6">
             <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="BUSCAR EXPEDIENTE..." 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all"
                />
             </div>
          </div>

          <div className="space-y-4">
            {subsidies.map((subsidy) => (
              <motion.button
                layoutId={subsidy.id}
                key={subsidy.id}
                onClick={() => setSelectedSubsidy(subsidy)}
                className={cn(
                  "w-full text-left p-6 rounded-[32px] border transition-all relative overflow-hidden group",
                  selectedSubsidy?.id === subsidy.id 
                    ? "bg-slate-900 border-slate-900 shadow-2xl scale-[1.02]" 
                    : "bg-white border-slate-200 hover:border-emerald-500 shadow-sm"
                )}
              >
                <div className="relative z-10">
                   <div className="flex items-center justify-between mb-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                        selectedSubsidy?.id === subsidy.id ? "bg-white/10 text-white" : "bg-emerald-50 text-emerald-600"
                      )}>{subsidy.origin}</span>
                      <span className={cn(
                        "text-[10px] font-black",
                        selectedSubsidy?.id === subsidy.id ? "text-white/40" : "text-slate-400"
                      )}>{formatDate(subsidy.receivedDate)}</span>
                   </div>
                   <h3 className={cn(
                     "text-lg font-black uppercase tracking-tight mb-1",
                     selectedSubsidy?.id === subsidy.id ? "text-white" : "text-slate-900"
                   )}>{subsidy.name}</h3>
                   <p className={cn(
                     "text-[10px] font-black uppercase tracking-widest mb-4",
                     selectedSubsidy?.id === subsidy.id ? "text-white/60" : "text-slate-400"
                   )}>Res. {subsidy.resolutionNumber}</p>
                   
                   <div className="mt-6 flex items-end justify-between">
                      <div>
                        <p className={cn("text-[8px] font-bold uppercase", selectedSubsidy?.id === subsidy.id ? "text-white/40" : "text-slate-400")}>Importe Total</p>
                        <p className={cn("text-xl font-black", selectedSubsidy?.id === subsidy.id ? "text-white" : "text-slate-900")}>
                          ${subsidy.amount.toLocaleString()}
                        </p>
                      </div>
                      <ChevronRight className={cn("w-5 h-5", selectedSubsidy?.id === subsidy.id ? "text-emerald-500" : "text-slate-200 group-hover:translate-x-1 transition-transform")} />
                   </div>
                </div>
                {selectedSubsidy?.id === subsidy.id && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-12 translate-x-12" />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Right Column: Details & Expenses */}
        <div className="lg:col-span-2">
          {selectedSubsidy ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-5">
                    <Building className="w-32 h-32" />
                  </div>
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                       <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">{selectedSubsidy.name}</h2>
                       <div className="flex flex-wrap gap-4">
                          <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl uppercase">
                            <FileText className="w-3 h-3 text-emerald-500" /> Exp: {selectedSubsidy.resolutionNumber}
                          </span>
                          <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl uppercase">
                            <Calendar className="w-3 h-3 text-amber-500" /> Vence: {selectedSubsidy.expirationDate}
                          </span>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[.2em] mb-1 text-right">Saldo Remanente</p>
                       <p className="text-4xl font-black text-emerald-600">${calculateRemaining(selectedSubsidy).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                     <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Subsidio</p>
                        <p className="text-xl font-black text-slate-900">${selectedSubsidy.amount.toLocaleString()}</p>
                     </div>
                     <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Rendido</p>
                        <p className="text-xl font-black text-red-600">${getExpensesTotal().toLocaleString()}</p>
                     </div>
                     <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Ejecución</p>
                        <div className="flex items-center gap-3">
                           <p className="text-xl font-black text-slate-900">{Math.round((getExpensesTotal() / selectedSubsidy.amount) * 100)}%</p>
                           <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500 transition-all duration-1000" 
                                style={{ width: `${(getExpensesTotal() / selectedSubsidy.amount) * 100}%` }} 
                              />
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="bg-white rounded-[48px] border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between">
                     <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-emerald-600" /> Comprobantes Cargados
                     </h3>
                     <button 
                      onClick={() => { setModalType('expense'); setShowModal(true); }}
                      className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-xl hover:shadow-2xl transition-all"
                     >
                        <Plus className="w-4 h-4" /> Cargar Nuevo Gasto
                     </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50">
                          <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase">Fecha / Factura</th>
                          <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase">Proveedor / Detalle</th>
                          <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase">Categoría</th>
                          <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase text-right">Importe</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {expenses.map((expense) => (
                          <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-10 py-6">
                               <p className="text-xs font-black text-slate-900">{formatDate(expense.date)}</p>
                               <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Nro: {expense.invoiceNumber}</p>
                            </td>
                            <td className="px-6 py-6">
                               <p className="text-xs font-black text-slate-900 uppercase">{expense.vendor}</p>
                               <p className="text-[10px] font-medium text-slate-500 mt-1">{expense.description}</p>
                            </td>
                            <td className="px-6 py-6">
                               <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-black text-slate-600 uppercase tracking-widest">
                                 {expense.category}
                               </span>
                            </td>
                            <td className="px-6 py-6 text-right">
                               <div className="flex items-center justify-end gap-2">
                                  <p className="text-sm font-black text-slate-900">${expense.amount.toLocaleString()}</p>
                                  <button className="p-2 opacity-0 group-hover:opacity-100 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all">
                                    <Download className="w-3.5 h-3.5 text-slate-400" />
                                  </button>
                               </div>
                            </td>
                          </tr>
                        ))}
                        {expenses.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-10 py-20 text-center text-slate-400">
                               <Receipt className="w-12 h-12 mx-auto mb-4 opacity-10" />
                               <p className="text-xs font-black uppercase tracking-widest">No hay gastos rendidos aún</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-10 bg-slate-50 flex items-center justify-between border-t border-slate-100">
                     <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                        <p className="text-xs font-bold text-slate-500">
                          Todos los gastos deben estar acompañados por su factura legal B o C y el remito correspondiente según Ley 25.054.
                        </p>
                     </div>
                     <button className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
                        <Download className="w-4 h-4" /> Bajar Planilla Completa
                     </button>
                  </div>
               </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-slate-50/50 rounded-[48px] border-2 border-dashed border-slate-200 p-20">
               <div className="text-center max-w-sm">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                    <Wallet className="w-10 h-10 text-slate-200" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-4">Módulo de Subsidios</h3>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest leading-relaxed">
                    Seleccione un subsidio de la lista lateral para visualizar el detalle de ejecución presupuestaria y comprobantes.
                  </p>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Overlay */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                  {modalType === 'subsidy' ? 'Nuevo Subsidio' : 'Cargar Comprobante'}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                  <AlertCircle className="w-6 h-6 rotate-45 text-slate-400" />
                </button>
              </div>

              <form onSubmit={modalType === 'subsidy' ? handleCreateSubsidy : handleCreateExpense} className="p-8 space-y-6">
                {modalType === 'subsidy' ? (
                  <>
                    <div className="grid md:grid-cols-2 gap-6">
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificación (Nombre)</label>
                          <input 
                            required 
                            placeholder="Mantenimiento de Cuartel..." 
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-emerald-500 transition-all"
                            value={subsidyForm.name}
                            onChange={(e) => setSubsidyForm({...subsidyForm, name: e.target.value})}
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Origen</label>
                          <select 
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none appearance-none"
                            value={subsidyForm.origin}
                            onChange={(e) => setSubsidyForm({...subsidyForm, origin: e.target.value})}
                          >
                            <option value="Nacional">Nacional (Ley 25.054)</option>
                            <option value="Provincial">Provincial</option>
                            <option value="Municipal">Municipal</option>
                          </select>
                       </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nro de Resolución</label>
                          <input 
                            required 
                            placeholder="001/2024" 
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none"
                            value={subsidyForm.resolutionNumber}
                            onChange={(e) => setSubsidyForm({...subsidyForm, resolutionNumber: e.target.value})}
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Importe Total ($)</label>
                          <input 
                            required 
                            type="number"
                            placeholder="0.00" 
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none"
                            value={subsidyForm.amount}
                            onChange={(e) => setSubsidyForm({...subsidyForm, amount: e.target.value})}
                          />
                       </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Recepción</label>
                          <input 
                            required 
                            type="date"
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none"
                            value={subsidyForm.receivedDate}
                            onChange={(e) => setSubsidyForm({...subsidyForm, receivedDate: e.target.value})}
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Rendición Máx.</label>
                          <input 
                            required 
                            type="date"
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none"
                            value={subsidyForm.expirationDate}
                            onChange={(e) => setSubsidyForm({...subsidyForm, expirationDate: e.target.value})}
                          />
                       </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid md:grid-cols-2 gap-6">
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría del Gasto</label>
                          <select 
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none"
                            value={expenseForm.category}
                            onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                          >
                            <option value="Equipamiento">Equipamiento</option>
                            <option value="Vehículos">Vehículos / Móviles</option>
                            <option value="Infraestructura">Infraestructura</option>
                            <option value="Operatividad">Gastos Operativos (Combustible, etc)</option>
                            <option value="Capacitación">Capacitación</option>
                          </select>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Importe ($)</label>
                          <input 
                            required 
                            type="number"
                            placeholder="0.00" 
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none"
                            value={expenseForm.amount}
                            onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                          />
                       </div>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Proveedor / Razón Social</label>
                       <input 
                        required 
                        placeholder="NOMBRE DEL VENDEDOR O EMPRESA" 
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none uppercase"
                        value={expenseForm.vendor}
                        onChange={(e) => setExpenseForm({...expenseForm, vendor: e.target.value})}
                       />
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nro de Factura</label>
                          <input 
                            required 
                            placeholder="0001-00001234" 
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none"
                            value={expenseForm.invoiceNumber}
                            onChange={(e) => setExpenseForm({...expenseForm, invoiceNumber: e.target.value})}
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Factura</label>
                          <input 
                            required 
                            type="date"
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none"
                            value={expenseForm.date}
                            onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                          />
                       </div>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción del Bien/Servicio</label>
                       <textarea 
                        required 
                        rows={3} 
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none resize-none"
                        value={expenseForm.description}
                        onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                       />
                    </div>
                  </>
                )}
                
                <button 
                  type="submit"
                  className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-[.2em] text-xs shadow-2xl hover:bg-slate-800 transition-all active:scale-[0.98] mt-4"
                >
                  Confirmar Registro
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
