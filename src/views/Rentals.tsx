import React, { useState, useEffect } from 'react';
import { RentalReservation } from '../types';
import { Trophy, Plus, DollarSign, Clock, User, X } from 'lucide-react';
import { formatDate } from '../lib/utils';
import { useAuth } from '../components/AuthProvider';
import { apiFetch } from '../lib/api';

export default function Rentals() {
  const [rentals, setRentals] = useState<RentalReservation[]>([]);
  const [showModal, setShowModal] = useState(false);
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    startTime: '',
    endTime: '',
    price: 3500,
    paymentStatus: 'pending' as 'pending' | 'paid'
  });

  const loadRentals = async () => {
    try {
      const data = await apiFetch('/api/rentals');
      setRentals(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!profile) return;
    loadRentals();
    const interval = setInterval(loadRentals, 5000);
    return () => clearInterval(interval);
  }, [profile]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const rentalData = {
        ...formData,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
      };
      
      await apiFetch('/api/rentals', {
        method: 'POST',
        body: JSON.stringify(rentalData)
      });
  
      if (formData.paymentStatus === 'paid') {
        await apiFetch('/api/finances', {
          method: 'POST',
          body: JSON.stringify({
            amount: formData.price,
            category: 'Alquiler Cancha',
            description: `Pago alquiler: ${formData.customerName}`,
            type: 'income',
            recordedBy: profile?.displayName || 'Sistema'
          })
        });
      }
  
      setShowModal(false);
      setFormData({ customerName: '', customerPhone: '', startTime: '', endTime: '', price: 3500, paymentStatus: 'pending' });
      loadRentals();
    } catch (err) {
      console.error(err);
    }
  };

  const markAsPaid = async (rental: RentalReservation) => {
    try {
      await apiFetch(`/api/rentals/${rental.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ paymentStatus: 'paid' })
      });
      await apiFetch('/api/finances', {
        method: 'POST',
        body: JSON.stringify({
          amount: rental.price,
          category: 'Alquiler Cancha',
          description: `Pago alquiler: ${rental.customerName}`,
          type: 'income',
          recordedBy: profile?.displayName || 'Sistema'
        })
      });
      loadRentals();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gestión Deportiva</h1>
          <p className="text-slate-500 font-medium">Alquiler de cancha y control de ingresos extras.</p>
        </div>
        {profile?.role !== 'firefighter' && (
          <button 
            onClick={() => setShowModal(true)}
            className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
          >
            <Plus className="w-6 h-6" />
            Nueva Reserva
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {rentals.map(rental => (
          <div key={rental.id} className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm flex flex-col group hover:border-emerald-200 transition-all">
            <div className={`p-5 border-b flex items-center justify-between transition-colors ${rental.paymentStatus === 'paid' ? 'bg-emerald-50/50 border-emerald-50' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${rental.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-emerald-500 shadow-sm'}`}>
                  <Trophy className="w-5 h-5" />
                </div>
                <span className="font-black text-slate-900 text-sm tracking-tight">RESERVA #{rental.id.slice(0, 4).toUpperCase()}</span>
              </div>
              <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                rental.paymentStatus === 'paid' ? 'bg-emerald-600 text-white' : 'bg-amber-100 text-amber-600 border border-amber-200'
              }`}>
                {rental.paymentStatus === 'paid' ? 'Pagado' : 'Pendiente'}
              </span>
            </div>

            <div className="p-7 space-y-6 flex-1">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Titular</p>
                <div className="flex items-center gap-3 text-slate-900 font-bold group-hover:translate-x-1 transition-transform">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-xs text-slate-500">
                    {rental.customerName[0]}
                  </div>
                  {rental.customerName}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 bg-slate-50 rounded-2xl p-4 border border-slate-100 border-dashed">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Fecha</p>
                  <p className="text-sm font-black text-slate-700">{formatDate(rental.startTime).split(' ')[0]}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Desde</p>
                  <p className="text-sm font-black text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    {formatDate(rental.startTime).split(' ')[1]}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Tarifa</p>
                  <p className="text-3xl font-black text-slate-900 leading-none">${rental.price.toLocaleString()}</p>
                </div>
                {rental.paymentStatus === 'pending' && profile?.role !== 'firefighter' && (
                  <button 
                    onClick={() => markAsPaid(rental)}
                    className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                  >
                    COBRAR
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {rentals.length === 0 && (
          <div className="lg:col-span-3 py-32 text-center space-y-6">
             <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto grayscale opacity-50">
                <Trophy className="w-12 h-12 text-emerald-500" />
             </div>
             <div>
                <p className="text-slate-900 font-black text-xl">Sin reservas registradas</p>
                <p className="text-slate-400 font-medium">Comienza a gestionar el alquiler de la cancha hoy.</p>
             </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl space-y-8 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Registrar Turno</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
              >
                <X className="text-slate-400 w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAdd} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Titular de la Reserva</label>
                <input 
                  required 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-slate-900 focus:ring-4 ring-emerald-500/10 outline-none transition-all" 
                  placeholder="Nombre completo"
                  value={formData.customerName} 
                  onChange={e => setFormData({...formData, customerName: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Desde</label>
                  <input 
                    type="datetime-local" 
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 font-bold text-sm focus:ring-4 ring-emerald-500/10 outline-none" 
                    value={formData.startTime} 
                    onChange={e => setFormData({...formData, startTime: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hasta</label>
                  <input 
                    type="datetime-local" 
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 font-bold text-sm focus:ring-4 ring-emerald-500/10 outline-none" 
                    value={formData.endTime} 
                    onChange={e => setFormData({...formData, endTime: e.target.value})} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Precio Turno ($)</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 font-black text-slate-900 focus:ring-4 ring-emerald-500/10 outline-none" 
                    value={formData.price} 
                    onChange={e => setFormData({...formData, price: Number(e.target.value)})} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cobro</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 font-bold text-sm focus:ring-4 ring-emerald-500/10 outline-none" 
                    value={formData.paymentStatus} 
                    onChange={e => setFormData({...formData, paymentStatus: e.target.value as any})}
                  >
                    <option value="pending">Pendiente</option>
                    <option value="paid">Ya Pagó</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-emerald-600 text-white py-5 rounded-[1.5rem] font-black text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-95"
              >
                CONFIRMAR RESERVA
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
