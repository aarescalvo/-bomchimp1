import React, { useState, useEffect } from 'react';
import { Incident } from '../types';
import { Flame, Plus, MapPin, Phone, User, Clock, X, MessageSquare, FileText, Share2 } from 'lucide-react';
import { formatDate, cn } from '../lib/utils';
import { useAuth } from '../components/AuthProvider';
import { apiFetch } from '../lib/api';

export default function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [showModal, setShowModal] = useState(false);
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    type: 'Incendio',
    address: '',
    callerName: '',
    phoneNumber: '',
    severity: 'medium',
    description: ''
  });

  const loadIncidents = async () => {
    try {
      const data = await apiFetch('/api/incidents');
      setIncidents(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!profile) return;
    loadIncidents();
    const interval = setInterval(loadIncidents, 5000);
    return () => clearInterval(interval);
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/incidents', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setShowModal(false);
      setFormData({ type: 'Incendio', address: '', callerName: '', phoneNumber: '', severity: 'medium', description: '' });
      loadIncidents();
    } catch (err) {
      console.error(err);
    }
  };

  const shareOnWhatsApp = (incident: Incident) => {
    const message = `🚨 *NUEVO INCIDENTE - B.V. CHIMPAY* 🚨\n\n` +
      `🔥 *Tipo:* ${incident.type}\n` +
      `📍 *Ubicación:* ${incident.address}\n` +
      `📝 *Detalle:* ${incident.description}\n` +
      `📞 *Contacto:* ${incident.callerName} (${incident.phoneNumber})\n\n` +
      `⚠️ *Gravedad:* ${incident.severity.toUpperCase()}\n` +
      `🔗 *Ver en Sistema:* ${window.location.origin}/incidents`;
    
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const exportIncidentToPDF = (incident: Incident) => {
    window.print();
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await apiFetch(`/api/incidents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      loadIncidents();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Incidentes y Llamadas</h1>
          <p className="text-slate-500">Registro en tiempo real de emergencias.</p>
        </div>
        {(profile?.role === 'admin' || profile?.role === 'operator') && (
          <button 
            onClick={() => setShowModal(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
          >
            <Plus className="w-5 h-5" />
            Nueva Llamada
          </button>
        )}
      </div>

      <div className="grid gap-4">
        {incidents.map((incident) => (
          <div key={incident.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row group hover:border-slate-300 transition-all">
            <div className={cn(
              "md:w-2 w-full",
              incident.severity === 'critical' ? 'bg-red-600' :
              incident.severity === 'high' ? 'bg-orange-500' : 'bg-blue-600'
            )} />
            
            <div className="flex-1 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-slate-400 tracking-tighter">#INC-{incident.id.slice(0, 6).toUpperCase()}</span>
                  <h3 className="font-black text-slate-900 uppercase tracking-tight">{incident.type}</h3>
                  <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-black uppercase tracking-widest border ${
                    incident.status === 'open' ? 'bg-red-50 text-red-700 border-red-100' :
                    incident.status === 'dispatched' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                    'bg-slate-50 text-slate-500 border-slate-100'
                  }`}>
                    {incident.status === 'open' ? 'Iniciado' : incident.status === 'dispatched' ? 'En Curso' : 'Finalizado'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                  <Clock className="w-3 h-3" />
                  {incident.timestamp ? formatDate(incident.timestamp) : '...'}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-8">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{incident.address}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{incident.callerName}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{incident.phoneNumber}</span>
                </div>
              </div>
              
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 border-dashed">
                <p className="text-xs text-slate-500 italic font-medium leading-relaxed">"{incident.description}"</p>
              </div>
            </div>
            
            <div className="bg-slate-50 border-t md:border-t-0 md:border-l border-slate-100 p-4 flex md:flex-col justify-center gap-2 min-w-[160px] print:hidden">
              <div className="flex gap-2 mb-2">
                <button 
                  onClick={() => shareOnWhatsApp(incident)}
                  className="flex-1 bg-emerald-50 text-emerald-600 p-2 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-all flex items-center justify-center"
                  title="Notificar WhatsApp"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => exportIncidentToPDF(incident)}
                  className="flex-1 bg-white border border-slate-200 text-slate-400 p-2 rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center"
                  title="Imprimir Ficha"
                >
                  <FileText className="w-4 h-4" />
                </button>
              </div>
              
              {incident.status === 'open' && (
                <button 
                  onClick={() => updateStatus(incident.id, 'dispatched')}
                  className="w-full bg-slate-900 text-white px-3 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all"
                >
                  Despachar
                </button>
              )}
              {incident.status === 'dispatched' && (
                <button 
                  onClick={() => updateStatus(incident.id, 'closed')}
                  className="w-full bg-emerald-600 text-white px-3 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all"
                >
                  Finalizar
                </button>
              )}
              <button 
                className="w-full bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                Abrir Mapa
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Nueva Llamada / Emergencia</h2>
              <button onClick={() => setShowModal(false)}><X className="text-slate-400" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Tipo</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 ring-red-500 outline-none"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option>Incendio</option>
                    <option>Accidente Vial</option>
                    <option>Rescate</option>
                    <option>Emergencia Médica</option>
                    <option>Otros</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Gravedad</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 ring-red-500 outline-none"
                    value={formData.severity}
                    onChange={(e) => setFormData({...formData, severity: e.target.value})}
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="critical">Crítica</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Dirección</label>
                <input 
                  type="text" 
                  required
                  placeholder="Calle, Altura, Localidad..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 ring-red-500 outline-none"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Solicitante</label>
                  <input 
                    type="text" 
                    placeholder="Nombre de quien llama"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 ring-red-500 outline-none"
                    value={formData.callerName}
                    onChange={(e) => setFormData({...formData, callerName: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Teléfono</label>
                  <input 
                    type="tel" 
                    placeholder="Número de contacto"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 ring-red-500 outline-none"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Descripción / Observaciones</label>
                <textarea 
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 ring-red-500 outline-none resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
              >
                REGISTRAR Y ALERTAR
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
