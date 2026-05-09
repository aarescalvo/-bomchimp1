import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../components/AuthProvider';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trophy,
  Phone,
  User,
  Clock,
  DollarSign,
  Ban,
  CheckCircle2
} from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface Slot {
  time: string;
  status: 'libre' | 'reservado' | 'confirmado' | 'pagado' | 'bloqueado';
  data: any | null;
}

export default function Rentals() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [tarifas, setTarifas] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    clienteNombre: '',
    clienteTelefono: '',
    precioTotal: 1000,
    senia: 0,
    medioPagoSenia: 'efectivo',
    notas: ''
  });

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await apiFetch(`/api/cancha/disponibilidad?fecha=${dateStr}`);
      setSlots(response);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
    apiFetch('/api/cancha/tarifas').then(setTarifas);
  }, [selectedDate]);

  const handleCreateReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/cancha/turnos', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          fecha: format(selectedDate, 'yyyy-MM-dd'),
          horaInicio: selectedSlot.time,
          horaFin: selectedSlot.endTime
        })
      });
      setShowModal(false);
      fetchSlots();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSlotClick = (slot: Slot) => {
    if (slot.status === 'libre') {
      setSelectedSlot(slot);
      setShowModal(true);
      setFormData({
        clienteNombre: '',
        clienteTelefono: '',
        precioTotal: tarifas[0]?.precio || 1500,
        senia: 0,
        medioPagoSenia: 'efectivo',
        notas: ''
      });
    } else if (slot.status !== 'bloqueado') {
      setSelectedSlot(slot);
      setShowModal(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reservado': return 'bg-amber-100 border-amber-200 text-amber-700';
      case 'confirmado': return 'bg-blue-100 border-blue-200 text-blue-700';
      case 'pagado': return 'bg-emerald-100 border-emerald-200 text-emerald-700';
      case 'bloqueado': return 'bg-slate-100 border-slate-200 text-slate-400';
      default: return 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50';
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto font-sans">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-violet-600/20">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 leading-none">Gestión de Cancha</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 italic">Turnos y Alquileres Externos</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
          <button onClick={() => setSelectedDate(subDays(selectedDate, 1))} className="p-2 hover:bg-slate-50 rounded-lg"><ChevronLeft className="w-4 h-4 text-slate-400" /></button>
          <div className="px-4 text-center min-w-[140px]">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{format(selectedDate, 'EEEE', { locale: es })}</p>
            <p className="font-black text-slate-900 leading-tight">{format(selectedDate, 'd MMM yyyy', { locale: es })}</p>
          </div>
          <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="p-2 hover:bg-slate-50 rounded-lg"><ChevronRight className="w-4 h-4 text-slate-400" /></button>
        </div>
      </header>

      {/* Grid de Horarios */}
      <div className="bg-white rounded-[32px] border border-slate-200 p-6 shadow-sm overflow-hidden">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {slots.map((slot) => (
              <button
                key={slot.time}
                onClick={() => handleSlotClick(slot)}
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98]",
                  getStatusColor(slot.status)
                )}
              >
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-start min-w-[60px]">
                    <span className="text-sm font-black italic">{slot.time}</span>
                    <span className="text-[10px] font-bold opacity-50">{slot.endTime}</span>
                  </div>
                  
                  {slot.status === 'libre' ? (
                    <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest opacity-40">
                      <Plus className="w-3 h-3" /> Disponible
                    </div>
                  ) : (
                    <div className="flex flex-col items-start">
                      <span className="text-xs font-black uppercase tracking-tight">{slot.data?.clienteNombre || 'Horario Bloqueado'}</span>
                      {slot.data?.clienteTelefono && (
                        <span className="text-[9px] font-bold opacity-60 flex items-center gap-1 mt-1">
                          <Phone className="w-2 h-2" /> {slot.data.clienteTelefono}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {slot.status === 'pagado' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  {slot.status === 'reservado' && <DollarSign className="w-4 h-4 text-amber-500" />}
                  {slot.status === 'bloqueado' && <Ban className="w-4 h-4 text-slate-300" />}
                  <div className="text-[9px] font-black uppercase tracking-widest opacity-60">
                    {slot.status}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal - Reserva o Detalle */}
      {showModal && selectedSlot && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase italic">
                  {selectedSlot.status === 'libre' ? 'Nueva Reserva' : 'Detalle del Turno'}
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3" /> {selectedSlot.time} a {selectedSlot.endTime} — {format(selectedDate, 'dd/MM')}
                </p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-8">
              {selectedSlot.status === 'libre' ? (
                <form onSubmit={handleCreateReserva} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre del Cliente</label>
                      <input 
                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-800 outline-none focus:border-violet-600"
                        value={formData.clienteNombre}
                        onChange={e => setFormData({...formData, clienteNombre: e.target.value})}
                        required
                        placeholder="Ej: Daniel Martinez"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Celular</label>
                        <input 
                          className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-800"
                          value={formData.clienteTelefono}
                          onChange={e => setFormData({...formData, clienteTelefono: e.target.value})}
                          placeholder="2984..."
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Precio Total</label>
                        <input 
                          type="number"
                          className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-800"
                          value={formData.precioTotal}
                          onChange={e => setFormData({...formData, precioTotal: Number(e.target.value)})}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Seña en Pesos</label>
                        <input 
                          type="number"
                          className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-800"
                          value={formData.senia}
                          onChange={e => setFormData({...formData, senia: Number(e.target.value)})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Medio Pago Seña</label>
                        <select 
                          className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-800 outline-none"
                          value={formData.medioPagoSenia}
                          onChange={e => setFormData({...formData, medioPagoSenia: e.target.value})}
                        >
                          <option value="efectivo">Efectivo</option>
                          <option value="transferencia">Transferencia</option>
                          <option value="mercado_pago">Mercado Pago</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full h-14 bg-violet-600 text-white rounded-xl font-black uppercase tracking-[.2em] text-[10px] shadow-xl shadow-violet-600/20 active:scale-95 transition-all"
                  >
                    Confirmar Reserva
                  </button>
                </form>
              ) : (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xl font-black text-slate-900 uppercase italic leading-none">{selectedSlot.data.clienteNombre}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">{selectedSlot.data.clienteTelefono || 'Sin teléfono'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                      <div className="p-4 bg-slate-50 rounded-2xl">
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Precio Total</p>
                         <p className="text-lg font-black text-slate-900">${selectedSlot.data.precioTotal}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl">
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo deudor</p>
                         <p className={cn("text-lg font-black", selectedSlot.data.saldoPendiente > 0 ? "text-red-600" : "text-emerald-600")}>
                           ${selectedSlot.data.saldoPendiente}
                         </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {selectedSlot.data.estado !== 'pagado' && (
                      <button 
                        onClick={async () => {
                          const medio = prompt('Medio de pago (efectivo/transferencia/mp):');
                          if (medio) {
                            await apiFetch(`/api/cancha/turnos/${selectedSlot.data.id}/pagar-saldo`, { method: 'PATCH', body: JSON.stringify({ medioPagoSaldo: medio }) });
                            fetchSlots();
                            setShowModal(false);
                          }
                        }}
                        className="w-full h-14 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-[.2em] text-[10px] shadow-xl shadow-emerald-600/20 active:scale-95 transition-all"
                      >
                        Cobrar Saldo Pendiente
                      </button>
                    )}
                    <button 
                       onClick={async () => {
                         if (confirm('¿Cancelar reserva?')) {
                           await apiFetch(`/api/cancha/turnos/${selectedSlot.data.id}/cancelar`, { method: 'PATCH' });
                           fetchSlots();
                           setShowModal(false);
                         }
                       }}
                       className="w-full h-14 bg-white border border-red-100 text-red-600 rounded-xl font-black uppercase tracking-[.2em] text-[10px] active:scale-95 transition-all"
                    >
                      Cancelar Reserva
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
