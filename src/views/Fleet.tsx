import React, { useState, useEffect } from 'react';
import { Vehicle, VehicleTool, MaintenanceLog } from '../types';
import { apiFetch } from '../lib/api';
import { 
  Truck, 
  Plus, 
  Hammer, 
  Wrench, 
  History, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  ChevronRight,
  Clock,
  Calendar,
  Droplets
} from 'lucide-react';
import { formatDate, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Fleet() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [tools, setTools] = useState<VehicleTool[]>([]);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [scuba, setScuba] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'vehicle' | 'tool' | 'maintenance' | 'scuba'>('vehicle');

  const [formData, setFormData] = useState({
    name: '',
    plate: '',
    type: 'Autobomba',
    model: '',
    year: new Date().getFullYear(),
    status: 'available',
    nextMaintenance: ''
  });

  const [scubaForm, setScubaForm] = useState({
    serialNumber: '',
    capacity: 6.0,
    pressure: 300,
    status: 'ready',
    nextHydrostatic: ''
  });

  const loadVehicles = async () => {
    try {
      const [vData, sData] = await Promise.all([
        apiFetch('/api/vehicles'),
        apiFetch('/api/scuba')
      ]);
      setVehicles(vData);
      setScuba(sData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicleDetails = async (v: Vehicle) => {
    try {
      const [toolData, logData] = await Promise.all([
        apiFetch(`/api/vehicles/${v.id}/tools`),
        apiFetch(`/api/vehicles/${v.id}/maintenance`)
      ]);
      setTools(toolData);
      setLogs(logData);
      setSelectedVehicle(v);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/vehicles', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setShowModal(false);
      loadVehicles();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid lg:grid-cols-12 gap-8">
      {/* List of Vehicles */}
      <div className="lg:col-span-4 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
            <Truck className="w-6 h-6 text-red-600" />
            Flota Operativa
          </h2>
          <button 
            onClick={() => { setModalType('vehicle'); setShowModal(true); }}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <Plus className="w-5 h-5 text-red-600" />
          </button>
        </div>

        <div className="space-y-4">
          {vehicles.map((v) => (
            <button
              key={v.id}
              onClick={() => loadVehicleDetails(v)}
              className={cn(
                "w-full text-left p-5 rounded-3xl border transition-all relative group overflow-hidden",
                selectedVehicle?.id === v.id 
                  ? "bg-white border-red-600/30 shadow-xl shadow-red-600/5 ring-1 ring-red-600/10" 
                  : "bg-white border-slate-200 hover:border-slate-300"
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">{v.type}</p>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{v.name}</h3>
                  <p className="text-xs font-bold text-slate-400 font-mono mt-0.5">{v.plate}</p>
                </div>
                <div className={cn(
                  "px-2 py-1 round-lg text-[8px] font-black uppercase tracking-widest",
                  v.status === 'available' ? "text-emerald-500" : "text-amber-500"
                )}>
                  {v.status === 'available' ? '• Disponible' : '• Ocupado'}
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                  <div className="flex items-center gap-1.5 uppercase">
                    <Calendar className="w-3 h-3" /> {v.year}
                  </div>
                </div>
                <ChevronRight className={cn("w-4 h-4 transition-transform", selectedVehicle?.id === v.id ? "rotate-90 text-red-600" : "text-slate-300")} />
              </div>
            </button>
          ))}
          {vehicles.length === 0 && (
            <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <Truck className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">No hay vehículos registrados</p>
            </div>
          )}
        </div>
      </div>

      {/* Details View */}
      <div className="lg:col-span-8">
        {selectedVehicle ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                <Truck className="w-64 h-64 -rotate-12" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                    {selectedVehicle.status}
                  </span>
                  <span className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-white/60">
                    Mod. {selectedVehicle.model}
                  </span>
                </div>
                <h1 className="text-5xl font-black uppercase tracking-tighter mb-2">{selectedVehicle.name}</h1>
                <div className="flex flex-wrap items-center gap-6 mt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Próx. Manto.</p>
                      <p className="font-bold text-sm">{selectedVehicle.nextMaintenance || '--/--/--'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Estado Gral.</p>
                      <p className="font-bold text-sm">Operativo</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* ERA Cylinders / SCUBA */}
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden col-span-2">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-blue-500" /> Control de Cilindros ERA (SCUBA)
                  </h3>
                  <button 
                    onClick={() => { setModalType('scuba'); setShowModal(true); }}
                    className="p-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all"
                  >
                    <Plus className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
                <div className="grid md:grid-cols-3 gap-6 p-6">
                  {scuba.map((tank) => (
                    <div key={tank.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                      <div className="flex items-center justify-between mb-3">
                         <span className="text-[10px] font-black uppercase text-slate-400">#{tank.serialNumber}</span>
                         <span className={cn(
                           "px-2 py-0.5 rounded text-[8px] font-black uppercase",
                           tank.status === 'ready' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                         )}>{tank.status}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                           <p className="text-sm font-black text-slate-900">{tank.pressure} Bar</p>
                           <p className="text-[10px] font-bold text-slate-500">{tank.capacity}L</p>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                           <div 
                            className={cn("h-full transition-all", tank.pressure > 200 ? "bg-emerald-500" : tank.pressure > 100 ? "bg-amber-500" : "bg-red-500")} 
                            style={{ width: `${(tank.pressure / 300) * 100}%` }}
                           />
                        </div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-3">Hidrostática: {tank.nextHydrostatic}</p>
                      </div>
                    </div>
                  ))}
                  {scuba.length === 0 && (
                    <div className="p-12 text-center opacity-40 col-span-3">
                      <p className="text-xs font-bold uppercase tracking-widest">Sin cilindros cargados</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tools Inventory */}
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <Hammer className="w-5 h-5 text-slate-400" /> Herramientas Asignadas
                  </h3>
                  <button className="text-red-600 hover:scale-110 transition-transform">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="divide-y divide-slate-100">
                  {tools.map((t) => (
                    <div key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 uppercase">{t.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">CANT: {t.quantity}</p>
                        </div>
                      </div>
                      <span className="text-[8px] font-black p-1 bg-slate-100 rounded uppercase tracking-tighter">{t.status}</span>
                    </div>
                  ))}
                  {tools.length === 0 && (
                    <div className="p-12 text-center opacity-40">
                      <p className="text-xs font-bold uppercase tracking-widest">Sin herramientas cargadas</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Maintenance History */}
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <History className="w-5 h-5 text-slate-400" /> Historial de Manto.
                  </h3>
                  <button className="text-red-600 hover:scale-110 transition-transform">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-6">
                  {logs.map((log) => (
                    <div key={log.id} className="relative pl-6 border-l-2 border-slate-100">
                      <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center">
                        <div className={cn("w-1.5 h-1.5 rounded-full", log.type === 'preventive' ? 'bg-emerald-500' : 'bg-red-500')} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{log.date}</p>
                        <p className="text-xs font-black text-slate-900 uppercase mt-0.5">{log.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-tight">
                            {log.type === 'preventive' ? 'Preventivo' : 'Correctivo'}
                          </span>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">${log.cost}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <div className="p-12 text-center opacity-40">
                      <p className="text-xs font-bold uppercase tracking-widest">Sin historial registrado</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full min-h-[600px] bg-white rounded-[48px] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-center p-12">
            <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <Truck className="w-16 h-16 text-slate-200" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Seleccione una Unidad</h3>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2 max-w-xs">
              Debe seleccionar un vehículo para visualizar su inventario, historial de mantenimiento y disponibilidad
            </p>
          </div>
        )}
      </div>

      {/* Basic Vehicle Creation Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div onClick={() => setShowModal(false)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-lg bg-white rounded-3xl p-8 shadow-2xl">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-6">Nueva Unidad</h2>
              <form onSubmit={handleSubmitVehicle} className="space-y-4">
                <input 
                  placeholder="Nombre Unidad (EJ: Movil 1)" 
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                />
                <input 
                  placeholder="Patente" 
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold"
                  value={formData.plate} onChange={e => setFormData({...formData, plate: e.target.value})}
                />
                <input 
                  placeholder="Tipo (EJ: Autobomba)" 
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold"
                  value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}
                />
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    placeholder="Modelo" 
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold"
                    value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})}
                  />
                  <input 
                    type="number" 
                    placeholder="Año" 
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold"
                    value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})}
                  />
                </div>
                <button type="submit" className="w-full py-4 bg-red-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-red-600/20">
                  Guardar Vehículo
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
