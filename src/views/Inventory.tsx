import React, { useState, useEffect } from 'react';
import { InventoryItem } from '../types';
import { Search, Plus, AlertTriangle, ArrowUpRight, ArrowDownRight, X } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import { cn } from '../lib/utils';
import { apiFetch } from '../lib/api';

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const { profile } = useAuth();
  const [newItem, setNewItem] = useState({ name: '', category: 'Insumos Médicos', quantity: 0, unit: 'u', minStock: 5 });

  const loadItems = async () => {
    try {
      const data = await apiFetch('/api/inventory');
      setItems(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!profile) return;
    loadItems();
    const interval = setInterval(loadItems, 5000);
    return () => clearInterval(interval);
  }, [profile]);

  const filteredItems = items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/inventory', {
        method: 'POST',
        body: JSON.stringify(newItem)
      });
      setShowModal(false);
      setNewItem({ name: '', category: 'Insumos Médicos', quantity: 0, unit: 'u', minStock: 5 });
      loadItems();
    } catch (err) {
      console.error(err);
    }
  };

  const updateQuantity = async (id: string, delta: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    try {
      await apiFetch(`/api/inventory/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity: Math.max(0, item.quantity + delta) })
      });
      loadItems();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Control de Stocks</h1>
          <p className="text-slate-500">Gestión de insumos, herramientas y equipos.</p>
        </div>
        {profile?.role !== 'firefighter' && (
          <button 
            onClick={() => setShowModal(true)}
            className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
          >
            <Plus className="w-5 h-5" />
            Agregar Insumo
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Buscar insumo..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 ring-red-500 outline-none shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => (
          <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col group hover:border-slate-300 transition-all">
            <div className="p-6 space-y-4 flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[.25em]">{item.category}</span>
                  <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight mt-1">{item.name}</h3>
                </div>
                {item.quantity <= item.minStock && (
                  <div className="p-2 bg-red-50 rounded-lg animate-pulse border border-red-100">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between py-6 border-y border-slate-50 border-dashed">
                <div>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-[.2em] mb-1">Stock Actual</p>
                  <p className={cn(
                    "text-4xl font-black tracking-tighter",
                    item.quantity <= item.minStock ? "text-red-600" : "text-slate-900"
                  )}>
                    {item.quantity} 
                    <span className="text-sm font-bold text-slate-300 ml-1 uppercase">{item.unit}</span>
                  </p>
                </div>
                
                {profile?.role !== 'firefighter' && (
                  <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-100">
                    <button 
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-red-50 hover:border-red-100 text-slate-400 hover:text-red-500 transition-all active:scale-90"
                    >
                      <ArrowDownRight className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-100 text-slate-400 hover:text-emerald-500 transition-all active:scale-90"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                <span className={item.quantity <= item.minStock ? "text-red-600" : "text-slate-500"}>Alerta: &lt;{item.minStock} {item.unit}</span>
                <span className="text-slate-300">ID: {item.id.slice(0, 8)}</span>
              </div>
            </div>
            
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic opacity-50">Sincronizado</span>
              <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Ver Trazabilidad</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Nuevo Insumo</h2>
              <button onClick={() => setShowModal(false)}><X className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Nombre</label>
                <input required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 ring-red-500 outline-none" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Categoría</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 ring-red-500 outline-none" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                    <option>Insumos Médicos</option>
                    <option>Equipamiento</option>
                    <option>Limpieza</option>
                    <option>Protección Personal</option>
                    <option>Otros</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Unidad</label>
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 ring-red-500 outline-none" value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Cant. Inicial</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 ring-red-500 outline-none" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Mínimo</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 ring-red-500 outline-none" value={newItem.minStock} onChange={e => setNewItem({...newItem, minStock: Number(e.target.value)})} />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20">Guardar Insumo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
